import { createUniqueId, type Component } from "solid-js";
import { useI18n } from "~/integrations/i18n";
import { edgeCollection } from "~/integrations/tanstack-db/collections";
import { deleteTaskWithDependencies } from "~/integrations/tanstack-db/utils";
import { UpdateBoardDialog } from "~/modules/boards/update-board-dialog";
import { AlertDialog } from "~/ui/alert-dialog/alert-dialog";
import { Button } from "~/ui/button/button";
import { closeDialog, DialogTrigger } from "~/ui/dialog/dialog";
import { HandIcon } from "~/ui/icons/hand-icon";
import { SquareIcon } from "~/ui/icons/square-icon";
import { TrashIcon } from "~/ui/icons/trash-icon";
import { Tooltip } from "~/ui/tooltip/tooltip";
import { useBoardModelContext } from "../contexts/board-model";
import { getEdgesByTask, useEdgesDataContext } from "../contexts/edges-data";
import { useSelectionStateContext } from "../contexts/selection-state";
import { useToolsStateContext, type ToolType } from "../contexts/tools-state";
import { ToolContainer } from "./tool-container";

export const ToolsBar: Component = () => {
  const { t } = useI18n();

  const boardModel = useBoardModelContext();

  const [toolsState, { onToolChage }] = useToolsStateContext();
  const [_selectionState, { onSelectionChange }] = useSelectionStateContext();

  const onToolClickFactory = (tool: ToolType) => () => {
    onToolChage(tool);
    onSelectionChange(null);
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
            color={toolsState() === "pane" ? "primary" : undefined}
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
            color={toolsState() === "create-task" ? "primary" : undefined}
          >
            <SquareIcon class="size-5" />
          </Button>
        </Tooltip>
        <DeleteSelectedElementDialog />
        <Tooltip data-tip={t("board.forms.update")} placement="top">
          <UpdateBoardDialog board={boardModel().board} />
        </Tooltip>
      </ToolContainer>
    </div>
  );
};

const DeleteSelectedElementDialog: Component = () => {
  const { t } = useI18n();

  const dialogId = createUniqueId();

  const edgesData = useEdgesDataContext();

  const [selectionState] = useSelectionStateContext();

  const onConfirmClick = () => {
    closeDialog(dialogId);

    const selection = selectionState();

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
        <DialogTrigger
          aria-label={t("board.tools.delete")}
          for={dialogId}
          shape="circle"
          size="sm"
          disabled={!selectionState()}
        >
          <TrashIcon class="size-5" />
        </DialogTrigger>
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
