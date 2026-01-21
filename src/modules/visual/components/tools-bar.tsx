import type { Component } from "solid-js";
import { useI18n } from "~/integrations/i18n";
import { Button } from "~/ui/button/button";
import { HandIcon } from "~/ui/icons/hand-icon";
import { SquareIcon } from "~/ui/icons/square-icon";
import { Tooltip } from "~/ui/tooltip/tooltip";
import { useToolsStateContext, type ToolType } from "../contexts/tools-state";
import { ToolContainer } from "./tool-container";

export const ToolsBar: Component = () => {
  const { t } = useI18n();

  const toolsState = useToolsStateContext();

  const onToolClickFactory = (tool: ToolType) => () => {
    toolsState().setTool(tool);
  };

  return (
    <div class="absolute bottom-2 w-full flex justify-center">
      <ToolContainer class="justify-center items-center px-3 py-2">
        <Tooltip data-tip={t("board.tools.pane")} placement="top">
          <Button
            aria-label={t("board.tools.pane")}
            onClick={onToolClickFactory("pane")}
            shape="circle"
            size="sm"
            color={toolsState().tool() === "pane" ? "primary" : undefined}
          >
            <HandIcon class="size-5" />
          </Button>
        </Tooltip>
        <Tooltip data-tip={t("board.tools.task")} placement="top">
          <Button
            aria-label={t("board.tools.task")}
            onClick={onToolClickFactory("create-task")}
            shape="circle"
            size="sm"
            color={toolsState().tool() === "create-task" ? "primary" : undefined}
          >
            <SquareIcon class="size-5" />
          </Button>
        </Tooltip>
      </ToolContainer>
    </div>
  );
};
