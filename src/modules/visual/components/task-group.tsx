import { createMemo, createSignal, Show, type Component } from "solid-js";
import { cx } from "tailwind-variants";
import { edgeCollection, taskCollection } from "~/integrations/tanstack-db/collections";
import { createId } from "~/integrations/tanstack-db/create-id";
import type { TaskModel } from "~/integrations/tanstack-db/schema";
import { Badge } from "~/ui/badge/badge";
import { mapToAxis, useAxisConfigContext } from "../contexts/axis-config";
import { useBoardId } from "../contexts/board-model";
import { translateX, translateY, useBoardTransformContext } from "../contexts/board-transform";
import { useDrag } from "../contexts/drag-state";
import { useEdgeDragStateContext } from "../contexts/edge-drag-state";
import { useEdgesDataContext } from "../contexts/edges-data";
import { useIsSelected, useSelectionStateContext } from "../contexts/selection-state";
import { useTasksDataContext } from "../contexts/tasks-data";
import {
  TASK_HANDLE_SIZE,
  TASK_HANDLE_SIZE_HALF,
  TASK_HANDLE_Y_SHIFT,
  TASK_RECT_HEIGHT,
  TASK_RECT_HEIGHT_HALF,
  TASK_RECT_WIDTH,
} from "../utils/constants";
import { DeleteTaskDialog, UpdateTaskDialog } from "./task-dialogs";

type TaskGroupProps = {
  task: TaskModel;
};

export const TaskGroup: Component<TaskGroupProps> = (props) => {
  const [rectRef, setRectRef] = createSignal<SVGRectElement>();

  const [shiftX, setShiftX] = createSignal(0);
  const [shiftY, setShiftY] = createSignal(0);

  const axisConfig = useAxisConfigContext();
  const selectionState = useSelectionStateContext();

  useDrag({
    onDragStarted(event) {
      selectionState().setSelection({ id: props.task.id, kind: "task" });
      setShiftX(props.task.positionX - event.x);
      setShiftY(props.task.positionY - event.y);
    },
    onDragged(event) {
      const updatedX = event.x + shiftX();
      const updatedY = event.y + shiftY();

      const axis = mapToAxis(axisConfig().config, { x: updatedX, y: updatedY });

      taskCollection.update(props.task.id, (draft) => {
        draft.positionX = updatedX;
        draft.positionY = updatedY;

        draft.axisX = axis.axisX;
        draft.axisY = axis.axisY;
      });
    },
    ref: rectRef,
  });

  const isSelected = useIsSelected(() => props.task.id);

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
          {/* <span class="text-xs truncate">X:{props.task.axisX}</span>
            <span class="text-xs truncate">Y:{props.task.axisY}</span> */}
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

  const tasksData = useTasksDataContext();
  const edgesData = useEdgesDataContext();
  const selectionState = useSelectionStateContext();
  const boardTransform = useBoardTransformContext();
  const [_edgeDragState, { onDrag, onDragEnd, onDragStart }] = useEdgeDragStateContext();

  const [rectRef, setRectRef] = createSignal<SVGElement>();

  const xShift = createMemo(
    () => (props.kind === "source" ? TASK_RECT_WIDTH : 0) - TASK_HANDLE_SIZE_HALF,
  );

  useDrag({
    onDragEnded(event) {
      onDragEnd();

      const task = tasksData().entries.find(
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

      const hasTheSameConnection = edgesData().entries.some(
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

      selectionState().setSelection({ id: edgeId, kind: "edge" });
    },
    onDragStarted() {
      const transform = boardTransform().transform;
      onDragStart({
        x: translateX(transform, props.x + xShift() + TASK_HANDLE_SIZE_HALF),
        y: translateY(transform, props.y + TASK_RECT_HEIGHT_HALF),
      });
    },
    onDragged(event) {
      const transform = boardTransform().transform;
      onDrag({
        x: translateX(transform, event.x),
        y: translateY(transform, event.y),
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
