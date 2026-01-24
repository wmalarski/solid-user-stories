import { createUniqueId, type Component, type ParentProps } from "solid-js";
import { cx } from "tailwind-variants";
import { useI18n } from "~/integrations/i18n";
import { edgeCollection } from "~/integrations/tanstack-db/collections";
import { deleteTaskWithDependencies } from "~/integrations/tanstack-db/utils";
import { UpdateBoardDialog } from "~/modules/boards/update-board-dialog";
import { AlertDialog } from "~/ui/alert-dialog/alert-dialog";
import { Button } from "~/ui/button/button";
import { closeDialog, DialogTrigger } from "~/ui/dialog/dialog";
import { HandIcon } from "~/ui/icons/hand-icon";
import { MinusIcon } from "~/ui/icons/minus-icon";
import { PlusIcon } from "~/ui/icons/plus-icon";
import { SquareIcon } from "~/ui/icons/square-icon";
import { TrashIcon } from "~/ui/icons/trash-icon";
import { Tooltip } from "~/ui/tooltip/tooltip";
import { useBoardModelContext } from "../contexts/board-model";
import { useBoardTransformContext } from "../contexts/board-transform";
import { getEdgesByTask, useEdgesDataContext } from "../contexts/edges-data";
import { useSelectionStateContext } from "../contexts/selection-state";
import { useToolsStateContext, type ToolType } from "../contexts/tools-state";

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
          <UpdateBoardDialog board={boardModel()} />
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

const center = () => {
  return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
};

export const ZoomBar: Component = () => {
  const { t } = useI18n();

  const [transform, { reset, zoomIn, zoomOut }] = useBoardTransformContext();

  const onZoomInClick = () => {
    zoomIn(center());
  };

  const onZoomOutClick = () => {
    zoomOut(center());
  };

  const onZoomResetClick = () => {
    reset();
  };

  return (
    <ToolContainer class="absolute bottom-2 right-6">
      <Tooltip data-tip={t("board.zoom.zoomIn")}>
        <Button
          aria-label={t("board.zoom.zoomIn")}
          onClick={onZoomInClick}
          shape="circle"
          size="sm"
          variant="ghost"
        >
          <PlusIcon />
        </Button>
      </Tooltip>
      <Tooltip data-tip={t("board.zoom.reset")}>
        <Button
          aria-label={t("board.zoom.reset")}
          class="tabular-nums"
          onClick={onZoomResetClick}
          shape="circle"
          size="sm"
          variant="ghost"
        >
          {Math.round(transform().k * 100)}%
        </Button>
      </Tooltip>
      <Tooltip data-tip={t("board.zoom.zoomOut")}>
        <Button
          aria-label={t("board.zoom.zoomOut")}
          onClick={onZoomOutClick}
          shape="circle"
          size="sm"
          variant="ghost"
        >
          <MinusIcon />
        </Button>
      </Tooltip>
    </ToolContainer>
  );
};

type ToolContainerProps = ParentProps<{
  class?: string;
}>;

const ToolContainer: Component<ToolContainerProps> = (props) => {
  return (
    <div class={cx("flex gap-1 rounded-3xl bg-base-300 p-1 shadow-lg", props.class)}>
      {props.children}
    </div>
  );
};
