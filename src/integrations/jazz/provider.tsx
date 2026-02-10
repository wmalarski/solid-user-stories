import { JazzBrowserContextManager } from "jazz-tools/browser";
import {
  createContext,
  createMemo,
  createResource,
  Show,
  useContext,
  type Component,
  type ParentProps,
} from "solid-js";
import { createJazzResourceSubscription } from "./create-jazz-resource-subscription";
import { BoardAccount } from "./schema";

const createJazzContext = () => {
  const context = new JazzBrowserContextManager<typeof BoardAccount>();

  const [isLoaded] = createResource(async () => {
    const apiKey = import.meta.env.VITE_JAZZ_API_KEY;
    await context.createContext({
      AccountSchema: BoardAccount,
      sync: {
        peer: `wss://cloud.jazz.tools?key=${apiKey}`,
      },
    });
    return true;
  });

  const account = createMemo(() => {
    if (!isLoaded()) {
      return;
    }

    const currentValue = context.getCurrentValue();
    if (!currentValue || !("me" in currentValue)) {
      throw new Error("Error");
    }
    const id = currentValue.me.$jazz.id;

    return createJazzResourceSubscription(() => ({
      id,
      key: "PROVIDER",
      options: { resolve: { root: true } },
      schema: BoardAccount,
    }));
  });

  return {
    get account() {
      return account()?.();
    },
    context,
  };
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
  return value;
};

export const useJazzAccount = () => {
  const value = useContext(JazzContext);
  return createMemo(() => {
    const account = value?.account;
    if (!account) {
      throw new Error("ToolsStateContext not defined");
    }
    return account;
  });
};

export const WithJazz: Component<ParentProps> = (props) => {
  const context = useJazzContext();
  return <Show when={context.account?.root.$isLoaded}>{props.children}</Show>;
};
