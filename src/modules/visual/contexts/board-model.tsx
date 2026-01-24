import {
  type Accessor,
  type Component,
  type ParentProps,
  createContext,
  createMemo,
  useContext,
} from "solid-js";
import type { BoardModel } from "~/integrations/tanstack-db/schema";

const createBoardModelContext = (board: BoardModel) => {
  return board;
};

const BoardModelContext = createContext<Accessor<ReturnType<typeof createBoardModelContext>>>(
  () => {
    throw new Error("BoardModelContext not defined");
  },
);

export const useBoardModelContext = () => {
  return useContext(BoardModelContext);
};

export const useBoardId = () => {
  const context = useBoardModelContext();
  return createMemo(() => context().id);
};

type BoardModelProviderProps = ParentProps<{
  board: BoardModel;
}>;

export const BoardModelProvider: Component<BoardModelProviderProps> = (props) => {
  const value = createMemo(() => createBoardModelContext(props.board));

  return <BoardModelContext.Provider value={value}>{props.children}</BoardModelContext.Provider>;
};
