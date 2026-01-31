import { JazzBrowserContextManager } from "jazz-tools/browser";
import {
  createContext,
  createResource,
  useContext,
  type Component,
  type ParentProps,
} from "solid-js";
import type { BoardAccount } from "./schema";

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

export const useJazzCurrentAccount = () => {
  const jazzContext = useJazzContext();

  if (!jazzContext || !("me" in jazzContext)) {
    throw new Error("Error");
  }

  return jazzContext.me;
};
