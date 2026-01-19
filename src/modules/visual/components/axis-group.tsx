import { eq, useLiveQuery } from "@tanstack/solid-db";
import { createMemo, createUniqueId, Index, Show, type Component } from "solid-js";
import { useI18n } from "~/integrations/i18n";
import { taskCollection } from "~/integrations/tanstack-db/collections";
import type { AxisModel, TaskModel } from "~/integrations/tanstack-db/schema";
import { Button } from "~/ui/button/button";
import { openDialog } from "~/ui/dialog/dialog";
import { PencilIcon } from "~/ui/icons/pencil-icon";
import { PlusIcon } from "~/ui/icons/plus-icon";
import { TrashIcon } from "~/ui/icons/trash-icon";
import { useAxisConfigContext, type AxisConfig } from "../contexts/axis-config";
import { translateX, translateY, useBoardTransformContext } from "../contexts/board-transform";
import { AXIS_OFFSET, BUTTON_PADDING, BUTTON_SIZE } from "../utils/constants";
import { DeleteAxisDialog, InsertAxisDialog, UpdateAxisDialog } from "./axis-dialogs";

export const AxisGroup: Component = () => {
  const axisConfig = useAxisConfigContext();

  const xLength = createMemo(() => axisConfig().config.x.length);
  const yLength = createMemo(() => axisConfig().config.y.length);

  // const boardTransform = useBoardTransformContext();

  // const insertX = createMemo(
  //   () =>
  //     translateX(
  //       boardTransform().transform,
  //       (axisConfig().config.x.at(-1)?.end ?? 0) + AXIS_OFFSET,
  //     ) + BUTTON_PADDING,
  // );

  // const insertY = createMemo(
  //   () =>
  //     translateY(
  //       boardTransform().transform,
  //       (axisConfig().config.y.at(-1)?.end ?? 0) + AXIS_OFFSET,
  //     ) + BUTTON_PADDING,
  // );

  return (
    <>
      <HorizontalBackgroundRect />
      <VerticalBackgroundRect />
      <Index each={axisConfig().config.x}>
        {(entry, index) => (
          <HorizontalItemRect totalLength={xLength()} config={entry()} index={index} />
        )}
      </Index>
      <Index each={axisConfig().config.y}>
        {(entry, index) => (
          <VerticalItemRect totalLength={yLength()} config={entry()} index={index} />
        )}
      </Index>
      {/* <AxisInsertButton
        index={xLength() - 1}
        orientation="horizontal"
      />
      <AxisInsertButton
        index={yLength() - 1}
        orientation="vertical"
      /> */}
    </>
  );
};

const HorizontalBackgroundRect: Component = () => {
  return <rect class="w-screen fill-base-300" x={0} y={0} height={100} />;
};

const VerticalBackgroundRect: Component = () => {
  return <rect class="h-screen fill-base-300" x={0} y={0} width={100} />;
};

type HorizontalItemRectProps = {
  config: AxisConfig;
  index: number;
  totalLength: number;
};

const HorizontalItemRect: Component<HorizontalItemRectProps> = (props) => {
  const boardTransform = useBoardTransformContext();

  const transformed = createMemo(() =>
    translateX(boardTransform().transform, props.config.start + AXIS_OFFSET),
  );

  const width = createMemo(() => props.config.axis.size * boardTransform().transform.k);

  const endX = createMemo(() => transformed() + width());

  const tasks = useLiveQuery((q) =>
    q.from({ tasks: taskCollection }).where(({ tasks }) => eq(tasks.axisX, props.config.axis.id)),
  );

  return (
    <>
      <foreignObject width={width()} x={transformed()} y={0} height={AXIS_OFFSET}>
        <div class="bg-base-200 w-full h-full flex gap-1 px-3 py-1">
          <div class="flex flex-col grow">
            <span>{props.config.axis.name}</span>
            <span>{props.config.axis.id}</span>
            <AxisSummaryText tasks={tasks()} />
          </div>
          <div>
            <AxisInsertButton orientation={props.config.axis.orientation} index={props.index} />
            <AxisUpdateButton axis={props.config.axis} />
            <Show when={props.totalLength > 1 && tasks().length === 0}>
              <AxisDeleteButton
                axis={props.config.axis}
                x={endX() - BUTTON_SIZE - BUTTON_PADDING}
                y={BUTTON_PADDING + 2 * (BUTTON_SIZE + BUTTON_PADDING)}
              />
            </Show>
          </div>
        </div>
      </foreignObject>
    </>
  );
};

type VerticalItemRectProps = {
  config: AxisConfig;
  index: number;
  totalLength: number;
};

const VerticalItemRect: Component<VerticalItemRectProps> = (props) => {
  const boardTransform = useBoardTransformContext();

  const transformed = createMemo(() =>
    translateY(boardTransform().transform, props.config.start + AXIS_OFFSET),
  );

  const buttonX = AXIS_OFFSET - BUTTON_SIZE - BUTTON_PADDING;

  const tasks = useLiveQuery((q) =>
    q.from({ tasks: taskCollection }).where(({ tasks }) => eq(tasks.axisY, props.config.axis.id)),
  );

  return (
    <>
      <foreignObject
        height={props.config.axis.size * boardTransform().transform.k}
        x={0}
        y={transformed()}
        width={AXIS_OFFSET}
      >
        <div class="bg-base-200 w-full h-full flex px-3 py-1 gap-1">
          <div class="flex flex-col grow">
            <span>{props.config.axis.name}</span>
            <span>{props.config.axis.id}</span>
            <AxisSummaryText tasks={tasks()} />
          </div>
          <div>
            <AxisInsertButton orientation={props.config.axis.orientation} index={props.index} />
            <AxisUpdateButton axis={props.config.axis} />
            <Show when={props.totalLength > 1 && tasks().length === 0}>
              <AxisDeleteButton
                axis={props.config.axis}
                x={buttonX}
                y={transformed() + BUTTON_PADDING + 2 * (BUTTON_SIZE + BUTTON_PADDING)}
              />
            </Show>
          </div>
        </div>
      </foreignObject>
    </>
  );
};

type AxisSummaryTextProps = {
  tasks: TaskModel[];
};

const AxisSummaryText: Component<AxisSummaryTextProps> = (props) => {
  const esitmationSum = createMemo(() => {
    return props.tasks.reduce((previous, current) => previous + current.estimate, 0);
  });

  return <span>{esitmationSum()}</span>;
};

type AxisInsertButtonProps = {
  orientation: AxisModel["orientation"];
  index: number;
};

const AxisInsertButton: Component<AxisInsertButtonProps> = (props) => {
  const { t } = useI18n();

  const dialogId = createUniqueId();

  const onButtonClick = () => {
    openDialog(dialogId);
  };

  return (
    <>
      <Button
        aria-label={t("board.axis.insertAxis")}
        shape="circle"
        size="sm"
        onClick={onButtonClick}
      >
        <PlusIcon class="size-4" />
      </Button>
      <InsertAxisDialog dialogId={dialogId} index={props.index} orientation={props.orientation} />
    </>
  );
};

type AxisUpdateButtonProps = {
  axis: AxisModel;
};

const AxisUpdateButton: Component<AxisUpdateButtonProps> = (props) => {
  const { t } = useI18n();

  const dialogId = createUniqueId();

  const onButtonClick = () => {
    openDialog(dialogId);
  };

  return (
    <>
      <Button
        aria-label={t("board.axis.updateAxis")}
        shape="circle"
        size="sm"
        onClick={onButtonClick}
      >
        <PencilIcon class="size-4" />
      </Button>
      <UpdateAxisDialog axis={props.axis} dialogId={dialogId} />
    </>
  );
};

type AxisDeleteButtonProps = {
  axis: AxisModel;
  x: number;
  y: number;
};

const AxisDeleteButton: Component<AxisDeleteButtonProps> = (props) => {
  const { t } = useI18n();

  const dialogId = createUniqueId();

  const onButtonClick = () => {
    openDialog(dialogId);
  };

  return (
    <>
      <Button
        aria-label={t("board.axis.deleteAxis")}
        shape="circle"
        size="sm"
        onClick={onButtonClick}
      >
        <TrashIcon class="size-4" />
      </Button>
      <DeleteAxisDialog axisId={props.axis.id} dialogId={dialogId} />
    </>
  );
};
