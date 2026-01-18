import { eq, useLiveQuery } from "@tanstack/solid-db";
import type { FederatedPointerEvent } from "pixi.js";
import { For, type Component } from "solid-js";
import { edgeCollection } from "~/integrations/tanstack-db/collections";
import { useBoardId } from "../contexts/board-context";
import { useSelectionContext } from "../contexts/selection-context";
import { useTasksContext } from "../contexts/tasks-context";
import { RIGHT_BUTTON } from "../utils/constants";
import { AxisContainer } from "./axis-container";
import { DrawingEdgeGraphics, EdgeContainer } from "./edge-graphics";
import { useTaskContainer } from "./pixi-app";
import { TaskContainer } from "./task-container";
import { useStageTransform } from "./use-stage-transform";
import { createPointerListeners } from "./utils/create-pointer-listeners";

export const StoriesBoard: Component = () => {
  useStageTransform();
  useStageDeselect();

  return (
    <>
      <TaskGraphicsList />
      <AxisContainer />
      <EdgeGraphicsList />
      <DrawingEdgeGraphics />
    </>
  );
};

const TaskGraphicsList: Component = () => {
  const collection = useTasksContext();

  return <For each={collection().data}>{(task) => <TaskContainer task={task} />}</For>;
};

const EdgeGraphicsList: Component = () => {
  const boardId = useBoardId();

  const collection = useLiveQuery((q) =>
    q
      .from({ edge: edgeCollection })
      .where(({ edge }) => eq(edge.boardId, boardId()))
      .select((columns) => ({ id: columns.edge.id })),
  );

  return <For each={collection()}>{(entry) => <EdgeContainer edgeId={entry.id} />}</For>;
};

const useStageDeselect = () => {
  const container = useTaskContainer();
  const selection = useSelectionContext();

  createPointerListeners(container, {
    onPointerDown: (event: FederatedPointerEvent) => {
      if (event.target === container && event.button !== RIGHT_BUTTON) {
        selection().setSelection([]);
      }
    },
  });
};
