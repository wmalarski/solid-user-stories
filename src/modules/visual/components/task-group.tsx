import * as d3 from "d3";
import { createMemo, createSignal, createUniqueId, Show, type Component } from "solid-js";
import { cx } from "tailwind-variants";
import { useI18n } from "~/integrations/i18n";
import { edgeCollection, taskCollection } from "~/integrations/tanstack-db/collections";
import { createId } from "~/integrations/tanstack-db/create-id";
import type { TaskModel } from "~/integrations/tanstack-db/schema";
import { Badge } from "~/ui/badge/badge";
import { LinkButton } from "~/ui/button/button";
import { openDialog } from "~/ui/dialog/dialog";
import { LinkIcon } from "~/ui/icons/link-icon";
import { useBoardId, useBoardStateContext } from "../contexts/board-state";
import { translateX, translateY, useBoardTransformContext } from "../contexts/board-transform";
import { useEdgeDragStateContext } from "../contexts/edge-drag-state";
import { mapToSections, useSectionConfigsContext } from "../contexts/section-configs";
import { useIsSelected, useSelectionStateContext } from "../contexts/selection-state";
import { useDialogBoardToolUtils } from "../contexts/tools-state";
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
import type { Point2D } from "../utils/types";
import { DeleteTaskDialog, InsertTaskDialog, UpdateTaskDialog } from "./task-dialogs";

type TaskHandleKind = "source" | "target";

type TaskGroupProps = {
  task: TaskModel;
};

export const TaskGroup: Component<TaskGroupProps> = (props) => {
  const { t } = useI18n();

  const boardId = useBoardId();

  const [rectRef, setRectRef] = createSignal<SVGRectElement>();

  const [shiftX, setShiftX] = createSignal(0);
  const [shiftY, setShiftY] = createSignal(0);

  const sectionConfigs = useSectionConfigsContext();

  const insertTaskDialogId = createUniqueId();
  const { onClick } = useDialogBoardToolUtils();
  const [newTaskHandle, setNewTaskHandle] = createSignal<TaskHandleKind>("source");
  const [newTaskPoint, setNewTaskPoint] = createSignal<Point2D>({ x: 0, y: 0 });

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

  const onArrowClick = (point: Point2D, kind: TaskHandleKind) => {
    setNewTaskPoint(point);
    onClick();
    openDialog(insertTaskDialogId);
    setNewTaskHandle(kind);
  };

  const onInsertSuccess = (newTaskId: string) => {
    const kind = newTaskHandle();
    const edgeId = createId();
    edgeCollection.insert({
      boardId: boardId(),
      breakX: (newTaskPoint().x + TASK_RECT_WIDTH + props.task.positionX) / 2,
      id: edgeId,
      source: kind === "source" ? props.task.id : newTaskId,
      target: kind === "source" ? newTaskId : props.task.id,
    });
  };

  return (
    <>
      <rect
        x={props.task.positionX}
        y={props.task.positionY}
        width={TASK_RECT_WIDTH}
        height={TASK_RECT_HEIGHT}
        filter="url(#task-shadow)"
        stroke-width={5}
        class={cx("opacity-15", { "stroke-accent opacity-40": isSelected() })}
      />
      <foreignObject
        ref={setRectRef}
        x={props.task.positionX}
        y={props.task.positionY}
        width={TASK_RECT_WIDTH}
        height={TASK_RECT_HEIGHT}
        class="stroke-base-300 border-0"
      >
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
              position={newTaskPoint()}
              onInsertSuccess={onInsertSuccess}
            />
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
        <TaskArrows task={props.task} onArrowClick={onArrowClick} />
      </Show>
    </>
  );
};

type ExportableTaskGroupProps = {
  task: TaskModel;
};

export const ExportableTaskGroup: Component<ExportableTaskGroupProps> = (props) => {
  return (
    <>
      <rect
        x={props.task.positionX}
        y={props.task.positionY}
        width={TASK_RECT_WIDTH}
        height={TASK_RECT_HEIGHT}
        filter="url(#dropshadow)"
        class="fill-base-200"
      />
      <text
        x={props.task.positionX + TEXT_PADDING}
        y={props.task.positionY + TEXT_PADDING + TEXT_HEIGHT}
        class="fill-base-content"
        dy={0}
      >
        <tspan font-weight={600}>{props.task.title}</tspan>
        <tspan x={props.task.positionX + TEXT_PADDING} dy="1.2em">
          {props.task.description}
        </tspan>
      </text>
      <text
        x={props.task.positionX + TASK_RECT_WIDTH - TEXT_PADDING}
        y={props.task.positionY + TASK_RECT_HEIGHT - TEXT_PADDING}
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

type TaskArrowsProps = {
  task: TaskModel;
  onArrowClick: (taskPoint: Point2D, orientation: TaskHandleKind) => void;
};

const TaskArrows: Component<TaskArrowsProps> = (props) => {
  const [rightPathRef, setRightPathRef] = createSignal<SVGElement>();
  const [leftPathRef, setLeftPathRef] = createSignal<SVGElement>();

  createD3ClickListener({
    onClick() {
      props.onArrowClick(
        {
          x: props.task.positionX + TASK_RECT_WIDTH + 400,
          y: props.task.positionY,
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
          x: props.task.positionX - 400,
          y: props.task.positionY,
        },
        "target",
      );
    },
    ref: leftPathRef,
  });

  return (
    <>
      <ChevronRightPath ref={setRightPathRef} task={props.task} />
      <ChevronLeftPath ref={setLeftPathRef} task={props.task} />
    </>
  );
};

const ARROW_HEIGHT_HALF = 10;
const ARROW_WIDTH = 10;

type ChevronPathProps = {
  task: TaskModel;
  ref: (element: SVGElement) => void;
};

const ChevronRightPath: Component<ChevronPathProps> = (props) => {
  const path = createMemo(() => {
    const x = props.task.positionX + TASK_RECT_WIDTH + TASK_ARROW_OFFSET;
    const y = props.task.positionY + TASK_RECT_HEIGHT_HALF;

    const context = d3.path();
    context.moveTo(x, y - ARROW_HEIGHT_HALF);
    context.lineTo(x + ARROW_WIDTH, y);
    context.lineTo(x, y + ARROW_HEIGHT_HALF);
    return context.toString();
  });

  return (
    <path
      ref={props.ref}
      d={path()}
      class="stroke-base-content"
      fill="transparent"
      stroke-width={4}
    />
  );
};

const ChevronLeftPath: Component<ChevronPathProps> = (props) => {
  const path = createMemo(() => {
    const x = props.task.positionX - TASK_ARROW_OFFSET;
    const y = props.task.positionY + TASK_RECT_HEIGHT_HALF;

    const context = d3.path();
    context.moveTo(x, y - ARROW_HEIGHT_HALF);
    context.lineTo(x - ARROW_WIDTH, y);
    context.lineTo(x, y + ARROW_HEIGHT_HALF);
    return context.toString();
  });

  return (
    <path
      ref={props.ref}
      d={path()}
      class="stroke-base-content"
      fill="transparent"
      stroke-width={4}
    />
  );
};
