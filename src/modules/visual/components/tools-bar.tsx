import { createUniqueId, type Component } from "solid-js";
import { useI18n } from "~/integrations/i18n";
import { edgeCollection } from "~/integrations/tanstack-db/collections";
import { deleteTaskWithDependencies } from "~/integrations/tanstack-db/utils";
import { AlertDialog } from "~/ui/alert-dialog/alert-dialog";
import { Button } from "~/ui/button/button";
import { closeDialog, openDialog } from "~/ui/dialog/dialog";
import { HandIcon } from "~/ui/icons/hand-icon";
import { SquareIcon } from "~/ui/icons/square-icon";
import { TrashIcon } from "~/ui/icons/trash-icon";
import { Tooltip } from "~/ui/tooltip/tooltip";
import { getEdgesByTask, useEdgesDataContext } from "../contexts/edges-data";
import { useSelectionStateContext } from "../contexts/selection-state";
import { useToolsStateContext, type ToolType } from "../contexts/tools-state";
import { ToolContainer } from "./tool-container";

export const ToolsBar: Component = () => {
  const { t } = useI18n();

  const toolsState = useToolsStateContext();
  const selectionState = useSelectionStateContext();

  const onToolClickFactory = (tool: ToolType) => () => {
    toolsState().setTool(tool);
    selectionState().setSelection(null);
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
        <DeleteSelectedElementDialog />
      </ToolContainer>
    </div>
  );
};

const DeleteSelectedElementDialog: Component = () => {
  const { t } = useI18n();

  const dialogId = createUniqueId();

  const edgesData = useEdgesDataContext();
  const selectionState = useSelectionStateContext();

  const onDeleteClick = () => {
    openDialog(dialogId);
  };

  const onConfirmClick = () => {
    closeDialog(dialogId);

    const selection = selectionState().selection();

    if (!selection) {
      return;
    }

    if (selection.kind === "task") {
      const edges = getEdgesByTask(edgesData(), selection.id);
      deleteTaskWithDependencies(selection.id, edges);
    } else {
      edgeCollection.delete(selection.id);
    }
  };

  return (
    <>
      <Tooltip data-tip={t("board.tools.delete")} placement="top">
        <Button
          aria-label={t("board.tools.delete")}
          onClick={onDeleteClick}
          shape="circle"
          size="sm"
          disabled={!selectionState().selection()}
        >
          <TrashIcon class="size-5" />
        </Button>
      </Tooltip>
      <AlertDialog
        description={t("board.axis.confirmDelete")}
        dialogId={dialogId}
        onSave={onConfirmClick}
        title={t("common.delete")}
      />
    </>
  );
};
