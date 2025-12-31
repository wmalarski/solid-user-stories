import {
  type Accessor,
  type Component,
  type ParentProps,
  createContext,
  createMemo,
  useContext,
} from "solid-js";
import type { BoardModel } from "~/integrations/tanstack-db/schema";

const createBoardContextState = (board: BoardModel) => {
  return { board };
};

const BoardContext = createContext<Accessor<ReturnType<typeof createBoardContextState>>>(() => {
  throw new Error("TransformStateContext not defined");
});

export const useBoardContext = () => {
  return useContext(BoardContext);
};

export const useBoardId = () => {
  const context = useContext(BoardContext);
  return createMemo(() => context().board.id);
};

type BoardContextProviderProps = ParentProps<{
  board: BoardModel;
}>;

export const BoardContextProvider: Component<BoardContextProviderProps> = (props) => {
  const value = createMemo(() => createBoardContextState(props.board));

  return <BoardContext.Provider value={value}>{props.children}</BoardContext.Provider>;
};
