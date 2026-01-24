import { createMemo, createSignal, Index, type Component, type ComponentProps } from "solid-js";
import { sectionCollection, taskCollection } from "~/integrations/tanstack-db/collections";
import { useBoardStateContext } from "../contexts/board-state";
import { translateX, translateY, useBoardTransformContext } from "../contexts/board-transform";
import { useSectionConfigsContext, type SectionConfig } from "../contexts/section-configs";
import { SECTION_X_OFFSET, SECTION_Y_OFFSET } from "../utils/constants";
import { createD3DragElement } from "../utils/create-d3-drag-element";

const sharedLineProps: ComponentProps<"line"> = {
  class: "stroke-base-content",
  "stroke-dasharray": "5,5",
  "stroke-opacity": 0.2,
  "stroke-width": 3,
};

export const SectionGridStaticPaths: Component = () => {
  return (
    <>
      <HorizontalZeroPath />
      <VerticalZeroPath />
    </>
  );
};

export const SectionGridPaths: Component = () => {
  const sectionConfigs = useSectionConfigsContext();

  return (
    <>
      <Index each={sectionConfigs().y}>{(entry) => <HorizontalPath config={entry()} />}</Index>
      <Index each={sectionConfigs().x}>{(entry) => <VerticalPath config={entry()} />}</Index>
    </>
  );
};

const HorizontalZeroPath: Component = () => {
  const [transform] = useBoardTransformContext();

  const y = createMemo(() => translateY(transform(), SECTION_Y_OFFSET));

  return <line {...sharedLineProps} x1={0} x2="100%" y1={y()} y2={y()} />;
};

const VerticalZeroPath: Component = () => {
  const [transform] = useBoardTransformContext();

  const x = createMemo(() => translateX(transform(), SECTION_X_OFFSET));

  return <line y1={0} y2="100%" x1={x()} x2={x()} {...sharedLineProps} />;
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
      let maxNotDraggedPosition = 0;
      const draggedTasks = new Map<string, number>();
      for (const entry of boardState.tasks()) {
        if (entry.positionY > props.config.end + SECTION_Y_OFFSET) {
          draggedTasks.set(entry.id, entry.positionY);
        } else {
          maxNotDraggedPosition = Math.max(
            maxNotDraggedPosition,
            entry.positionY - SECTION_Y_OFFSET + 10,
          );
        }
      }

      setMaxNotDraggedPosition(maxNotDraggedPosition);
      setStartPosition(props.config.end);
      setDraggedTasks(draggedTasks);
    },
    onDragged(event) {
      const transformValue = transform();
      const updatedY = (event.y - transformValue.y) / transformValue.k - SECTION_Y_OFFSET;
      const withLimit = Math.max(maxNotDraggedPosition(), updatedY);
      const size = withLimit - props.config.start;

      sectionCollection.update(props.config.section.id, (draft) => {
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
  const [maxNotDraggedPosition, setMaxNotDraggedPosition] = createSignal(0);
  const [startPosition, setStartPosition] = createSignal<number>(0);

  createD3DragElement({
    onDragStarted() {
      let maxNotDraggedPosition = 0;
      const draggedTasks = new Map<string, number>();
      for (const entry of boardState.tasks()) {
        if (entry.positionX > props.config.end + SECTION_X_OFFSET) {
          draggedTasks.set(entry.id, entry.positionX);
        } else {
          maxNotDraggedPosition = Math.max(
            maxNotDraggedPosition,
            entry.positionX - SECTION_X_OFFSET + 10,
          );
        }
      }

      setMaxNotDraggedPosition(maxNotDraggedPosition);
      setStartPosition(props.config.end);
      setDraggedTasks(draggedTasks);
    },
    onDragged(event) {
      const transformValue = transform();
      const updatedX = (event.x - transformValue.x) / transformValue.k - SECTION_X_OFFSET;
      const withLimit = Math.max(maxNotDraggedPosition(), updatedX);
      const size = withLimit - props.config.start;

      sectionCollection.update(props.config.section.id, (draft) => {
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
