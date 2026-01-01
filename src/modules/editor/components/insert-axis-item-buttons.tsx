import type { Component } from "solid-js";
import { useI18n } from "~/integrations/i18n";
import { axisCollection, taskCollection } from "~/integrations/tanstack-db/collections";
import { createId } from "~/integrations/tanstack-db/create-id";
import type { AxisModel } from "~/integrations/tanstack-db/schema";
import { Button } from "~/ui/button/button";
import { PlusIcon } from "~/ui/icons/plus-icon";
import { useBoardId } from "../contexts/board-context";
import { AXIS_OFFSET } from "../utils/constants";
import { ToolContainer } from "./tool-container";

export const InsertHorizontalAxisItemButton: Component = () => {
  return (
    <ToolContainer class="top-2 right-4">
      <InsertAxisItemButton orientation="horizontal" />
    </ToolContainer>
  );
};

export const InsertVerticalAxisItemButton: Component = () => {
  return (
    <ToolContainer class="bottom-2 left-2">
      <InsertAxisItemButton orientation="vertical" />
    </ToolContainer>
  );
};

type InsertAxisItemButtonProps = {
  orientation: AxisModel["orientation"];
};

const InsertAxisItemButton: Component<InsertAxisItemButtonProps> = (props) => {
  const { t } = useI18n();

  const boardId = useBoardId();

  const onAddAxisClick = () => {
    const axisId = createId();
    axisCollection.insert({
      boardId: boardId(),
      id: axisId,
      name: `${props.orientation}:${axisId}`,
      orientation: props.orientation,
      size: 300,
    });
  };

  const onAddTaskClick = () => {
    const taskId = createId();
    taskCollection.insert({
      axisX: "",
      axisY: "",
      boardId: boardId(),
      description: `Description:${taskId}`,
      estimate: 1,
      id: taskId,
      positionX: AXIS_OFFSET,
      positionY: AXIS_OFFSET,
      title: `Title:${taskId}`,
    });
  };

  return (
    <>
      <Button onClick={onAddAxisClick} size="xs" variant="ghost">
        <PlusIcon />
        {t("board.axis.insertAxis")}
      </Button>
      <Button onClick={onAddTaskClick} size="xs" variant="ghost">
        <PlusIcon />
        {t("board.tasks.insertTask")}
      </Button>
    </>
  );
};
