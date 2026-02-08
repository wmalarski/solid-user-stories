import { createMemo, createSignal, Index, type Component, type ComponentProps } from "solid-js";
import type { EdgeModel, TaskModel } from "../contexts/board-model";
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
      <Index each={boardState.sectionY.configs()}>
        {(entry) => <HorizontalPath config={entry()} />}
      </Index>
      <Index each={boardState.sectionX.configs()}>
        {(entry) => <VerticalPath config={entry()} />}
      </Index>
    </>
  );
};

export const ExportableSectionGridPaths: Component = () => {
  const boardState = useBoardStateContext();

  return (
    <>
      <Index each={boardState.sectionY.configs()}>
        {(entry) => <ExportableHorizontalPath position={entry().end} />}
      </Index>
      <Index each={boardState.sectionX.configs()}>
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
        attribute: "positionY",
        offset: SECTION_Y_OFFSET,
        position: props.config.end,
        tasks: boardState.store.tasks,
      });

      setMaxNotDraggedPosition(maxNotDraggedPosition);
      setStartPosition(props.config.end);
      setDraggedTasks(draggedTasks);
    },
    onDragged(event) {
      const transformValue = transform();

      const updatedY = (event.y - transformValue.y) / transformValue.k - SECTION_Y_OFFSET;
      const withLimit = Math.max(maxNotDraggedPosition(), updatedY);

      boardState.sectionX.updateSectionPosition({
        draggedTasks: draggedTasks(),
        position: withLimit,
        sectionId: props.config.section.id,
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
        attribute: "positionX",
        offset: SECTION_X_OFFSET,
        position: props.config.end,
        tasks: boardState.store.tasks,
      });

      const { draggedEdges } = getDragStartEdgeState({
        edges: boardState.store.edges,
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

      boardState.sectionY.updateSectionPosition({
        draggedEdges: draggedEdges(),
        draggedTasks: draggedTasks(),
        position: withLimit,
        sectionId: props.config.section.id,
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
  tasks: TaskModel[];
  offset: number;
  attribute: "positionY" | "positionX";
};

const getDragStartTaskState = ({
  position,
  tasks,
  offset,
  attribute,
}: GetDragStartTaskStateArgs) => {
  let maxNotDraggedPosition = 0;
  const draggedTasks = new Map<string, number>();

  for (const task of tasks) {
    const entryPosition = task[attribute];
    if (entryPosition > position + offset) {
      draggedTasks.set(task.id, entryPosition);
    } else {
      const shiftedPosition = entryPosition - offset + 10;
      maxNotDraggedPosition = Math.max(maxNotDraggedPosition, shiftedPosition);
    }
  }

  return { draggedTasks, maxNotDraggedPosition };
};

type GetDragStartEdgeStateArgs = {
  position: number;
  edges: EdgeModel[];
  offset: number;
};

const getDragStartEdgeState = ({ position, edges, offset }: GetDragStartEdgeStateArgs) => {
  const draggedEdges = new Map<string, number>();

  for (const edge of edges) {
    const entryPosition = edge.breakX;
    if (entryPosition > position + offset) {
      draggedEdges.set(edge.id, entryPosition);
    }
  }

  return { draggedEdges };
};
