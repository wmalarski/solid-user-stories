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

  return {
    selection,
    setSelection,
  };
};

const SelectionStateContext = createContext<
  Accessor<ReturnType<typeof createSelectionStateContext>>
>(() => {
  throw new Error("SelectionStateContext is not defined");
});

export const SelectionStateProvider: Component<ParentProps> = (props) => {
  const value = createMemo(() => createSelectionStateContext());

  return (
    <SelectionStateContext.Provider value={value}>{props.children}</SelectionStateContext.Provider>
  );
};

export const useSelectionStateContext = () => {
  return useContext(SelectionStateContext);
};

export const useIsSelected = (elementId: Accessor<string>) => {
  const context = useSelectionStateContext();
  return createMemo(() => context().selection()?.id === elementId());
};
