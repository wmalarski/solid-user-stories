import { JazzBrowserContextManager } from "jazz-tools/browser";
import {
  createContext,
  createEffect,
  createResource,
  onCleanup,
  Show,
  useContext,
  type Accessor,
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

const useJazzContext = () => {
  const value = useContext(JazzContext);
  if (!value) {
    throw new Error("ToolsStateContext not defined");
  }
  return value;
};

export const useJazzBrowserContext = () => {
  const value = useJazzContext();
  return value.context;
};

export const WithJazz: Component<ParentProps> = (props) => {
  const context = useJazzContext();
  return <Show when={context.isLoaded()}>{props.children}</Show>;
};

export const createJazzAccountValue = (id: Accessor<string>) => {
  const [account] = createResource(
    () => ({ id: id() }),
    async ({ id }) => {
      const model = await BoardAccount.load(id);
      return model.$isLoaded ? model : null;
    },
  );

  createEffect(() => {
    const accountValue = account();

    if (!accountValue) {
      return;
    }

    console.log("[accountValue]", accountValue);

    const unsubscribe = accountValue.$jazz.subscribe((value) => {
      console.log("[value]", value);
    });

    onCleanup(() => {
      unsubscribe();
    });
    //
  });

  return account;
};

export const useJazzCurrentAccount = () => {
  const jazzContext = useJazzBrowserContext();

  return createJazzAccountValue(() => {
    const currentValue = jazzContext.getCurrentValue();
    if (!currentValue || !("me" in currentValue)) {
      throw new Error("Error");
    }
    const me = currentValue.me as { $jazz: { id: string } };
    return me.$jazz.id;
  });
};
