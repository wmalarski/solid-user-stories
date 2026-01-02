import { eq, useLiveQuery } from "@tanstack/solid-db";
import {
  type Accessor,
  type Component,
  type ParentProps,
  createContext,
  createMemo,
  useContext,
} from "solid-js";
import { axisCollection } from "~/integrations/tanstack-db/collections";
import type { AxisModel, BoardModel } from "~/integrations/tanstack-db/schema";

const createBoardContextState = (board: BoardModel, axisEntries: AxisModel[]) => {
  const axisValues = getAxisValues(axisEntries);
  return { axis: axisValues, board };
};

const BoardContext = createContext<Accessor<ReturnType<typeof createBoardContextState>>>(() => {
  throw new Error("TransformStateContext not defined");
});

export const useBoardContext = () => {
  return useContext(BoardContext);
};

export const useBoardId = () => {
  const context = useBoardContext();
  return createMemo(() => context().board.id);
};

type BoardContextProviderProps = ParentProps<{
  board: BoardModel;
}>;

export const BoardContextProvider: Component<BoardContextProviderProps> = (props) => {
  const axis = useLiveQuery((q) =>
    q.from({ axis: axisCollection }).where(({ axis }) => eq(axis.boardId, props.board.id)),
  );

  const value = createMemo(() => createBoardContextState(props.board, axis.data));

  return <BoardContext.Provider value={value}>{props.children}</BoardContext.Provider>;
};

const getPositions = (collection: AxisModel[]) => {
  return collection.reduce(
    (previous, current) => {
      const last = previous.at(-1) ?? 0;
      previous.push(last + current.size);
      return previous;
    },
    [0],
  );
};

const getAxisValues = (entries: AxisModel[]) => {
  const horizontal: AxisModel[] = [];
  const vertical: AxisModel[] = [];

  for (const entry of entries) {
    const array = entry.orientation === "horizontal" ? horizontal : vertical;
    array.push(entry);
  }

  const horizontalPositions = getPositions(horizontal);
  const verticalPositions = getPositions(vertical);

  return {
    horizontal: {
      axis: horizontal,
      positions: horizontalPositions,
    },
    vertical: {
      axis: vertical,
      positions: verticalPositions,
    },
  } as const;
};
