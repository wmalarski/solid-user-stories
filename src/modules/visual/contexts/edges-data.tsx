import { eq, useLiveQuery } from "@tanstack/solid-db";
import {
  type Accessor,
  type Component,
  type ParentProps,
  createContext,
  createMemo,
  useContext,
} from "solid-js";
import { edgeCollection, taskCollection } from "~/integrations/tanstack-db/collections";
import { useBoardId } from "./board-model";

const createEdgesDataContext = (boardId: string) => {
  const edges = useLiveQuery((q) =>
    q
      .from({ edge: edgeCollection })
      .where(({ edge }) => eq(edge.boardId, boardId))
      .innerJoin({ source: taskCollection }, ({ edge, source }) => eq(edge.source, source.id))
      .innerJoin({ target: taskCollection }, ({ edge, target }) => eq(edge.target, target.id)),
  );

  return { entries: edges.data };
};

const EdgesDataContext = createContext<Accessor<ReturnType<typeof createEdgesDataContext>>>(() => {
  throw new Error("EdgesDataContext not defined");
});

export const useEdgesDataContext = () => {
  return useContext(EdgesDataContext);
};

export const EdgesDataProvider: Component<ParentProps> = (props) => {
  const boardId = useBoardId();

  const value = createMemo(() => createEdgesDataContext(boardId()));

  return <EdgesDataContext.Provider value={value}>{props.children}</EdgesDataContext.Provider>;
};
