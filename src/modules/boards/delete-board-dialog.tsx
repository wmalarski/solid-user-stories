import { createUniqueId, type Component } from "solid-js";
import { useI18n } from "~/integrations/i18n";
import { createJazzResourceSubscription } from "~/integrations/jazz/create-jazz-resource-subscription";
import { useJazzAccount } from "~/integrations/jazz/provider";
import { BoardsListSchema } from "~/integrations/jazz/schema";
import { AlertDialog } from "~/ui/alert-dialog/alert-dialog";
import { closeDialog, DialogTrigger } from "~/ui/dialog/dialog";
import { TrashIcon } from "~/ui/icons/trash-icon";

type DeleteBoardDialogProps = {
  boardId: string;
};

export const DeleteBoardDialog: Component<DeleteBoardDialogProps> = (props) => {
  const { t } = useI18n();

  const account = useJazzAccount();

  const boards = createJazzResourceSubscription(() => ({
    id: account().root.boards.$jazz.id,
    key: "DELETE",
    options: { resolve: true },
    schema: BoardsListSchema,
  }));

  const dialogId = createUniqueId();

  const onSave = () => {
    closeDialog(dialogId);
    boards()?.$jazz.remove((board) => board.$jazz.id === props.boardId);
  };

  return (
    <>
      <DialogTrigger
        aria-label={t("board.forms.deleteBoard")}
        shape="circle"
        size="sm"
        for={dialogId}
      >
        <TrashIcon class="size-4" />
      </DialogTrigger>
      <AlertDialog
        description={t("common.confirm")}
        dialogId={dialogId}
        onSave={onSave}
        title={t("common.delete")}
      />
    </>
  );
};
