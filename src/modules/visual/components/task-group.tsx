import { createMemo, createSignal, Show, type Component } from "solid-js";
import { cx } from "tailwind-variants";
import { edgeCollection, taskCollection } from "~/integrations/tanstack-db/collections";
import { createId } from "~/integrations/tanstack-db/create-id";
import type { TaskModel } from "~/integrations/tanstack-db/schema";
import { Badge } from "~/ui/badge/badge";
import { useBoardId, useBoardStateContext } from "../contexts/board-state";
import { translateX, translateY, useBoardTransformContext } from "../contexts/board-transform";
import { useEdgeDragStateContext } from "../contexts/edge-drag-state";
import { mapToSections, useSectionConfigsContext } from "../contexts/section-configs";
import { useIsSelected, useSelectionStateContext } from "../contexts/selection-state";
import {
  TASK_HANDLE_SIZE,
  TASK_HANDLE_SIZE_HALF,
  TASK_HANDLE_Y_SHIFT,
  TASK_RECT_HEIGHT,
  TASK_RECT_HEIGHT_HALF,
  TASK_RECT_WIDTH,
} from "../utils/constants";
import { createD3DragElement } from "../utils/create-d3-drag-element";
import { DeleteTaskDialog, UpdateTaskDialog } from "./task-dialogs";

type TaskGroupProps = {
  task: TaskModel;
};

export const TaskGroup: Component<TaskGroupProps> = (props) => {
  const [rectRef, setRectRef] = createSignal<SVGRectElement>();

  const [shiftX, setShiftX] = createSignal(0);
  const [shiftY, setShiftY] = createSignal(0);

  const sectionConfigs = useSectionConfigsContext();

  const isSelected = useIsSelected(() => props.task.id);
  const [_selectionState, { onSelectionChange }] = useSelectionStateContext();

  createD3DragElement({
    onDragStarted(event) {
      onSelectionChange({ id: props.task.id, kind: "task" });
      setShiftX(props.task.positionX - event.x);
      setShiftY(props.task.positionY - event.y);
    },
    onDragged(event) {
      const updatedX = event.x + shiftX();
      const updatedY = event.y + shiftY();

      const sectionIds = mapToSections(sectionConfigs(), { x: updatedX, y: updatedY });

      taskCollection.update(props.task.id, (draft) => {
        draft.positionX = updatedX;
        draft.positionY = updatedY;

        draft.sectionX = sectionIds.sectionX;
        draft.sectionY = sectionIds.sectionY;
      });
    },
    ref: rectRef,
  });

  return (
    <>
      <rect
        x={props.task.positionX}
        y={props.task.positionY}
        width={TASK_RECT_WIDTH}
        height={TASK_RECT_HEIGHT}
        filter="url(#task-shadow)"
        stroke-width={5}
        class={cx("opacity-50", { "stroke-accent": isSelected() })}
      />
      <foreignObject
        ref={setRectRef}
        x={props.task.positionX}
        y={props.task.positionY}
        width={TASK_RECT_WIDTH}
        height={TASK_RECT_HEIGHT}
      >
        <div
          data-selected={isSelected()}
          class="bg-base-200 w-full h-full grid grid-cols-1 grid-rows-[auto_1fr_auto] py-2 px-3"
        >
          <span class="text-sm truncate font-semibold">{props.task.title}</span>
          <span class="text-xs line-clamp-3 opacity-80">{props.task.description}</span>
          <div class="flex gap-1 w-full justify-end items-center">
            <UpdateTaskDialog task={props.task} />
            <DeleteTaskDialog task={props.task} />
            <Badge size="sm" color="accent">
              {props.task.estimate}
            </Badge>
          </div>
        </div>
      </foreignObject>
      <Show when={isSelected()}>
        <TaskHandle
          kind="source"
          x={props.task.positionX}
          y={props.task.positionY}
          taskId={props.task.id}
        />
        <TaskHandle
          kind="target"
          x={props.task.positionX}
          y={props.task.positionY}
          taskId={props.task.id}
        />
      </Show>
    </>
  );
};

type TaskHandleProps = {
  x: number;
  y: number;
  kind: "source" | "target";
  taskId: string;
};

const TaskHandle: Component<TaskHandleProps> = (props) => {
  const boardId = useBoardId();

  const boardState = useBoardStateContext();
  const [transform] = useBoardTransformContext();

  const [_selectionState, { onSelectionChange }] = useSelectionStateContext();
  const [_edgeDragState, { onDrag, onDragEnd, onDragStart }] = useEdgeDragStateContext();

  const [rectRef, setRectRef] = createSignal<SVGElement>();

  const xShift = createMemo(
    () => (props.kind === "source" ? TASK_RECT_WIDTH : 0) - TASK_HANDLE_SIZE_HALF,
  );

  createD3DragElement({
    onDragEnded(event) {
      onDragEnd();

      const task = boardState
        .tasks()
        .find(
          (task) =>
            task.positionX < event.x &&
            event.x < task.positionX + TASK_RECT_WIDTH &&
            task.positionY < event.y &&
            event.y < task.positionY + TASK_RECT_HEIGHT,
        );

      if (!task || task.id === props.taskId) {
        return;
      }

      const source = props.kind === "source" ? props.taskId : task.id;
      const target = props.kind === "source" ? task.id : props.taskId;

      const hasTheSameConnection = boardState
        .edges()
        .some(
          (entry) =>
            (entry.edge.source === source && entry.edge.target === target) ||
            (entry.edge.source === target && entry.edge.target === source),
        );

      if (hasTheSameConnection) {
        return;
      }

      const breakX = (props.x + task.positionX + TASK_RECT_WIDTH) / 2;

      const edgeId = createId();
      edgeCollection.insert({
        boardId: boardId(),
        breakX,
        id: edgeId,
        source: props.kind === "source" ? props.taskId : task.id,
        target: props.kind === "source" ? task.id : props.taskId,
      });

      onSelectionChange({ id: edgeId, kind: "edge" });
    },
    onDragStarted() {
      const transformValue = transform();
      onDragStart({
        x: translateX(transformValue, props.x + xShift() + TASK_HANDLE_SIZE_HALF),
        y: translateY(transformValue, props.y + TASK_RECT_HEIGHT_HALF),
      });
    },
    onDragged(event) {
      const transformValue = transform();
      onDrag({
        x: translateX(transformValue, event.x),
        y: translateY(transformValue, event.y),
      });
    },
    ref: rectRef,
  });

  return (
    <rect
      ref={setRectRef}
      x={props.x + xShift()}
      y={props.y + TASK_HANDLE_Y_SHIFT}
      width={TASK_HANDLE_SIZE}
      height={TASK_HANDLE_SIZE}
      class="fill-accent"
    />
  );
};
