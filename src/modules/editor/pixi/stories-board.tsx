import { eq, useLiveQuery } from "@tanstack/solid-db";
import { For, type Component } from "solid-js";
import { taskCollection } from "~/integrations/tanstack-db/collections";
import { useBoardId } from "../contexts/board-context";
import { AxisContainer } from "./axis-container";
import { DrawingEdgeGraphics } from "./edge-graphics";
import { TaskGraphics } from "./task-graphics";
import { useStageTransform } from "./use-stage-transform";

export const StoriesBoard: Component = () => {
  useStageTransform();

  return (
    <>
      <AxisContainer />
      <TaskGraphicsList />
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
