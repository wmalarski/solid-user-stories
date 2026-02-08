import * as d3 from "d3";
import { createMemo, createSignal, createUniqueId, Show, type Component } from "solid-js";
import { cx } from "tailwind-variants";
import { useI18n } from "~/integrations/i18n";
import { createJazzResource } from "~/integrations/jazz/create-jazz-resource";
import {
  TaskPositionSchema,
  TaskSchema,
  type TaskInstance,
  type TaskPositionInstance,
} from "~/integrations/jazz/schema";
import { Badge } from "~/ui/badge/badge";
import { LinkButton } from "~/ui/button/button";
import { openDialog } from "~/ui/dialog/dialog";
import { LinkIcon } from "~/ui/icons/link-icon";
import { useBoardStateContext } from "../contexts/board-state";
import { translateX, translateY, useBoardTransformContext } from "../contexts/board-transform";
import { useEdgeDragStateContext } from "../contexts/edge-drag-state";
import { useIsSelected, useSelectionStateContext } from "../contexts/selection-state";
import { useDialogBoardToolUtils } from "../contexts/tools-state";
import { MultilineText } from "../ui/multiline-text";
import {
  TASK_ARROW_OFFSET,
  TASK_HANDLE_SIZE,
  TASK_HANDLE_SIZE_HALF,
  TASK_HANDLE_Y_SHIFT,
  TASK_RECT_HEIGHT,
  TASK_RECT_HEIGHT_HALF,
  TASK_RECT_WIDTH,
  TEXT_HEIGHT,
  TEXT_PADDING,
} from "../utils/constants";
import { createD3ClickListener } from "../utils/create-d3-click-listener";
import { createD3DragElement } from "../utils/create-d3-drag-element";
import { mapToSections } from "../utils/section-configs";
import { updateTaskPosition, updateTaskSections } from "../utils/task-actions";
import type { Point2D } from "../utils/types";
import { DeleteTaskDialog, InsertTaskDialog, UpdateTaskDialog } from "./task-dialogs";

type TaskHandleKind = "source" | "target";

type TaskGroupProps = {
  taskId: string;
  taskPositionId: string;
};

export const TaskGroup: Component<TaskGroupProps> = (props) => {
  const position = createJazzResource(() => ({
    id: props.taskPositionId,
    schema: TaskPositionSchema,
  }));

  return (
    <Show when={position()}>
      {(position) => <TaskContainer taskId={props.taskId} position={position()} />}
    </Show>
  );
};

type TaskContainerProps = {
  taskId: string;
  position: TaskPositionInstance;
};

const TaskContainer: Component<TaskContainerProps> = (props) => {
  const [rectRef, setRectRef] = createSignal<SVGRectElement>();

  const [shiftX, setShiftX] = createSignal(0);
  const [shiftY, setShiftY] = createSignal(0);

  const boardState = useBoardStateContext();

  const task = createJazzResource(() => ({
    id: props.taskId,
    schema: TaskSchema,
  }));

  const insertTaskDialogId = createUniqueId();
  const { onClick } = useDialogBoardToolUtils();
  const [newTaskHandle, setNewTaskHandle] = createSignal<TaskHandleKind>("source");
  const [newTaskPoint, setNewTaskPoint] = createSignal<Point2D>({ x: 0, y: 0 });

  const isSelected = useIsSelected(() => props.taskId);
  const [_selectionState, { onSelectionChange }] = useSelectionStateContext();

  createD3DragElement({
    onDragStarted(event) {
      onSelectionChange({ id: props.taskId, kind: "task" });
      setShiftX(props.position.x - event.x);
      setShiftY(props.position.y - event.y);
    },
    onDragged(event) {
      const updatedX = event.x + shiftX();
      const updatedY = event.y + shiftY();

      const sectionIds = mapToSections(boardState.sectionXConfigs(), boardState.sectionYConfigs(), {
        x: updatedX,
        y: updatedY,
      });

      const taskValue = task();

      if (taskValue) {
        updateTaskPosition(props.position, {
          x: updatedX,
          y: updatedY,
        });
        updateTaskSections(taskValue, {
          sectionX: sectionIds.sectionX?.$jazz.id ?? null,
          sectionY: sectionIds.sectionY?.$jazz.id ?? null,
        });
      }
    },
    ref: rectRef,
  });

  const onArrowClick = (point: Point2D, kind: TaskHandleKind) => {
    setNewTaskPoint(point);
    onClick();
    openDialog(insertTaskDialogId);
    setNewTaskHandle(kind);
  };

  return (
    <>
      <rect
        x={props.position.x}
        y={props.position.y}
        width={TASK_RECT_WIDTH}
        height={TASK_RECT_HEIGHT}
        filter="url(#dropshadow)"
        stroke-width={5}
        class={cx("opacity-15", { "stroke-accent opacity-40": isSelected() })}
      />
      <foreignObject
        ref={setRectRef}
        x={props.position.x}
        y={props.position.y}
        width={TASK_RECT_WIDTH}
        height={TASK_RECT_HEIGHT}
        class="stroke-base-300 border-0"
      >
        <Show when={task()}>
          {(task) => (
            <TaskContent
              newTaskHandle={newTaskHandle()}
              newTaskPoint={newTaskPoint()}
              task={task()}
            />
          )}
        </Show>
      </foreignObject>
      <Show when={isSelected()}>
        <TaskHandle kind="source" x={props.position.x} y={props.position.y} taskId={props.taskId} />
        <TaskHandle kind="target" x={props.position.x} y={props.position.y} taskId={props.taskId} />
        <TaskArrows position={props.position} onArrowClick={onArrowClick} />
      </Show>
    </>
  );
};

type TaskContentProps = {
  task: TaskInstance;
  newTaskPoint: Point2D;
  newTaskHandle: TaskHandleKind;
};

const TaskContent: Component<TaskContentProps> = (props) => {
  const { t } = useI18n();

  const boardState = useBoardStateContext();

  const insertTaskDialogId = createUniqueId();

  const isSelected = useIsSelected(() => props.task.$jazz.id);

  const onInsertSuccess = (newTaskId: string) => {
    boardState.insertEdgeToTask({
      isSource: props.newTaskHandle === "source",
      secondTaskId: newTaskId,
      taskId: props.task.$jazz.id,
    });
  };

  return (
    <div
      data-selected={isSelected()}
      class="bg-base-200 w-full h-full grid grid-cols-1 grid-rows-[auto_1fr_auto] py-2 px-3"
    >
      <span class="text-sm truncate font-semibold">{props.task.title}</span>
      <span class="text-xs line-clamp-3 opacity-80">{props.task.description}</span>
      <div class="flex gap-1 w-full justify-end items-center">
        <Show when={props.task.link}>
          {(link) => (
            <LinkButton
              size="sm"
              shape="circle"
              href={link()}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("board.tasks.link")}
            >
              <LinkIcon class="size-4" />
            </LinkButton>
          )}
        </Show>
        <UpdateTaskDialog task={props.task} />
        <DeleteTaskDialog task={props.task} />
        <InsertTaskDialog
          dialogId={insertTaskDialogId}
          position={props.newTaskPoint}
          onInsertSuccess={onInsertSuccess}
        />
        <Badge size="sm" color="accent">
          {props.task.estimate}
        </Badge>
      </div>
    </div>
  );
};

type ExportableTaskGroupProps = {
  task: TaskInstance;
  position: TaskPositionInstance;
};

export const ExportableTaskGroup: Component<ExportableTaskGroupProps> = (props) => {
  return (
    <>
      <rect
        x={props.position.x}
        y={props.position.y}
        width={TASK_RECT_WIDTH}
        height={TASK_RECT_HEIGHT}
        filter="url(#dropshadow)"
        class="fill-base-200"
      />

      <MultilineText
        x={props.position.x + TEXT_PADDING}
        y={props.position.y + TEXT_PADDING + TEXT_HEIGHT}
        class="fill-base-content"
        font-weight={600}
        content={props.task.title}
        maxWidth={TASK_RECT_WIDTH - 2 * TEXT_PADDING}
      />

      <MultilineText
        maxWidth={TASK_RECT_WIDTH - 2 * TEXT_PADDING}
        x={props.position.x + TEXT_PADDING}
        y={props.position.y + 2 * (TEXT_PADDING + TEXT_HEIGHT)}
        content={props.task.description}
        maxLines={3}
        font-size="12"
        class="opacity-75"
      />

      <text
        x={props.position.x + TASK_RECT_WIDTH - TEXT_PADDING}
        y={props.position.y + TASK_RECT_HEIGHT - TEXT_PADDING}
        class="fill-base-content"
        text-anchor="end"
        font-size="20"
        font-weight={600}
      >
        {props.task.estimate}
      </text>
    </>
  );
};

type TaskHandleProps = {
  x: number;
  y: number;
  kind: TaskHandleKind;
  taskId: string;
};

const TaskHandle: Component<TaskHandleProps> = (props) => {
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

      const edgeId = boardState.insertEdgeToPoint({
        isSource: props.kind === "source",
        taskId: props.taskId,
        x: event.x,
        y: event.y,
      });

      if (edgeId) {
        onSelectionChange({ id: edgeId, kind: "edge" });
      }
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

type TaskArrowsProps = {
  position: TaskPositionInstance;
  onArrowClick: (taskPoint: Point2D, orientation: TaskHandleKind) => void;
};

const TaskArrows: Component<TaskArrowsProps> = (props) => {
  const [rightPathRef, setRightPathRef] = createSignal<SVGElement>();
  const [leftPathRef, setLeftPathRef] = createSignal<SVGElement>();

  createD3ClickListener({
    onClick() {
      props.onArrowClick(
        {
          x: props.position.x + TASK_RECT_WIDTH + 400,
          y: props.position.y,
        },
        "source",
      );
    },
    ref: rightPathRef,
  });

  createD3ClickListener({
    onClick() {
      props.onArrowClick(
        {
          x: props.position.x - 400,
          y: props.position.y,
        },
        "target",
      );
    },
    ref: leftPathRef,
  });

  return (
    <>
      <ChevronRightPath ref={setRightPathRef} position={props.position} />
      <ChevronLeftPath ref={setLeftPathRef} position={props.position} />
    </>
  );
};

const ARROW_HEIGHT_HALF = 10;
const ARROW_WIDTH = 10;

type ChevronPathProps = {
  position: TaskPositionInstance;
  ref: (element: SVGElement) => void;
};

const ChevronRightPath: Component<ChevronPathProps> = (props) => {
  const path = createMemo(() => {
    const x = props.position.x + TASK_RECT_WIDTH + TASK_ARROW_OFFSET;
    const y = props.position.y + TASK_RECT_HEIGHT_HALF;

    const context = d3.path();
    context.moveTo(x, y - ARROW_HEIGHT_HALF);
    context.lineTo(x + ARROW_WIDTH, y);
    context.lineTo(x, y + ARROW_HEIGHT_HALF);
    return context.toString();
  });

  return (
    <path ref={props.ref} d={path()} class="stroke-accent" fill="transparent" stroke-width={4} />
  );
};

const ChevronLeftPath: Component<ChevronPathProps> = (props) => {
  const path = createMemo(() => {
    const x = props.position.x - TASK_ARROW_OFFSET;
    const y = props.position.y + TASK_RECT_HEIGHT_HALF;

    const context = d3.path();
    context.moveTo(x, y - ARROW_HEIGHT_HALF);
    context.lineTo(x - ARROW_WIDTH, y);
    context.lineTo(x, y + ARROW_HEIGHT_HALF);
    return context.toString();
  });

  return (
    <path ref={props.ref} d={path()} class="stroke-accent" fill="transparent" stroke-width={4} />
  );
};
