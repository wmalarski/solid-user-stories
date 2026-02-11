import {
  createContext,
  createEffect,
  createMemo,
  onCleanup,
  useContext,
  type Accessor,
  type Component,
  type ParentProps,
} from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { BoardSchema, type BoardInstance } from "~/integrations/jazz/schema";

import { mapToBoardModel, type BoardModel } from "./board-model";
import { getSectionConfig } from "./section-configs";

const createBoardStateContext = (board: Accessor<BoardInstance>) => {
  const [store, setStore] = createStore<BoardModel>({
    edges: [],
    sectionsX: [],
    sectionsY: [],
    tasks: [],
  });

  const boardId = createMemo(() => board().$jazz.id);
  createEffect(() => {
    const boardIdValue = boardId();
    onCleanup(
      BoardSchema.subscribe(boardIdValue, {}, (value) => {
        setStore(reconcile(mapToBoardModel(value)));
      }),
    );
  });

  const sectionXConfigs = createMemo(() => getSectionConfig(store.sectionsX));
  const sectionYConfigs = createMemo(() => getSectionConfig(store.sectionsY));

  return {
    board,
    sectionXConfigs,
    sectionYConfigs,
    store,
  };
};

export type BoardStateContextValue = ReturnType<typeof createBoardStateContext>;

const BoardStateContext = createContext<BoardStateContextValue | null>(null);

export const useBoardStateContext = () => {
  const context = useContext(BoardStateContext);
  if (!context) {
    throw new Error("BoardStateContext is not defined");
  }
  return context;
};

type BoardStateProviderProps = ParentProps<{
  board: BoardInstance;
}>;

export const BoardStateProvider: Component<BoardStateProviderProps> = (props) => {
  const value = createBoardStateContext(() => props.board);

  return <BoardStateContext.Provider value={value}>{props.children}</BoardStateContext.Provider>;
};
