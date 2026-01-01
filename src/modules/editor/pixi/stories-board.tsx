import { eq, useLiveQuery } from "@tanstack/solid-db";
import type { FederatedPointerEvent } from "pixi.js";
import { createMemo, For, onCleanup, onMount, type Component } from "solid-js";
import {
  axisCollection,
  edgeCollection,
  taskCollection,
} from "~/integrations/tanstack-db/collections";
import type { AxisModel } from "~/integrations/tanstack-db/schema";
import { useBoardId } from "../contexts/board-context";
import { useSelectionContext } from "../contexts/selection-context";
import { RIGHT_BUTTON } from "../utils/constants";
import { AxisContainer } from "./axis-container";
import { DrawingEdgeGraphics, EdgeGraphics } from "./edge-graphics";
import { usePixiContainer } from "./pixi-app";
import { TaskGraphics } from "./task-graphics";
import { useStageTransform } from "./use-stage-transform";

export const StoriesBoard: Component = () => {
  useStageTransform();
  useStageDeselect();

  const boardId = useBoardId();

  const axis = useLiveQuery((q) =>
    q.from({ axis: axisCollection }).where(({ axis }) => eq(axis.boardId, boardId())),
  );

  const values = createMemo(() => getAxisValues(axis.data));

  return (
    <>
      <AxisContainer
        horizontal={values().horizontal}
        horizontalPositions={values().horizontalPositions}
        vertical={values().vertical}
        verticalPositions={values().verticalPositions}
      />
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

const useStageDeselect = () => {
  const container = usePixiContainer();
  const selection = useSelectionContext();

  const onPointerDown = (event: FederatedPointerEvent) => {
    if (event.target === container && event.button !== RIGHT_BUTTON) {
      selection().setSelection([]);
    }
  };

  onMount(() => {
    container.on("pointerdown", onPointerDown);
  });

  onCleanup(() => {
    container.off("pointerdown", onPointerDown);
  });
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
    horizontal,
    horizontalPositions,
    vertical,
    verticalPositions,
  };
};
