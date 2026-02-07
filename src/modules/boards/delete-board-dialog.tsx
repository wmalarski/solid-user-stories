import { createResource, createUniqueId, type Component } from "solid-js";
import { useI18n } from "~/integrations/i18n";
import { BoardsList } from "~/integrations/jazz/schema";
import type { BoardModel } from "~/integrations/tanstack-db/schema";
import { AlertDialog } from "~/ui/alert-dialog/alert-dialog";
import { closeDialog, DialogTrigger } from "~/ui/dialog/dialog";
import { TrashIcon } from "~/ui/icons/trash-icon";

type DeleteBoardDialogProps = {
  board: BoardModel;
  boardId: string;
  boardsId: string;
};

export const DeleteBoardDialog: Component<DeleteBoardDialogProps> = (props) => {
  const { t } = useI18n();

  const [root] = createResource(
    () => ({ id: props.boardsId }),
    async (args) => {
      const root = await BoardsList.load(args.id);
      return root.$isLoaded ? root : null;
    },
  );

  // const { boardsCollection } = useTanstackDbContext();

  const dialogId = createUniqueId();

  const onSave = () => {
    closeDialog(dialogId);

    root()?.$jazz.remove((board) => board.$jazz.id === props.boardId);

    // taskCollection.
    // boardsCollection.delete(props.board.id);
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
