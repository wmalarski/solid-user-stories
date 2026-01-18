import * as d3 from "d3";
import { createEffect, createMemo, createSignal, onCleanup, Show, type Component } from "solid-js";
import { edgeCollection, taskCollection } from "~/integrations/tanstack-db/collections";
import { createId } from "~/integrations/tanstack-db/create-id";
import type { TaskModel } from "~/integrations/tanstack-db/schema";
import { mapToAxis, useAxisConfigContext } from "../contexts/axis-config";
import { UPDATE_TASK_DIALOG_ID, useBoardDialogsContext } from "../contexts/board-dialogs";
import { useBoardId } from "../contexts/board-model";
import { useBoardThemeContext } from "../contexts/board-theme";
import { useDrag } from "../contexts/drag-state";
import { useIsTaskSelected } from "../contexts/selection-state";
import { useTasksDataContext } from "../contexts/tasks-data";
import {
  BUTTON_PADDING,
  BUTTON_SIZE,
  TASK_HANDLE_SIZE,
  TASK_HANDLE_SIZE_HALF,
  TASK_HANDLE_Y_SHIFT,
  TASK_RECT_HEIGHT,
  TASK_RECT_WIDTH,
} from "../utils/constants";

type TaskGroupProps = {
  task: TaskModel;
};

export const TaskGroup: Component<TaskGroupProps> = (props) => {
  const [rectRef, setRectRef] = createSignal<SVGRectElement>();

  const boardTheme = useBoardThemeContext();

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

  const fill = d3.interpolateRainbow(Math.random());

  const isSelected = useIsTaskSelected(() => props.task.id);

  return (
    <>
      <rect
        ref={setRectRef}
        x={props.task.positionX}
        y={props.task.positionY}
        width={TASK_RECT_WIDTH}
        height={TASK_RECT_HEIGHT}
        stroke={isSelected() ? boardTheme().selectionColor : undefined}
        stroke-width={2}
        fill={fill}
      />
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
      <TaskUpdateButton task={props.task} />
    </>
  );
};

type TaskContentProps = {
  task: TaskModel;
};

export const TaskContent: Component<TaskContentProps> = (props) => {
  return (
    <>
      <text x={props.task.positionX + 16} y={props.task.positionY + 16}>
        {props.task.title}
      </text>
      <text x={props.task.positionX + 16} y={props.task.positionY + 34}>
        {props.task.description}
      </text>
      <text x={props.task.positionX + 16} y={props.task.positionY + 52}>
        X:{props.task.axisX}
      </text>
      <text x={props.task.positionX + 16} y={props.task.positionY + 70}>
        Y:{props.task.axisY}
      </text>
      <text x={props.task.positionX + 16} y={props.task.positionY + 88}>
        Points:{props.task.estimate}
      </text>
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
  const boardTheme = useBoardThemeContext();

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
        fill={boardTheme().taskHandleBackgroundColor}
      />
      <Show when={isDragging()}>
        <path d={path()} stroke={boardTheme().edgeDrawingColor} fill="transparent" />
      </Show>
    </>
  );
};

type TaskUpdateButtonProps = {
  task: TaskModel;
};

const TaskUpdateButton: Component<TaskUpdateButtonProps> = (props) => {
  const boardTheme = useBoardThemeContext();
  const boardDialogs = useBoardDialogsContext();

  const [ref, setRef] = createSignal<SVGRectElement>();

  createEffect(() => {
    const refValue = ref();

    if (!refValue) {
      return;
    }

    const abortController = new AbortController();

    d3.select(refValue).on(
      "click",
      () => boardDialogs().openBoardDialog(UPDATE_TASK_DIALOG_ID, { task: props.task }),
      { signal: abortController.signal },
    );

    onCleanup(() => {
      abortController.abort();
    });
  });

  return (
    <rect
      ref={setRef}
      x={props.task.positionX + TASK_RECT_WIDTH - BUTTON_PADDING - BUTTON_SIZE}
      y={props.task.positionY + BUTTON_PADDING}
      width={BUTTON_SIZE}
      height={BUTTON_SIZE}
      fill={boardTheme().taskMenuButtonBackgroundColor}
    />
  );
};
