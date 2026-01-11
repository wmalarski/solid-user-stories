import * as d3 from "d3";
import {
  type Accessor,
  type Component,
  type ParentProps,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  useContext,
} from "solid-js";

const createSelectionStateContext = () => {
  const [selection, setSelection] = createSignal<string[]>([]);

  return { selection, setSelection };
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

type UseSelectionArgs = {
  ref: Accessor<SVGElement | undefined>;
};

export const useSelection = (args: UseSelectionArgs) => {
  const selectionState = useSelectionStateContext();

  const onSelection = (event: any) => {
    console.log("EVENT", event, selectionState().selection());
    // selectionState().setTransform(event.transform);
  };

  createEffect(() => {
    const refValue = args.ref();

    if (!refValue) {
      return;
    }

    const plugin = d3.brush().keyModifiers(true).on("brush", onSelection);

    // oxlint-disable-next-line no-explicit-any
    d3.select(refValue).call(plugin as any);
  });
};
