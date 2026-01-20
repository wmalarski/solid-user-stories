import { createMemo, createSignal, Index, type Component, type ComponentProps } from "solid-js";
import { axisCollection, taskCollection } from "~/integrations/tanstack-db/collections";
import { useAxisConfigContext, type AxisConfig } from "../contexts/axis-config";
import { translateX, translateY, useBoardTransformContext } from "../contexts/board-transform";
import { useDrag } from "../contexts/drag-state";
import { useTasksDataContext } from "../contexts/tasks-data";
import { AXIS_X_OFFSET, AXIS_Y_OFFSET } from "../utils/constants";

const sharedLineProps: ComponentProps<"line"> = {
  class: "stroke-base-content",
  "stroke-dasharray": "5,5",
  "stroke-opacity": 0.2,
  "stroke-width": 3,
};

export const AxisGridPaths: Component = () => {
  const axisConfig = useAxisConfigContext();

  return (
    <>
      <HorizontalZeroPath />
      <VerticalZeroPath />
      <Index each={axisConfig().config.y}>{(entry) => <HorizontalPath config={entry()} />}</Index>
      <Index each={axisConfig().config.x}>{(entry) => <VerticalPath config={entry()} />}</Index>
    </>
  );
};

const HorizontalZeroPath: Component = () => {
  const boardTransform = useBoardTransformContext();

  const y = createMemo(() => translateY(boardTransform().transform, AXIS_Y_OFFSET));

  return <line {...sharedLineProps} x1={0} x2="100%" y1={y()} y2={y()} />;
};

const VerticalZeroPath: Component = () => {
  const boardTransform = useBoardTransformContext();

  const x = createMemo(() => translateX(boardTransform().transform, AXIS_X_OFFSET));

  return <line y1={0} y2="100%" x1={x()} x2={x()} {...sharedLineProps} />;
};

type HorizontalPathProps = {
  config: AxisConfig;
};

const HorizontalPath: Component<HorizontalPathProps> = (props) => {
  const tasksData = useTasksDataContext();

  const boardTransform = useBoardTransformContext();

  const transformed = createMemo(() =>
    translateY(boardTransform().transform, props.config.end + AXIS_Y_OFFSET),
  );

  const [ref, setRef] = createSignal<SVGCircleElement>();
  const [draggedTasks, setDraggedTasks] = createSignal<Map<string, number>>(new Map());
  const [maxNotDraggedPosition, setMaxNotDraggedPosition] = createSignal(0);
  const [startPosition, setStartPosition] = createSignal<number>(0);

  useDrag({
    onDragStarted() {
      let maxNotDraggedPosition = 0;
      const draggedTasks = new Map<string, number>();
      for (const entry of tasksData().entries) {
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
      const transform = boardTransform().transform;
      const updatedY = (event.y - transform.y) / transform.k - AXIS_Y_OFFSET;
      const withLimit = Math.max(maxNotDraggedPosition(), updatedY);
      const size = withLimit - props.config.start;

      axisCollection.update(props.config.axis.id, (draft) => {
        draft.size = size;
      });

      const shift = withLimit - startPosition();
      const draggedTasksValue = draggedTasks();

      taskCollection.update([...draggedTasksValue.keys()], (drafts) => {
        for (const draft of drafts) {
          const position = draggedTasksValue.get(draft.id) ?? draft.positionY;
          draft.positionY = position + shift;
        }
      });
    },
    ref,
  });

  return (
    <line
      ref={setRef}
      x1={0}
      x2="100%"
      y1={transformed()}
      y2={transformed()}
      {...sharedLineProps}
    />
  );
};

type VerticalPathProps = {
  config: AxisConfig;
};

const VerticalPath: Component<VerticalPathProps> = (props) => {
  const tasksData = useTasksDataContext();

  const boardTransform = useBoardTransformContext();

  const transformed = createMemo(() =>
    translateX(boardTransform().transform, props.config.end + AXIS_X_OFFSET),
  );

  const [ref, setRef] = createSignal<SVGElement>();
  const [draggedTasks, setDraggedTasks] = createSignal<Map<string, number>>(new Map());
  const [maxNotDraggedPosition, setMaxNotDraggedPosition] = createSignal(0);
  const [startPosition, setStartPosition] = createSignal<number>(0);

  useDrag({
    onDragStarted() {
      let maxNotDraggedPosition = 0;
      const draggedTasks = new Map<string, number>();
      for (const entry of tasksData().entries) {
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
      const transform = boardTransform().transform;
      const updatedX = (event.x - transform.x) / transform.k - AXIS_X_OFFSET;
      const withLimit = Math.max(maxNotDraggedPosition(), updatedX);
      const size = withLimit - props.config.start;

      axisCollection.update(props.config.axis.id, (draft) => {
        draft.size = size;
      });

      const shift = withLimit - startPosition();
      const draggedTasksValue = draggedTasks();

      taskCollection.update([...draggedTasksValue.keys()], (drafts) => {
        for (const draft of drafts) {
          const position = draggedTasksValue.get(draft.id) ?? draft.positionX;
          draft.positionX = position + shift;
        }
      });
    },
    ref,
  });

  return (
    <line
      ref={setRef}
      y1={0}
      y2="100%"
      x1={transformed()}
      x2={transformed()}
      {...sharedLineProps}
    />
  );
};
