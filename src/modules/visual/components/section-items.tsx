import { createMemo, Index, Show, type Component } from "solid-js";
import { cx } from "tailwind-variants";
import { createLink } from "~/integrations/router/create-link";
import { Badge } from "~/ui/badge/badge";
import { LinkButton } from "~/ui/button/button";
import { ChevronLeftIcon } from "~/ui/icons/chevron-left-icon";
import { useBoardStateContext } from "../contexts/board-state";
import { translateX, translateY, useBoardTransformContext } from "../contexts/board-transform";
import { useSectionConfigsContext, type SectionConfig } from "../contexts/section-configs";
import { SECTION_X_OFFSET, SECTION_Y_OFFSET } from "../utils/constants";
import { DeleteSectionDialog, InsertSectionDialog, UpdateSectionDialog } from "./section-dialogs";

export const SectionItems: Component = () => {
  const sectionConfigs = useSectionConfigsContext();

  const xLength = createMemo(() => sectionConfigs().x.length);
  const yLength = createMemo(() => sectionConfigs().y.length);

  return (
    <>
      <HorizontalBackgroundRect />
      <VerticalBackgroundRect />
      <Index each={sectionConfigs().x}>
        {(entry) => <HorizontalItemRect totalLength={xLength()} config={entry()} />}
      </Index>
      <Index each={sectionConfigs().y}>
        {(entry) => <VerticalItemRect totalLength={yLength()} config={entry()} />}
      </Index>
      <CenterRect />
    </>
  );
};

const HorizontalBackgroundRect: Component = () => {
  return (
    <>
      <rect
        class="opacity-30"
        x={SECTION_X_OFFSET}
        y={0}
        height={SECTION_Y_OFFSET - 2}
        width="100%"
        filter="url(#task-shadow)"
      />
      <rect class="fill-base-300" x={0} y={0} height={SECTION_Y_OFFSET} width="100%" />
    </>
  );
};

const VerticalBackgroundRect: Component = () => {
  return (
    <>
      <rect
        class="opacity-40"
        x={0}
        y={SECTION_Y_OFFSET}
        height="100%"
        width={SECTION_X_OFFSET - 2}
        filter="url(#task-shadow)"
      />
      <rect class="fill-base-300" x={0} y={0} height="100%" width={SECTION_X_OFFSET} />
    </>
  );
};

type HorizontalItemRectProps = {
  config: SectionConfig;
  totalLength: number;
};

const HorizontalItemRect: Component<HorizontalItemRectProps> = (props) => {
  const [transform] = useBoardTransformContext();

  const transformed = createMemo(() =>
    translateX(transform(), props.config.start + SECTION_X_OFFSET),
  );

  const width = createMemo(() => props.config.section.size * transform().k);

  return (
    <>
      <foreignObject width={width()} x={transformed()} y={0} height={SECTION_Y_OFFSET}>
        <SectionItemContent config={props.config} totalLength={props.totalLength} />
      </foreignObject>
    </>
  );
};

type VerticalItemRectProps = {
  config: SectionConfig;
  totalLength: number;
};

const VerticalItemRect: Component<VerticalItemRectProps> = (props) => {
  const [transform] = useBoardTransformContext();

  const transformed = createMemo(() =>
    translateY(transform(), props.config.start + SECTION_Y_OFFSET),
  );

  const height = createMemo(() => props.config.section.size * transform().k);

  return (
    <>
      <foreignObject height={height()} x={0} y={transformed()} width={SECTION_X_OFFSET}>
        <SectionItemContent config={props.config} totalLength={props.totalLength} />
      </foreignObject>
    </>
  );
};

type SectionItemContentProps = {
  config: SectionConfig;
  totalLength: number;
};

const SectionItemContent: Component<SectionItemContentProps> = (props) => {
  const boardState = useBoardStateContext();

  const isVertical = createMemo(() => {
    return props.config.section.orientation === "vertical";
  });

  const tasks = createMemo(() => {
    const isVerticalValue = isVertical();
    const sectionId = props.config.section.id;
    return boardState
      .tasks()
      .filter((entry) =>
        isVerticalValue ? entry.sectionY === sectionId : entry.sectionX === sectionId,
      );
  });

  const esitmationSum = createMemo(() => {
    return tasks().reduce((previous, current) => previous + current.estimate, 0);
  });

  return (
    <div class="bg-base-200 w-full h-full grid grid-cols-1 grid-rows-[1fr_auto] p-2">
      <span class="text-sm truncate font-semibold min-h-4">{props.config.section.name}</span>
      <div
        class={cx("flex gap-1 justify-end", {
          "flex-col items-end": isVertical(),
          "items-center": !isVertical(),
        })}
      >
        <InsertSectionDialog
          orientation={props.config.section.orientation}
          index={props.config.index}
        />
        <UpdateSectionDialog section={props.config.section} />
        <Show when={props.totalLength > 1 && tasks().length === 0}>
          <DeleteSectionDialog section={props.config.section} endPosition={props.config.end} />
        </Show>
        <Badge size="sm" color="accent" class="my-1">
          {esitmationSum()}
        </Badge>
      </div>
    </div>
  );
};

const CenterRect: Component = () => {
  const boardState = useBoardStateContext();

  return (
    <>
      <foreignObject
        class="stroke-0 border-0 overflow-hidden"
        x={0}
        y={0}
        width={SECTION_X_OFFSET}
        height={SECTION_Y_OFFSET}
      >
        <div class="grid grid-cols-[auto_1fr] gap-1 p-1 bg-base-300 w-full h-full">
          <LinkButton href={createLink("/", {})} class="mt-1" shape="circle" size="xs">
            <ChevronLeftIcon class="size-4" />
          </LinkButton>
          <div class="grid grid-cols-1 grid-rows-[auto_1fr] text-base-content">
            <span class="font-semibold truncate">{boardState.board().title}</span>
            <span class="text-sm line-clamp-2 opacity-80">{boardState.board().description}</span>
          </div>
        </div>
      </foreignObject>
    </>
  );
};
