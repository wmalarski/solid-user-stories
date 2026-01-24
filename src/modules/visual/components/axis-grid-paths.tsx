import { createMemo, createSignal, Index, type Component, type ComponentProps } from "solid-js";
import { axisCollection, taskCollection } from "~/integrations/tanstack-db/collections";
import { useAxisConfigContext, type AxisConfig } from "../contexts/axis-config";
import { useBoardStateContext } from "../contexts/board-state";
import { translateX, translateY, useBoardTransformContext } from "../contexts/board-transform";
import { AXIS_X_OFFSET, AXIS_Y_OFFSET } from "../utils/constants";
import { createD3DragElement } from "../utils/create-d3-drag-element";

const sharedLineProps: ComponentProps<"line"> = {
  class: "stroke-base-content",
  "stroke-dasharray": "5,5",
  "stroke-opacity": 0.2,
  "stroke-width": 3,
};

export const AxisGridStaticPaths: Component = () => {
  return (
    <>
      <HorizontalZeroPath />
      <VerticalZeroPath />
    </>
  );
};

export const AxisGridPaths: Component = () => {
  const axisConfig = useAxisConfigContext();

  return (
    <>
      <Index each={axisConfig().config.y}>{(entry) => <HorizontalPath config={entry()} />}</Index>
      <Index each={axisConfig().config.x}>{(entry) => <VerticalPath config={entry()} />}</Index>
    </>
  );
};

const HorizontalZeroPath: Component = () => {
  const [transform] = useBoardTransformContext();

  const y = createMemo(() => translateY(transform(), AXIS_Y_OFFSET));

  return <line {...sharedLineProps} x1={0} x2="100%" y1={y()} y2={y()} />;
};

const VerticalZeroPath: Component = () => {
  const [transform] = useBoardTransformContext();

  const x = createMemo(() => translateX(transform(), AXIS_X_OFFSET));

  return <line y1={0} y2="100%" x1={x()} x2={x()} {...sharedLineProps} />;
};

type HorizontalPathProps = {
  config: AxisConfig;
};

const HorizontalPath: Component<HorizontalPathProps> = (props) => {
  const boardState = useBoardStateContext();

  const [transform] = useBoardTransformContext();

  const transformed = createMemo(() => translateY(transform(), props.config.end + AXIS_Y_OFFSET));

  const [ref, setRef] = createSignal<SVGCircleElement>();
  const [draggedTasks, setDraggedTasks] = createSignal<Map<string, number>>(new Map());
  const [maxNotDraggedPosition, setMaxNotDraggedPosition] = createSignal(0);
  const [startPosition, setStartPosition] = createSignal<number>(0);

  createD3DragElement({
    onDragStarted() {
      let maxNotDraggedPosition = 0;
      const draggedTasks = new Map<string, number>();
      for (const entry of boardState.tasks()) {
        if (entry.positionY > props.config.end + AXIS_Y_OFFSET) {
          draggedTasks.set(entry.id, entry.positionY);
        } else {
          maxNotDraggedPosition = Math.max(
            maxNotDraggedPosition,
            entry.positionY - AXIS_Y_OFFSET + 10,
          );
        }
      }

      setMaxNotDraggedPosition(maxNotDraggedPosition);
      setStartPosition(props.config.end);
      setDraggedTasks(draggedTasks);
    },
    onDragged(event) {
      const transformValue = transform();
      const updatedY = (event.y - transformValue.y) / transformValue.k - AXIS_Y_OFFSET;
      const withLimit = Math.max(maxNotDraggedPosition(), updatedY);
      const size = withLimit - props.config.start;

      axisCollection.update(props.config.axis.id, (draft) => {
        draft.size = size;
      });

      const shift = withLimit - startPosition();
      const draggedTasksValue = draggedTasks();

      if (draggedTasksValue.size > 0) {
        taskCollection.update([...draggedTasksValue.keys()], (drafts) => {
          for (const draft of drafts) {
            const position = draggedTasksValue.get(draft.id) ?? draft.positionY;
            draft.positionY = position + shift;
          }
        });
      }
    },
    ref,
  });

  return (
    <>
      <line x1={0} x2="100%" y1={transformed()} y2={transformed()} {...sharedLineProps} />
      <line
        ref={setRef}
        x1={0}
        x2="100%"
        y1={transformed()}
        y2={transformed()}
        stroke="transparent"
        stroke-width={16}
      />
    </>
  );
};

type VerticalPathProps = {
  config: AxisConfig;
};

const VerticalPath: Component<VerticalPathProps> = (props) => {
  const boardState = useBoardStateContext();

  const [transform] = useBoardTransformContext();

  const transformed = createMemo(() => translateX(transform(), props.config.end + AXIS_X_OFFSET));

  const [ref, setRef] = createSignal<SVGElement>();
  const [draggedTasks, setDraggedTasks] = createSignal<Map<string, number>>(new Map());
  const [maxNotDraggedPosition, setMaxNotDraggedPosition] = createSignal(0);
  const [startPosition, setStartPosition] = createSignal<number>(0);

  createD3DragElement({
    onDragStarted() {
      let maxNotDraggedPosition = 0;
      const draggedTasks = new Map<string, number>();
      for (const entry of boardState.tasks()) {
        if (entry.positionX > props.config.end + AXIS_X_OFFSET) {
          draggedTasks.set(entry.id, entry.positionX);
        } else {
          maxNotDraggedPosition = Math.max(
            maxNotDraggedPosition,
            entry.positionX - AXIS_X_OFFSET + 10,
          );
        }
      }

      setMaxNotDraggedPosition(maxNotDraggedPosition);
      setStartPosition(props.config.end);
      setDraggedTasks(draggedTasks);
    },
    onDragged(event) {
      const transformValue = transform();
      const updatedX = (event.x - transformValue.x) / transformValue.k - AXIS_X_OFFSET;
      const withLimit = Math.max(maxNotDraggedPosition(), updatedX);
      const size = withLimit - props.config.start;

      axisCollection.update(props.config.axis.id, (draft) => {
        draft.size = size;
      });

      const shift = withLimit - startPosition();
      const draggedTasksValue = draggedTasks();

      if (draggedTasksValue.size > 0) {
        taskCollection.update([...draggedTasksValue.keys()], (drafts) => {
          for (const draft of drafts) {
            const position = draggedTasksValue.get(draft.id) ?? draft.positionX;
            draft.positionX = position + shift;
          }
        });
      }
    },
    ref,
  });

  return (
    <>
      <line y1={0} y2="100%" x1={transformed()} x2={transformed()} {...sharedLineProps} />
      <line
        ref={setRef}
        y1={0}
        y2="100%"
        x1={transformed()}
        x2={transformed()}
        stroke="transparent"
        stroke-width={16}
      />
    </>
  );
};
