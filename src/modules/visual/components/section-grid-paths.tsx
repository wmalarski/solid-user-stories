import { createMemo, createSignal, Index, type Component, type ComponentProps } from "solid-js";
import type { EdgeBreakInstance, TaskPositionInstance } from "~/integrations/jazz/schema";
import { useBoardStateContext } from "../contexts/board-state";
import { translateX, translateY, useBoardTransformContext } from "../contexts/board-transform";
import { DottedLine } from "../ui/dotted-line";
import { SECTION_X_OFFSET, SECTION_Y_OFFSET } from "../utils/constants";
import { createD3DragElement } from "../utils/create-d3-drag-element";
import type { SectionConfig } from "../utils/section-configs";

export const SectionGridStaticPaths: Component = () => {
  return (
    <>
      <HorizontalZeroPath />
      <VerticalZeroPath />
    </>
  );
};

export const SectionGridPaths: Component = () => {
  const boardState = useBoardStateContext();

  return (
    <>
      <Index each={boardState.sectionConfigs().y}>
        {(entry) => <HorizontalPath config={entry()} />}
      </Index>
      <Index each={boardState.sectionConfigs().x}>
        {(entry) => <VerticalPath config={entry()} />}
      </Index>
    </>
  );
};

export const ExportableSectionGridPaths: Component = () => {
  const boardState = useBoardStateContext();

  return (
    <>
      <Index each={boardState.sectionConfigs().y}>
        {(entry) => <ExportableHorizontalPath position={entry().end} />}
      </Index>
      <Index each={boardState.sectionConfigs().x}>
        {(entry) => <ExportableVerticalPath position={entry().end} />}
      </Index>
    </>
  );
};

const HorizontalZeroPath: Component = () => {
  const [transform] = useBoardTransformContext();

  const y = createMemo(() => translateY(transform(), SECTION_Y_OFFSET));

  return <DottedLine x1={0} x2="100%" y1={y()} y2={y()} />;
};

const VerticalZeroPath: Component = () => {
  const [transform] = useBoardTransformContext();

  const x = createMemo(() => translateX(transform(), SECTION_X_OFFSET));

  return <DottedLine y1={0} y2="100%" x1={x()} x2={x()} />;
};

type HorizontalPathProps = {
  config: SectionConfig;
};

const HorizontalPath: Component<HorizontalPathProps> = (props) => {
  const boardState = useBoardStateContext();

  const [transform] = useBoardTransformContext();

  const transformed = createMemo(() =>
    translateY(transform(), props.config.end + SECTION_Y_OFFSET),
  );

  const [ref, setRef] = createSignal<SVGCircleElement>();
  const [draggedTasks, setDraggedTasks] = createSignal<Map<string, number>>(new Map());
  const [maxNotDraggedPosition, setMaxNotDraggedPosition] = createSignal(0);
  const [startPosition, setStartPosition] = createSignal<number>(0);

  createD3DragElement({
    onDragStarted() {
      const { draggedTasks, maxNotDraggedPosition } = getDragStartTaskState({
        attribute: "y",
        offset: SECTION_Y_OFFSET,
        position: props.config.end,
        taskPositions: boardState.taskPositions(),
      });

      setMaxNotDraggedPosition(maxNotDraggedPosition);
      setStartPosition(props.config.end);
      setDraggedTasks(draggedTasks);
    },
    onDragged(event) {
      const transformValue = transform();

      const updatedY = (event.y - transformValue.y) / transformValue.k - SECTION_Y_OFFSET;
      const withLimit = Math.max(maxNotDraggedPosition(), updatedY);

      boardState.updateHorizontalSectionPosition({
        draggedTasks: draggedTasks(),
        position: withLimit,
        sectionId: props.config.section.$jazz.id,
        sectionStart: props.config.start,
        startPosition: startPosition(),
      });
    },
    ref,
  });

  return (
    <>
      <DottedLine x1={0} x2="100%" y1={transformed()} y2={transformed()} />
      <ClickableLine ref={setRef} x1={0} x2="100%" y1={transformed()} y2={transformed()} />
    </>
  );
};

type VerticalPathProps = {
  config: SectionConfig;
};

const VerticalPath: Component<VerticalPathProps> = (props) => {
  const boardState = useBoardStateContext();

  const [transform] = useBoardTransformContext();

  const transformed = createMemo(() =>
    translateX(transform(), props.config.end + SECTION_X_OFFSET),
  );

  const [ref, setRef] = createSignal<SVGElement>();
  const [draggedTasks, setDraggedTasks] = createSignal<Map<string, number>>(new Map());
  const [draggedEdges, setDraggedEdges] = createSignal<Map<string, number>>(new Map());
  const [maxNotDraggedPosition, setMaxNotDraggedPosition] = createSignal(0);
  const [startPosition, setStartPosition] = createSignal<number>(0);

  createD3DragElement({
    onDragStarted() {
      const { draggedTasks, maxNotDraggedPosition } = getDragStartTaskState({
        attribute: "x",
        offset: SECTION_X_OFFSET,
        position: props.config.end,
        taskPositions: boardState.taskPositions(),
      });

      const { draggedEdges } = getDragStartEdgeState({
        edgePositions: boardState.edgePositions(),
        offset: SECTION_X_OFFSET,
        position: props.config.end,
      });

      setMaxNotDraggedPosition(maxNotDraggedPosition);
      setStartPosition(props.config.end);
      setDraggedTasks(draggedTasks);
      setDraggedEdges(draggedEdges);
    },
    onDragged(event) {
      const transformValue = transform();

      const updatedX = (event.x - transformValue.x) / transformValue.k - SECTION_X_OFFSET;
      const withLimit = Math.max(maxNotDraggedPosition(), updatedX);

      boardState.updateVerticalSectionPosition({
        draggedEdges: draggedEdges(),
        draggedTasks: draggedTasks(),
        position: withLimit,
        sectionId: props.config.section.$jazz.id,
        sectionStart: props.config.start,
        startPosition: startPosition(),
      });
    },
    ref,
  });

  return (
    <>
      <DottedLine y1={0} y2="100%" x1={transformed()} x2={transformed()} />
      <ClickableLine ref={setRef} y1={0} y2="100%" x1={transformed()} x2={transformed()} />
    </>
  );
};

type ExportableHorizontalPathProps = {
  position: number;
};

const ExportableHorizontalPath: Component<ExportableHorizontalPathProps> = (props) => {
  const y = createMemo(() => props.position + SECTION_Y_OFFSET);

  return <DottedLine x1={0} x2="100%" y1={y()} y2={y()} />;
};

type ExportableVerticalPathProps = {
  position: number;
};

const ExportableVerticalPath: Component<ExportableVerticalPathProps> = (props) => {
  const x = createMemo(() => props.position + SECTION_X_OFFSET);

  return <DottedLine y1={0} y2="100%" x1={x()} x2={x()} />;
};

const ClickableLine: Component<ComponentProps<"line">> = (props) => {
  return <line stroke="transparent" stroke-width={16} {...props} />;
};

type GetDragStartTaskStateArgs = {
  position: number;
  taskPositions: Map<string, TaskPositionInstance>;
  offset: number;
  attribute: "y" | "x";
};

const getDragStartTaskState = ({
  position,
  taskPositions,
  offset,
  attribute,
}: GetDragStartTaskStateArgs) => {
  let maxNotDraggedPosition = 0;
  const draggedTasks = new Map<string, number>();

  for (const [taskId, entry] of taskPositions.entries()) {
    const entryPosition = entry[attribute];
    if (entryPosition > position + offset) {
      draggedTasks.set(taskId, entryPosition);
    } else {
      const shiftedPosition = entryPosition - offset + 10;
      maxNotDraggedPosition = Math.max(maxNotDraggedPosition, shiftedPosition);
    }
  }

  return { draggedTasks, maxNotDraggedPosition };
};

type GetDragStartEdgeStateArgs = {
  position: number;
  edgePositions: Map<string, EdgeBreakInstance>;
  offset: number;
};

const getDragStartEdgeState = ({ position, edgePositions, offset }: GetDragStartEdgeStateArgs) => {
  const draggedEdges = new Map<string, number>();

  for (const [edgeId, entry] of edgePositions.entries()) {
    const entryPosition = entry.value;
    if (entryPosition > position + offset) {
      draggedEdges.set(edgeId, entryPosition);
    }
  }

  return { draggedEdges };
};
