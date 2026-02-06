import { JazzBrowserContextManager } from "jazz-tools/browser";
import {
  createContext,
  createResource,
  Show,
  useContext,
  type Component,
  type ParentProps,
} from "solid-js";
import { BoardAccount } from "./schema";

const createJazzContext = () => {
  const context = new JazzBrowserContextManager<typeof BoardAccount>();

  const [isLoaded] = createResource(async () => {
    const apiKey = import.meta.env.VITE_JAZZ_API_KEY;
    await context.createContext({
      sync: {
        peer: `wss://cloud.jazz.tools?key=${apiKey}`,
      },
    });
    return true;
  });

  return { context, isLoaded };
};

const JazzContext = createContext<ReturnType<typeof createJazzContext> | null>(null);

export const JazzProvider: Component<ParentProps> = (props) => {
  const contextManager = createJazzContext();

  return <JazzContext.Provider value={contextManager}>{props.children}</JazzContext.Provider>;
};

export const useJazzContext = () => {
  const value = useContext(JazzContext);
  if (!value) {
    throw new Error("ToolsStateContext not defined");
  }
  return value.context;
};

export const useIsJazzLoaded = () => {
  const value = useContext(JazzContext);
  if (!value) {
    throw new Error("ToolsStateContext not defined");
  }
  return value.isLoaded;
};

export const WithJazz: Component<ParentProps> = (props) => {
  const isLoaded = useIsJazzLoaded();

  return <Show when={isLoaded()}>{props.children}</Show>;
};

export const useJazzCurrentAccount = () => {
  const jazzContext = useJazzContext();
  const currentValue = jazzContext.getCurrentValue();

  if (!currentValue || !("me" in currentValue)) {
    throw new Error("Error");
  }

  const me = currentValue.me as { $jazz: { id: string } };

  const [account] = createResource(
    () => ({ id: me.$jazz.id }),
    async () => {
      const model = await BoardAccount.load(me.$jazz.id);
      return model.$isLoaded ? model : null;
    },
  );

  return account;
};

const JazzBoardList: Component = () => {
  // const boards = useLiveQuery((q) => q.from({ board: boardsCollection }));

  const account = useJazzCurrentAccount();

  // account()?.$jazz.loadingState

  createEffect(() => {
    const value = account();
    if (value?.root?.$isLoaded && value.root.boards?.$isLoaded) {
      value.root.boards.$jazz.subscribe((value) => {
        console.log("[value]", value);
      });
    }
  });

  return (
    <pre>
      {/* oxlint-disable-next-line typescript/no-explicit-any */}
      {JSON.stringify(account(), null, 2)}
    </pre>
  );
};
