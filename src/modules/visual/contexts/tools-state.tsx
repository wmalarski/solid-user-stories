import {
  type Component,
  type ParentProps,
  createContext,
  createSignal,
  useContext,
} from "solid-js";

export type ToolType = "pane" | "selector" | "create-task";

const createToolsStateContext = () => {
  const [tool, setTool] = createSignal<ToolType>("pane");

  return [tool, { onToolChage: setTool }] as const;
};

const ToolsStateContext = createContext<ReturnType<typeof createToolsStateContext> | null>(null);

export const useToolsStateContext = () => {
  const context = useContext(ToolsStateContext);
  if (!context) {
    throw new Error("ToolsStateContext not defined");
  }
  return context;
};

export const ToolsStateProvider: Component<ParentProps> = (props) => {
  const value = createToolsStateContext();

  return <ToolsStateContext.Provider value={value}>{props.children}</ToolsStateContext.Provider>;
};

export const useDialogBoardToolUtils = () => {
  const [_tool, { onToolChage }] = useToolsStateContext();

  const onClick = () => {
    onToolChage("selector");
  };

  const onClose = () => {
    onToolChage("pane");
  };

  return { onClick, onClose };
};
