import type {
  CollectionConfig,
  DeleteMutationFnParams,
  InsertMutationFnParams,
  SyncConfig,
  UpdateMutationFnParams,
  UtilsRecord,
} from "@tanstack/solid-db";
import type * as v from "valibot";

type WebSocketMessage<T> = {
  type: "insert" | "update" | "delete" | "sync" | "transaction" | "ack";
  data?: T | T[];
  mutations?: {
    type: "insert" | "update" | "delete";
    data: T;
    id?: string;
  }[];
  transactionId?: string;
  id?: string;
};

type WebSocketUtils = UtilsRecord & {
  reconnect: () => void;
  getConnectionState: () => "connected" | "disconnected" | "connecting";
};

// oxlint-disable-next-line typescript/no-explicit-any
type AnyObjectSchema = v.ObjectSchema<any, any>;

type WebSocketCollectionConfig<
  TSchema extends AnyObjectSchema,
  TKey extends string | number = string | number,
> = Omit<
  CollectionConfig<v.InferOutput<TSchema>, TKey, TSchema, WebSocketUtils>,
  "onInsert" | "onUpdate" | "onDelete" | "sync" | "schema"
> & {
  schema: TSchema;
  url: string;
  reconnectInterval?: number;
};
// Note: onInsert/onUpdate/onDelete are handled by the WebSocket connection
// Users don't provide these handlers

// oxlint-disable-next-line func-style
export function webSocketCollectionOptions<
  TSchema extends AnyObjectSchema,
  TKey extends string | number = string | number,
>(
  config: WebSocketCollectionConfig<TSchema, TKey>,
): CollectionConfig<v.InferOutput<TSchema>, TKey, never, WebSocketUtils> & {
  utils: WebSocketUtils;
} {
  type TItem = v.InferOutput<TSchema>;

  let websocket: WebSocket | null = null;
  let reconnectTimer: NodeJS.Timeout | null = null;
  let connectionState: "connected" | "disconnected" | "connecting" = "disconnected";

  // Track pending transactions awaiting acknowledgment
  const pendingTransactions = new Map<
    string,
    {
      resolve: () => void;
      reject: (error: Error) => void;
      timeout: NodeJS.Timeout;
    }
  >();

  const sync: SyncConfig<TItem, TKey>["sync"] = (params) => {
    const { begin, write, commit, markReady } = params;

    // oxlint-disable-next-line func-style
    function connect() {
      connectionState = "connecting";
      websocket = new WebSocket(config.url);

      // oxlint-disable-next-line unicorn/prefer-add-event-listener
      websocket.onopen = () => {
        connectionState = "connected";
        // Request initial sync
        websocket?.send(JSON.stringify({ type: "sync" }));
      };

      // oxlint-disable-next-line unicorn/prefer-add-event-listener
      websocket.onmessage = (event) => {
        const message: WebSocketMessage<TItem> = JSON.parse(event.data);

        // oxlint-disable-next-line default-case
        switch (message.type) {
          case "sync": {
            // Initial sync with array of items
            begin();
            if (Array.isArray(message.data)) {
              for (const item of message.data) {
                write({ type: "insert", value: item });
              }
            }
            commit();
            markReady();
            break;
          }

          case "insert":
          case "update":
          case "delete": {
            // Real-time updates from other clients
            begin();
            write({
              type: message.type,
              value: message.data as TItem,
            });
            commit();
            break;
          }

          case "ack": {
            // Server acknowledged our transaction
            if (message.transactionId) {
              const pending = pendingTransactions.get(message.transactionId);
              if (pending) {
                clearTimeout(pending.timeout);
                pendingTransactions.delete(message.transactionId);
                pending.resolve();
              }
            }
            break;
          }

          case "transaction": {
            // Server sending back the actual data after processing our transaction
            if (message.mutations) {
              begin();
              for (const mutation of message.mutations) {
                write({
                  type: mutation.type,
                  value: mutation.data,
                });
              }
              commit();
            }
            break;
          }
        }
      };

      // oxlint-disable-next-line unicorn/prefer-add-event-listener
      websocket.onerror = (error) => {
        // oxlint-disable-next-line no-console
        console.error("WebSocket error:", error);
        connectionState = "disconnected";
      };

      // oxlint-disable-next-line unicorn/prefer-add-event-listener
      websocket.onclose = () => {
        connectionState = "disconnected";
        // Auto-reconnect
        reconnectTimer ??= setTimeout(() => {
            reconnectTimer = null;
            connect();
          }, config.reconnectInterval ?? 5000);
      };
    }

    // Start connection
    connect();

    // Return cleanup function
    return () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      if (websocket) {
        websocket.close();
        websocket = null;
      }
    };
  };

  // Helper function to send transaction and wait for server acknowledgment
  // oxlint-disable-next-line require-await
  const sendTransaction = async (
    params:
      | InsertMutationFnParams<TItem, TKey, WebSocketUtils>
      | UpdateMutationFnParams<TItem, TKey, WebSocketUtils>
      | DeleteMutationFnParams<TItem, TKey, WebSocketUtils>,
  ): Promise<void> => {
    if (websocket?.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket not connected");
    }

    const transactionId = crypto.randomUUID();

    // Convert all mutations in the transaction to the wire format
    const mutations = params.transaction.mutations.map((mutation) => ({
      data:
        // oxlint-disable-next-line no-nested-ternary
        mutation.type === "delete"
          ? undefined
          : // oxlint-disable-next-line unicorn/no-nested-ternary
            mutation.type === "update"
            ? mutation.changes
            : mutation.modified,
      id: mutation.key,
      type: mutation.type,
    }));

    // Send the entire transaction at once
    websocket.send(
      JSON.stringify({
        mutations,
        transactionId,
        type: "transaction",
      }),
    );

    // Wait for server acknowledgment
    // oxlint-disable-next-line promise/avoid-new
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        pendingTransactions.delete(transactionId);
        reject(new Error(`Transaction ${transactionId} timed out`));
      }, 10000);
      // 10 second timeout

      pendingTransactions.set(transactionId, {
        reject,
        resolve,
        timeout,
      });
    });
  };

  // All mutation handlers use the same transaction sender
  const onInsert = async (params: InsertMutationFnParams<TItem, TKey, WebSocketUtils>) => {
    await sendTransaction(params);
  };

  const onUpdate = async (params: UpdateMutationFnParams<TItem, TKey, WebSocketUtils>) => {
    await sendTransaction(params);
  };

  const onDelete = async (params: DeleteMutationFnParams<TItem, TKey, WebSocketUtils>) => {
    await sendTransaction(params);
  };

  return {
    getKey: config.getKey,
    id: config.id,
    onDelete,
    onInsert,
    onUpdate,
    // oxlint-disable-next-line typescript/no-explicit-any
    schema: config.schema as any,
    sync: { sync },
    utils: {
      getConnectionState: () => connectionState,
      reconnect: () => {
        if (websocket) {
          websocket.close();
        }
        // connect();
      },
    },
  };
}
