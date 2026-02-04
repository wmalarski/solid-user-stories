import { createUniqueId, type Component } from "solid-js";
import { useI18n } from "~/integrations/i18n";
import { useTanstackDbContext } from "~/integrations/tanstack-db/provider";
import type { BoardModel } from "~/integrations/tanstack-db/schema";
import { AlertDialog } from "~/ui/alert-dialog/alert-dialog";
import { closeDialog, DialogTrigger } from "~/ui/dialog/dialog";
import { TrashIcon } from "~/ui/icons/trash-icon";

type DeleteBoardDialogProps = {
  board: BoardModel;
};

export const DeleteBoardDialog: Component<DeleteBoardDialogProps> = (props) => {
  const { t } = useI18n();

  const { boardsCollection } = useTanstackDbContext();

  const dialogId = createUniqueId();

  const onSave = () => {
    closeDialog(dialogId);

    // taskCollection.
    boardsCollection.delete(props.board.id);
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
