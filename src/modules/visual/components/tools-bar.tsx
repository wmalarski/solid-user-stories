import { createUniqueId, type Component, type ParentProps } from "solid-js";
import { cx } from "tailwind-variants";
import { useI18n } from "~/integrations/i18n";
import { ThemeToggle } from "~/integrations/theme/theme-toggle";
import { UpdateBoardDialog } from "~/modules/boards/update-board-dialog";
import { AlertDialog } from "~/ui/alert-dialog/alert-dialog";
import { Button } from "~/ui/button/button";
import { closeDialog, DialogTrigger } from "~/ui/dialog/dialog";
import { DownloadIcon } from "~/ui/icons/download-icon";
import { HandIcon } from "~/ui/icons/hand-icon";
import { MinusIcon } from "~/ui/icons/minus-icon";
import { PlusIcon } from "~/ui/icons/plus-icon";
import { SquareIcon } from "~/ui/icons/square-icon";
import { TrashIcon } from "~/ui/icons/trash-icon";
import { Tooltip } from "~/ui/tooltip/tooltip";
import { useBoardStateContext } from "../contexts/board-state";
import { useBoardTransformContext } from "../contexts/board-transform";
import { useExportStateContext } from "../contexts/export-state";
import { useSelectionStateContext } from "../contexts/selection-state";
import {
  useDialogBoardToolUtils,
  useToolsStateContext,
  type ToolType,
} from "../contexts/tools-state";
import { SVG_EXPORT_SELECTOR } from "../utils/constants";
import { deleteEdgeInstance } from "../utils/edge-actions";
import { deleteTaskInstance } from "../utils/task-actions";

export const ToolsBar: Component = () => {
  const { t } = useI18n();

  const boardState = useBoardStateContext();

  const { onClick, onClose } = useDialogBoardToolUtils();
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
        <ExportToPngButton />
        <Tooltip data-tip={t("board.forms.update")} placement="top">
          <UpdateBoardDialog onClose={onClose} onOpen={onClick} board={boardState.board()} />
        </Tooltip>
        <ThemeToggle />
      </ToolContainer>
    </div>
  );
};

const DeleteSelectedElementDialog: Component = () => {
  const { t } = useI18n();

  const dialogId = createUniqueId();

  const boardState = useBoardStateContext();
  const [selectionState, { onSelectionChange }] = useSelectionStateContext();

  const onConfirmClick = () => {
    closeDialog(dialogId);

    const selection = selectionState();

    if (!selection) {
      return;
    }

    if (selection.kind === "task") {
      deleteTaskInstance({ boardState, taskId: selection.id });
    } else {
      deleteEdgeInstance({ boardState, edgeId: selection.id });
    }

    onSelectionChange(null);
  };

  return (
    <>
      <Tooltip data-tip={t("common.delete")} placement="top">
        <DialogTrigger
          aria-label={t("common.delete")}
          for={dialogId}
          shape="circle"
          size="sm"
          disabled={!selectionState()}
        >
          <TrashIcon class="size-5" />
        </DialogTrigger>
      </Tooltip>
      <AlertDialog
        description={t("common.confirm")}
        dialogId={dialogId}
        onSave={onConfirmClick}
        title={t("common.delete")}
      />
    </>
  );
};

const ExportToPngButton: Component = () => {
  const { t } = useI18n();

  const boardState = useBoardStateContext();

  const [_exportState, { onIsExportingChage }] = useExportStateContext();

  const onClick = async () => {
    onIsExportingChage(true);

    const svgElement = document.querySelector(SVG_EXPORT_SELECTOR);

    if (!svgElement) {
      return;
    }

    const { snapdom } = await import("@zumer/snapdom");
    const result = await snapdom(svgElement, {
      height: Number(svgElement.getAttribute("height")),
      width: Number(svgElement.getAttribute("width")),
    });
    const filename = `${boardState.board().title}.png`;
    await result.download({
      filename,
    });

    onIsExportingChage(false);
  };

  return (
    <Tooltip data-tip={t("board.tools.export")} placement="top">
      <Button aria-label={t("board.tools.export")} shape="circle" size="sm" onClick={onClick}>
        <DownloadIcon class="size-5" />
      </Button>
    </Tooltip>
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
    <div class={cx("flex gap-1 rounded-3xl bg-base-200 p-1 shadow-lg", props.class)}>
      {props.children}
    </div>
  );
};
