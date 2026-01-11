import { createMemo, createSignal, For, type Component } from "solid-js";
import { axisCollection, taskCollection } from "~/integrations/tanstack-db/collections";
import { useAxisConfigContext } from "../contexts/axis-config";
import { useBoardThemeContext } from "../contexts/board-theme";
import { useBoardTransformContext } from "../contexts/board-transform";
import { useDrag } from "../contexts/drag-state";
import { useTasksDataContext } from "../contexts/tasks-data";
import { AXIS_OFFSET } from "../utils/constants";

export const AxisGridPaths: Component = () => {
  const axisConfig = useAxisConfigContext();

  return (
    <>
      <HorizontalPath position={0} start={0} />
      <VerticalPath position={0} start={0} />
      <For each={axisConfig().config.y}>
        {(entry) => (
          <HorizontalPath axisId={entry.axis.id} start={entry.start} position={entry.end} />
        )}
      </For>
      <For each={axisConfig().config.x}>
        {(entry) => (
          <VerticalPath axisId={entry.axis.id} start={entry.start} position={entry.end} />
        )}
      </For>
    </>
  );
};

type HorizontalPathProps = {
  axisId?: string;
  position: number;
  start: number;
};

const HorizontalPath: Component<HorizontalPathProps> = (props) => {
  const boardTheme = useBoardThemeContext();

  const tasksData = useTasksDataContext();

  const boardTransform = useBoardTransformContext();

  const transformed = createMemo(() => boardTransform().translateY(props.position + AXIS_OFFSET));

  const [draggedTasks, setDraggedTasks] = createSignal<Map<string, number>>(new Map());
  const [maxNotDraggedPosition, setMaxNotDraggedPosition] = createSignal(0);
  const [startPosition, setStartPosition] = createSignal<number>(0);
  const [rectRef, setRectRef] = createSignal<SVGCircleElement>();

  useDrag({
    onDragStarted() {
      let maxNotDraggedPosition = 0;
      const draggedTasks = new Map<string, number>();
      for (const entry of tasksData().entries) {
        if (entry.positionY > props.position + AXIS_OFFSET) {
          draggedTasks.set(entry.id, entry.positionY);
        } else {
          maxNotDraggedPosition = Math.max(
            maxNotDraggedPosition,
            entry.positionY - AXIS_OFFSET + 10,
          );
        }
      }

      setMaxNotDraggedPosition(maxNotDraggedPosition);
      setStartPosition(props.position);
      setDraggedTasks(draggedTasks);
    },
    onDragged(event) {
      if (props.axisId) {
        const transform = boardTransform().transform();
        const updatedY = (event.y - transform.y) / transform.k - AXIS_OFFSET;
        const withLimit = Math.max(maxNotDraggedPosition(), updatedY);
        const size = withLimit - props.start;

        axisCollection.update(props.axisId, (draft) => {
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
      }
    },
    ref: rectRef,
  });

  return (
    <rect
      ref={setRectRef}
      x={0}
      class="w-full"
      y={transformed()}
      height={2}
      fill={boardTheme().axisGridColor}
    />
  );
};

type VerticalPathProps = {
  axisId?: string;
  position: number;
  start: number;
};

const VerticalPath: Component<VerticalPathProps> = (props) => {
  const boardTheme = useBoardThemeContext();

  const tasksData = useTasksDataContext();

  const boardTransform = useBoardTransformContext();

  const transformed = createMemo(() => boardTransform().translateX(props.position + AXIS_OFFSET));

  const [draggedTasks, setDraggedTasks] = createSignal<Map<string, number>>(new Map());
  const [maxNotDraggedPosition, setMaxNotDraggedPosition] = createSignal(0);
  const [startPosition, setStartPosition] = createSignal<number>(0);
  const [rectRef, setRectRef] = createSignal<SVGCircleElement>();

  useDrag({
    onDragStarted() {
      let maxNotDraggedPosition = 0;
      const draggedTasks = new Map<string, number>();
      for (const entry of tasksData().entries) {
        if (entry.positionX > props.position + AXIS_OFFSET) {
          draggedTasks.set(entry.id, entry.positionX);
        } else {
          maxNotDraggedPosition = Math.max(
            maxNotDraggedPosition,
            entry.positionX - AXIS_OFFSET + 10,
          );
        }
      }

      setMaxNotDraggedPosition(maxNotDraggedPosition);
      setStartPosition(props.position);
      setDraggedTasks(draggedTasks);
    },
    onDragged(event) {
      if (props.axisId) {
        const transform = boardTransform().transform();
        const updatedX = (event.x - transform.x) / transform.k - AXIS_OFFSET;
        const withLimit = Math.max(maxNotDraggedPosition(), updatedX);
        const size = withLimit - props.start;

        axisCollection.update(props.axisId, (draft) => {
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
      }
    },
    ref: rectRef,
  });

  return (
    <rect
      ref={setRectRef}
      y={0}
      class="h-screen"
      x={transformed()}
      width={2}
      fill={boardTheme().axisGridColor}
    />
  );
};
