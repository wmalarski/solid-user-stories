import * as d3 from "d3";
import { createMemo, createSignal, Show, type Component } from "solid-js";
import { taskCollection } from "~/integrations/tanstack-db/collections";
import type { TaskModel } from "~/integrations/tanstack-db/schema";
import { useAxisConfigContext } from "../contexts/axis-config";
import { useBoardThemeContext } from "../contexts/board-theme";
import { useDrag } from "../contexts/drag-state";
import { useIsTaskSelected } from "../contexts/selection-state";
import {
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
  const [rectRef, setRectRef] = createSignal<SVGCircleElement>();

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

      const axis = axisConfig().mapToAxis({ x: updatedX, y: updatedY });

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
      <TaskHandle kind="source" x={props.task.positionX} y={props.task.positionY} />
      <TaskHandle kind="target" x={props.task.positionX} y={props.task.positionY} />
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
      <text x={props.task.positionX + 16} y={props.task.positionY + 36}>
        {props.task.description}
      </text>
      <text x={props.task.positionX + 16} y={props.task.positionY + 56}>
        X:{props.task.axisX}
      </text>
      <text x={props.task.positionX + 16} y={props.task.positionY + 76}>
        Y:{props.task.axisY}
      </text>
    </>
  );
};

type TaskHandleProps = {
  x: number;
  y: number;
  kind: "source" | "target";
};

const TaskHandle: Component<TaskHandleProps> = (props) => {
  const boardTheme = useBoardThemeContext();

  const [rectRef, setRectRef] = createSignal<SVGCircleElement>();

  const xShift = createMemo(
    () => (props.kind === "source" ? TASK_RECT_WIDTH : 0) - TASK_HANDLE_SIZE_HALF,
  );

  const [isDragging, setIsDragging] = createSignal(false);
  const [hasPosition, setHasPosition] = createSignal(false);

  const [x, setX] = createSignal(0);
  const [y, setY] = createSignal(0);

  useDrag({
    onDragEnded() {
      setIsDragging(false);
      setHasPosition(false);
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
    const xValue = x();
    const yValue = y();

    if (!hasPosition()) {
      return;
    }

    const startX = props.x + xShift() + TASK_HANDLE_SIZE_HALF;
    const startY = props.y + TASK_HANDLE_Y_SHIFT + TASK_HANDLE_SIZE_HALF;
    const breakX = (startX + xValue) / 2;

    const context = d3.path();
    context.moveTo(startX, startY);
    context.lineTo(breakX, startY);
    context.lineTo(breakX, yValue);
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
