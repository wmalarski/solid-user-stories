import {
  type Accessor,
  type Component,
  type ParentProps,
  createContext,
  createMemo,
  createSignal,
  useContext,
} from "solid-js";

export type ToolType = "pane" | "selector" | "create-task";

const createToolsStateContext = () => {
  const [tool, setTool] = createSignal<ToolType>("pane");

  return { setTool, tool };
};

const ToolsStateContext = createContext<Accessor<ReturnType<typeof createToolsStateContext>>>(
  () => {
    throw new Error("ToolsStateContext not defined");
  },
);

export const useToolsStateContext = () => {
  return useContext(ToolsStateContext);
};

export const ToolsStateProvider: Component<ParentProps> = (props) => {
  const value = createMemo(() => createToolsStateContext());

  return <ToolsStateContext.Provider value={value}>{props.children}</ToolsStateContext.Provider>;
};
