import { decode } from "decode-formdata";
import { createUniqueId, type Component, type ComponentProps } from "solid-js";
import * as v from "valibot";
import { useI18n } from "~/integrations/i18n";
import { boardsCollection } from "~/integrations/tanstack-db/collections";
import type { BoardModel } from "~/integrations/tanstack-db/schema";
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
} from "~/ui/dialog/dialog";
import { SettingsIcon } from "~/ui/icons/settings-icon";
import { BoardFields, BoardFieldsSchema } from "./board-fields";

type UpdateBoardDialogProps = {
  board: BoardModel;
  onClose?: () => void;
  onOpen?: () => void;
};

export const UpdateBoardDialog: Component<UpdateBoardDialogProps> = (props) => {
  const { t } = useI18n();

  const formId = createUniqueId();
  const dialogId = createUniqueId();

  const onSubmit: ComponentProps<"form">["onSubmit"] = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const parsed = await v.safeParseAsync(BoardFieldsSchema, decode(formData));

    if (!parsed.success) {
      return;
    }

    boardsCollection.update(props.board.id, (draft) => {
      draft.description = parsed.output.description;
      draft.title = parsed.output.title;
    });

    closeDialog(dialogId);
  };

  return (
    <>
      <DialogTrigger
        aria-label={t("board.forms.update")}
        shape="circle"
        size="sm"
        for={dialogId}
        onClick={props.onOpen}
      >
        <SettingsIcon class="size-5" />
      </DialogTrigger>
      <Dialog onClose={props.onClose} id={dialogId}>
        <DialogBox>
          <DialogTitle>{t("board.forms.update")}</DialogTitle>
          <DialogDescription>{t("board.forms.updateDescription")}</DialogDescription>
          <form id={formId} onSubmit={onSubmit}>
            <BoardFields initialValues={props.board} />
          </form>
          <DialogActions>
            <DialogClose />
            <Button color="primary" form={formId} type="submit">
              {t("common.update")}
            </Button>
          </DialogActions>
        </DialogBox>
        <DialogBackdrop />
      </Dialog>
    </>
  );
};
