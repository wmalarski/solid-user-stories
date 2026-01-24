import { eq, useLiveQuery } from "@tanstack/solid-db";
import {
  type Accessor,
  type Component,
  type ParentProps,
  createContext,
  createMemo,
  useContext,
} from "solid-js";
import {
  edgeCollection,
  sectionCollection,
  taskCollection,
} from "~/integrations/tanstack-db/collections";
import type { BoardModel } from "~/integrations/tanstack-db/schema";

const createBoardStateContext = (board: Accessor<BoardModel>) => {
  const tasks = useLiveQuery((q) =>
    q.from({ tasks: taskCollection }).where(({ tasks }) => eq(tasks.boardId, board().id)),
  );

  const edges = useLiveQuery((q) =>
    q
      .from({ edge: edgeCollection })
      .where(({ edge }) => eq(edge.boardId, board().id))
      .innerJoin({ source: taskCollection }, ({ edge, source }) => eq(edge.source, source.id))
      .innerJoin({ target: taskCollection }, ({ edge, target }) => eq(edge.target, target.id)),
  );

  const sections = useLiveQuery((q) =>
    q.from({ section: sectionCollection }).where(({ section }) => eq(section.boardId, board().id)),
  );

  return { board, edges, sections, tasks };
};

const BoardStateContext = createContext<ReturnType<typeof createBoardStateContext> | null>(null);

type EdgeEntries = ReturnType<ReturnType<typeof createBoardStateContext>["edges"]>;

export const useBoardStateContext = () => {
  const context = useContext(BoardStateContext);
  if (!context) {
    throw new Error("BoardStateContext is not defined");
  }
  return context;
};

export const useBoardId = () => {
  const context = useBoardStateContext();
  return createMemo(() => context.board().id);
};

type BoardStateProviderProps = ParentProps<{
  board: BoardModel;
}>;

export const BoardStateProvider: Component<BoardStateProviderProps> = (props) => {
  const value = createBoardStateContext(() => props.board);

  return <BoardStateContext.Provider value={value}>{props.children}</BoardStateContext.Provider>;
};

export const getEdgesByTask = (edges: EdgeEntries, taskId: string) => {
  return edges
    .map((entry) => entry.edge)
    .filter((edge) => edge.source === taskId || edge.target === taskId);
};
