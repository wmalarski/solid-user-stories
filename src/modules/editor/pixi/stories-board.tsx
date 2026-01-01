import { eq, useLiveQuery } from "@tanstack/solid-db";
import { For, type Component } from "solid-js";
import { edgeCollection, taskCollection } from "~/integrations/tanstack-db/collections";
import { useBoardId } from "../contexts/board-context";
import { AxisContainer } from "./axis-container";
import { DrawingEdgeGraphics, EdgeGraphics } from "./edge-graphics";
import { TaskGraphics } from "./task-graphics";
import { useStageTransform } from "./use-stage-transform";

export const StoriesBoard: Component = () => {
  useStageTransform();

  return (
    <>
      <AxisContainer />
      <TaskGraphicsList />
      <EdgeGraphicsList />
      <DrawingEdgeGraphics />
    </>
  );
};

const TaskGraphicsList: Component = () => {
  const boardId = useBoardId();

  const collection = useLiveQuery((q) =>
    q.from({ tasks: taskCollection }).where(({ tasks }) => eq(tasks.boardId, boardId())),
  );

  return <For each={collection.data}>{(task) => <TaskGraphics task={task} />}</For>;
};

const EdgeGraphicsList: Component = () => {
  const boardId = useBoardId();

  const collection = useLiveQuery((q) =>
    q
      .from({ edge: edgeCollection })
      .where(({ edge }) => eq(edge.boardId, boardId()))
      .innerJoin({ source: taskCollection }, ({ edge, source }) => eq(edge.source, source.id))
      .innerJoin({ target: taskCollection }, ({ edge, target }) => eq(edge.target, target.id)),
  );

  return (
    <For each={collection.data}>
      {(entry) => <EdgeGraphics edge={entry.edge} source={entry.source} target={entry.target} />}
    </For>
  );
};
