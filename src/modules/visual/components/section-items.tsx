import { createMemo, Index, Show, type Accessor, type Component } from "solid-js";
import { cx } from "tailwind-variants";
import { createLink } from "~/integrations/router/create-link";
import { Badge } from "~/ui/badge/badge";
import { LinkButton } from "~/ui/button/button";
import { ChevronLeftIcon } from "~/ui/icons/chevron-left-icon";
import { useBoardStateContext } from "../contexts/board-state";
import { translateX, translateY, useBoardTransformContext } from "../contexts/board-transform";
import { MultilineText } from "../ui/multiline-text";
import { SECTION_X_OFFSET, SECTION_Y_OFFSET, TEXT_HEIGHT, TEXT_PADDING } from "../utils/constants";
import type { SectionConfig2 } from "../utils/section-configs";
import { DeleteSectionDialog, InsertSectionDialog, UpdateSectionDialog } from "./section-dialogs";

export const SectionItems: Component = () => {
  const boardState = useBoardStateContext();

  const xLength = createMemo(() => boardState.sectionXConfigs2().length);
  const yLength = createMemo(() => boardState.sectionYConfigs2().length);

  return (
    <>
      <HorizontalBackgroundRect />
      <VerticalBackgroundRect />
      <Index each={boardState.sectionXConfigs2()}>
        {(entry) => <HorizontalItemRect totalLength={xLength()} config={entry()} />}
      </Index>
      <Index each={boardState.sectionYConfigs2()}>
        {(entry) => <VerticalItemRect totalLength={yLength()} config={entry()} />}
      </Index>
      <CenterRect />
    </>
  );
};

export const ExportableSectionItems: Component = () => {
  const boardState = useBoardStateContext();

  return (
    <>
      <rect
        class="fill-base-300"
        x={0}
        y={0}
        height={SECTION_Y_OFFSET}
        width="100%"
        filter="url(#dropshadow)"
      />
      <rect
        class="fill-base-300"
        x={0}
        y={0}
        height="100%"
        width={SECTION_X_OFFSET}
        filter="url(#dropshadow)"
      />
      <Index each={boardState.sectionXConfigs2()}>
        {(entry) => <ExportableHorizontalItemRect config={entry()} />}
      </Index>
      <Index each={boardState.sectionYConfigs2()}>
        {(entry) => <ExportableVerticalItemRect config={entry()} />}
      </Index>
    </>
  );
};

const HorizontalBackgroundRect: Component = () => {
  return (
    <>
      <rect
        class="opacity-40"
        x={SECTION_X_OFFSET}
        y={0}
        height={SECTION_Y_OFFSET - 2}
        width="100%"
        filter="url(#dropshadow)"
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
        filter="url(#dropshadow)"
      />
      <rect class="fill-base-300" x={0} y={0} height="100%" width={SECTION_X_OFFSET} />
    </>
  );
};

type HorizontalItemRectProps = {
  config: SectionConfig2;
  totalLength: number;
};

const HorizontalItemRect: Component<HorizontalItemRectProps> = (props) => {
  const [transform] = useBoardTransformContext();

  const transformed = createMemo(() =>
    translateX(transform(), props.config.start + SECTION_X_OFFSET),
  );

  const width = createMemo(() => props.config.section.size * transform().k);

  return (
    <foreignObject width={width()} x={transformed()} y={0} height={SECTION_Y_OFFSET}>
      <SectionItemContent config={props.config} totalLength={props.totalLength} />
    </foreignObject>
  );
};

type VerticalItemRectProps = {
  config: SectionConfig2;
  totalLength: number;
};

const VerticalItemRect: Component<VerticalItemRectProps> = (props) => {
  const [transform] = useBoardTransformContext();

  const transformed = createMemo(() =>
    translateY(transform(), props.config.start + SECTION_Y_OFFSET),
  );

  const height = createMemo(() => props.config.section.size * transform().k);

  return (
    <foreignObject height={height()} x={0} y={transformed()} width={SECTION_X_OFFSET}>
      <SectionItemContent config={props.config} totalLength={props.totalLength} />
    </foreignObject>
  );
};

type SectionItemContentProps = {
  config: SectionConfig2;
  totalLength: number;
};

const SectionItemContent: Component<SectionItemContentProps> = (props) => {
  const isVertical = createMemo(() => {
    return props.config.section.orientation === "vertical";
  });

  const { esitmationSum, tasks } = createSectionItemValues(() => props.config);

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
        <Show when={props.totalLength > 1 && tasks()?.length === 0}>
          <DeleteSectionDialog section={props.config.section} endPosition={props.config.end} />
        </Show>
        <Badge size="sm" color="accent" class="my-1">
          {esitmationSum()}
        </Badge>
      </div>
    </div>
  );
};

const createSectionItemValues = (config: Accessor<SectionConfig2>) => {
  const boardState = useBoardStateContext();

  const tasks = createMemo(() => {
    const configValue = config();
    const isVerticalValue = configValue.section.orientation === "vertical";
    const sectionId = configValue.section.id;
    return boardState.store.tasks.filter((entry) =>
      isVerticalValue ? entry.sectionY === sectionId : entry.sectionX === sectionId,
    );
  });

  const esitmationSum = createMemo(() => {
    return tasks()?.reduce((previous, current) => previous + current.estimate, 0);
  });

  return { esitmationSum, tasks };
};

const CenterRect: Component = () => {
  const boardState = useBoardStateContext();

  return (
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
  );
};

type ExportableHorizontalItemRectProps = {
  config: SectionConfig2;
};

const ExportableHorizontalItemRect: Component<ExportableHorizontalItemRectProps> = (props) => {
  const { esitmationSum } = createSectionItemValues(() => props.config);

  return (
    <>
      <rect
        width={props.config.section.size}
        x={props.config.start + SECTION_X_OFFSET}
        y={0}
        height={SECTION_Y_OFFSET}
        class="fill-base-200"
      />
      <MultilineText
        x={props.config.start + SECTION_X_OFFSET + TEXT_PADDING}
        y={TEXT_PADDING + TEXT_HEIGHT}
        font-weight={600}
        class="fill-base-content"
        content={props.config.section.name}
        maxWidth={props.config.section.size - 2 * TEXT_PADDING}
        maxLines={3}
        font-size="12"
      />
      <text
        x={props.config.end + SECTION_X_OFFSET - TEXT_PADDING}
        y={SECTION_Y_OFFSET - TEXT_PADDING}
        class="fill-base-content"
        text-anchor="end"
        font-size="20"
        font-weight={600}
      >
        {esitmationSum()}
      </text>
    </>
  );
};

type ExportableVerticalItemRectProps = {
  config: SectionConfig2;
};

const ExportableVerticalItemRect: Component<ExportableVerticalItemRectProps> = (props) => {
  const { esitmationSum } = createSectionItemValues(() => props.config);

  return (
    <>
      <rect
        height={props.config.section.size}
        x={0}
        y={props.config.start + SECTION_Y_OFFSET}
        width={SECTION_X_OFFSET}
        class="fill-base-200"
      />

      <MultilineText
        x={TEXT_PADDING}
        y={props.config.start + SECTION_Y_OFFSET + (TEXT_PADDING + TEXT_HEIGHT)}
        font-weight={600}
        class="fill-base-content"
        content={props.config.section.name}
        font-size="12"
        maxWidth={SECTION_X_OFFSET - 2 * TEXT_PADDING}
        maxLines={3}
      />

      <text
        x={SECTION_X_OFFSET - TEXT_PADDING}
        y={props.config.end + SECTION_Y_OFFSET - TEXT_PADDING}
        class="fill-base-content"
        text-anchor="end"
        font-size="20"
        font-weight={600}
      >
        {esitmationSum()}
      </text>
    </>
  );
};
