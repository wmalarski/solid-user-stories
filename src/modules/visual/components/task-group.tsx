import * as d3 from "d3";
import { createMemo, createSignal, Show, type Component } from "solid-js";
import { edgeCollection, taskCollection } from "~/integrations/tanstack-db/collections";
import { createId } from "~/integrations/tanstack-db/create-id";
import type { TaskModel } from "~/integrations/tanstack-db/schema";
import { mapToAxis, useAxisConfigContext } from "../contexts/axis-config";
import { useBoardId } from "../contexts/board-model";
import { useDrag } from "../contexts/drag-state";
import { useIsTaskSelected } from "../contexts/selection-state";
import { useTasksDataContext } from "../contexts/tasks-data";
import {
  TASK_HANDLE_SIZE,
  TASK_HANDLE_SIZE_HALF,
  TASK_HANDLE_Y_SHIFT,
  TASK_RECT_HEIGHT,
  TASK_RECT_WIDTH,
} from "../utils/constants";
import { UpdateTaskDialog } from "./task-dialogs";

type TaskGroupProps = {
  task: TaskModel;
};

export const TaskGroup: Component<TaskGroupProps> = (props) => {
  const [rectRef, setRectRef] = createSignal<SVGRectElement>();

  const [shiftX, setShiftX] = createSignal(0);
  const [shiftY, setShiftY] = createSignal(0);

  const axisConfig = useAxisConfigContext();

  useDrag({
    onDragStarted(event) {
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

  const isSelected = useIsTaskSelected(() => props.task.id);

  return (
    <>
      <rect
        x={props.task.positionX}
        y={props.task.positionY}
        width={TASK_RECT_WIDTH}
        height={TASK_RECT_HEIGHT}
        filter="url(#task-shadow)"
        class="opacity-50"
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
          <div class="flex gap-2 w-full justify-end items-center">
            <span class="badge badge-sm badge-info">{props.task.estimate}</span>
            <UpdateTaskDialog task={props.task} />
          </div>
        </div>
      </foreignObject>
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

  const [rectRef, setRectRef] = createSignal<SVGCircleElement>();

  const xShift = createMemo(
    () => (props.kind === "source" ? TASK_RECT_WIDTH : 0) - TASK_HANDLE_SIZE_HALF,
  );

  const [isDragging, setIsDragging] = createSignal(false);
  const [hasPosition, setHasPosition] = createSignal(false);

  const [x, setX] = createSignal(0);
  const [y, setY] = createSignal(0);

  const startX = createMemo(() => props.x + xShift() + TASK_HANDLE_SIZE_HALF);
  const breakX = createMemo(() => (startX() + x()) / 2);

  useDrag({
    onDragEnded() {
      setIsDragging(false);
      setHasPosition(false);

      const xValue = x();
      const yValue = y();

      const task = tasksData().entries.find(
        (task) =>
          task.positionX < xValue &&
          xValue < task.positionX + TASK_RECT_WIDTH &&
          task.positionY < yValue &&
          yValue < task.positionY + TASK_RECT_HEIGHT,
      );

      if (!task) {
        return;
      }

      edgeCollection.insert({
        boardId: boardId(),
        breakX: breakX(),
        id: createId(),
        source: props.kind === "source" ? props.taskId : task.id,
        target: props.kind === "source" ? task.id : props.taskId,
      });
    },
    onDragStarted() {
      setIsDragging(true);
    },
    onDragged(event) {
      setX(event.x);
      setY(event.y);
      setHasPosition(true);
    },
    ref: rectRef,
  });

  const path = createMemo(() => {
    if (!hasPosition()) {
      return;
    }

    const xValue = x();
    const yValue = y();
    const startY = props.y + TASK_HANDLE_Y_SHIFT + TASK_HANDLE_SIZE_HALF;
    const breakXValue = breakX();

    const context = d3.path();
    context.moveTo(startX(), startY);
    context.lineTo(breakXValue, startY);
    context.lineTo(breakXValue, yValue);
    context.lineTo(xValue, yValue);
    return context.toString();
  });

  return (
    <>
      <rect
        ref={setRectRef}
        x={props.x + xShift()}
        y={props.y + TASK_HANDLE_Y_SHIFT}
        width={TASK_HANDLE_SIZE}
        height={TASK_HANDLE_SIZE}
        class="fill-accent"
      />
      <Show when={isDragging()}>
        <path
          d={path()}
          stroke-width={3}
          class="stroke-accent"
          fill="transparent"
          stroke-dasharray="5,5"
          marker-end="url(#arrow)"
        >
          <animate
            attributeName="stroke-dashoffset"
            values="10;0"
            dur="0.5s"
            repeatCount="indefinite"
          />
        </path>
      </Show>
    </>
  );
};
