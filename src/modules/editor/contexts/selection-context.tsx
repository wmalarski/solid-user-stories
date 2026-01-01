import {
  type Accessor,
  type Component,
  type ParentProps,
  createContext,
  createMemo,
  createSignal,
  useContext,
} from "solid-js";

const createSelectionContext = () => {
  const [selection, setSelection] = createSignal<string[]>([]);

  const addSelection = (selection: string[]) => {
    setSelection((current) => [...current, ...selection]);
  };

  const removeSelection = (selection: string[]) => {
    setSelection((current) => current.filter((value) => !selection.includes(value)));
  };

  const toggleSelection = (selection: string[]) => {
    setSelection((current) => {
      const currentSet = new Set(current);

      for (const entry of selection) {
        if (currentSet.has(entry)) {
          currentSet.delete(entry);
        } else {
          currentSet.add(entry);
        }
      }

      return [...currentSet];
    });
  };

  return { addSelection, removeSelection, selection, setSelection, toggleSelection };
};

const SelectionContext = createContext<Accessor<ReturnType<typeof createSelectionContext>>>(() => {
  throw new Error("SelectionContext not defined");
});

export const useSelectionContext = () => {
  return useContext(SelectionContext);
};

export const SelectionContextProvider: Component<ParentProps> = (props) => {
  const value = createMemo(() => createSelectionContext());

  return <SelectionContext.Provider value={value}>{props.children}</SelectionContext.Provider>;
};
