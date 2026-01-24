import {
  type Accessor,
  type Component,
  type ParentProps,
  createContext,
  createMemo,
  createSignal,
  useContext,
} from "solid-js";

type SelectionValue = {
  id: string;
  kind: "edge" | "task";
};

const createSelectionStateContext = () => {
  const [selection, setSelection] = createSignal<SelectionValue | null>(null);

  return [selection, { onSelectionChange: setSelection }] as const;
};

const SelectionStateContext = createContext<ReturnType<typeof createSelectionStateContext> | null>(
  null,
);

export const SelectionStateProvider: Component<ParentProps> = (props) => {
  const value = createSelectionStateContext();

  return (
    <SelectionStateContext.Provider value={value}>{props.children}</SelectionStateContext.Provider>
  );
};

export const useSelectionStateContext = () => {
  const context = useContext(SelectionStateContext);
  if (!context) {
    throw new Error("SelectionStateContext is not defined");
  }
  return context;
};

export const useIsSelected = (elementId: Accessor<string>) => {
  const [selection] = useSelectionStateContext();
  return createMemo(() => selection()?.id === elementId());
};
