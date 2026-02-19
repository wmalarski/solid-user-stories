import { Key } from "@solid-primitives/keyed";
import { createInviteLink } from "jazz-tools";
import {
  createMemo,
  createSignal,
  createUniqueId,
  Show,
  type Component,
  type ParentProps,
} from "solid-js";
import { cx } from "tailwind-variants";
import { useI18n } from "~/integrations/i18n";
import { useJazzAccount } from "~/integrations/jazz/provider";
import { createLink } from "~/integrations/router/create-link";
import { ThemeToggle } from "~/integrations/theme/theme-toggle";
import { UpdateBoardDialog } from "~/modules/boards/update-board-dialog";
import { AlertDialog } from "~/ui/alert-dialog/alert-dialog";
import { Avatar, AvatarContent, AvatarGroup } from "~/ui/avatar/avatar";
import { Button } from "~/ui/button/button";
import {
  closeDialog,
  Dialog,
  DialogActions,
  DialogBackdrop,
  DialogBox,
  DialogClose,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  openDialog,
} from "~/ui/dialog/dialog";
import { FieldsetLabel } from "~/ui/fieldset/fieldset";
import { CheckCircleIcon } from "~/ui/icons/check-circle-icon";
import { DownloadIcon } from "~/ui/icons/download-icon";
import { HandIcon } from "~/ui/icons/hand-icon";
import { LinkIcon } from "~/ui/icons/link-icon";
import { MinusIcon } from "~/ui/icons/minus-icon";
import { PlusIcon } from "~/ui/icons/plus-icon";
import { SquareIcon } from "~/ui/icons/square-icon";
import { TrashIcon } from "~/ui/icons/trash-icon";
import { Input } from "~/ui/input/input";
import { Tooltip } from "~/ui/tooltip/tooltip";
import { useBoardTransformContext } from "../contexts/board-transform";
import { useExportStateContext } from "../contexts/export-state";
import { useSelectionStateContext } from "../contexts/selection-state";
import {
  useDialogBoardToolUtils,
  useToolsStateContext,
  type ToolType,
} from "../contexts/tools-state";
import type { CursorModel } from "../state/board-model";
import { useBoardStateContext } from "../state/board-state";
import { deleteEdgeInstance } from "../state/edge-actions";
import { deleteTaskInstance } from "../state/task-actions";
import { SVG_EXPORT_SELECTOR } from "../utils/constants";

export const ToolsBar: Component = () => {
  const { t } = useI18n();

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
    <Tooltip data-tip={t("board.tools.export")} placement="bottom">
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
    <ToolContainer class="absolute bottom-2 left-6">
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

const InviteButton = () => {
  const { t } = useI18n();

  const account = useJazzAccount();
  const boardState = useBoardStateContext();

  const dialogId = createUniqueId();
  const [inviteLink, setInviteLink] = createSignal<string>();

  const [showSuccess, setShowSuccess] = createSignal(false);

  const onCopy = () => {
    const inviteLinkValue = inviteLink();
    if (inviteLinkValue) {
      navigator.clipboard.writeText(inviteLinkValue);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1000);
    }
  };

  const onClick = () => {
    const boardValue = boardState.board();
    const url = createLink("/invite", {});
    const link = createInviteLink(boardValue, "writer", url);
    setInviteLink(link);
    openDialog(dialogId);
  };

  return (
    <>
      <Show when={account().canAdmin(boardState.board())}>
        <Tooltip data-tip={t("board.invite.invite")} placement="bottom">
          <Button aria-label={t("board.invite.invite")} onClick={onClick} shape="circle" size="sm">
            <LinkIcon class="size-5" />
          </Button>
        </Tooltip>
      </Show>
      <Dialog id={dialogId}>
        <DialogBox>
          <DialogTitle>{t("board.invite.invite")}</DialogTitle>
          <DialogDescription>{t("board.invite.share")}</DialogDescription>
          <FieldsetLabel for="link">{t("board.tasks.link")}</FieldsetLabel>
          <div class="w-full flex gap-2">
            <Input
              readOnly
              class="grow"
              name="link"
              value={`${globalThis.window.location.href}${inviteLink()}`}
            />
            <Button class="w-20" color="primary" onClick={onCopy}>
              <Show when={showSuccess()} fallback={t("board.invite.copy")}>
                <CheckCircleIcon />
              </Show>
            </Button>
          </div>
          <DialogActions>
            <DialogClose />
          </DialogActions>
        </DialogBox>
        <DialogBackdrop />
      </Dialog>
    </>
  );
};

export const PresenceBar: Component = () => {
  const { t } = useI18n();

  const boardState = useBoardStateContext();

  const { onClick, onClose } = useDialogBoardToolUtils();

  return (
    <ToolContainer class="absolute top-2 right-6 items-center">
      <AvatarGroup>
        <Key each={boardState.cursors} by="sessionId">
          {(cursor) => <CursorAvatar cursor={cursor()} />}
        </Key>
      </AvatarGroup>
      <InviteButton />
      <ExportToPngButton />
      <Tooltip data-tip={t("board.forms.update")} placement="bottom">
        <UpdateBoardDialog onClose={onClose} onOpen={onClick} board={boardState.board()} />
      </Tooltip>
      <ThemeToggle />
    </ToolContainer>
  );
};

type CursorAvatarProps = {
  cursor: CursorModel;
};

const CursorAvatar: Component<CursorAvatarProps> = (props) => {
  const { t } = useI18n();

  const name = createMemo(() => {
    return props.cursor.name ?? t("board.cursors.anonymous");
  });

  return (
    <Tooltip data-tip={name()}>
      <Avatar placeholder>
        <AvatarContent>{name().at(0)}</AvatarContent>
      </Avatar>
    </Tooltip>
  );
};

export const InfoBar: Component = () => {
  const { t } = useI18n();

  const boardState = useBoardStateContext();

  const { onClick, onClose } = useDialogBoardToolUtils();

  return (
    <ToolContainer class="absolute top-2 right-6 items-center">
      <AvatarGroup>
        <Key each={boardState.cursors} by="sessionId">
          {(cursor) => <CursorAvatar cursor={cursor()} />}
        </Key>
      </AvatarGroup>
      <InviteButton />
      <ExportToPngButton />
      <Tooltip data-tip={t("board.forms.update")} placement="bottom">
        <UpdateBoardDialog onClose={onClose} onOpen={onClick} board={boardState.board()} />
      </Tooltip>
      <ThemeToggle />
    </ToolContainer>
  );
};
