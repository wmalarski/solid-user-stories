import { useNavigate } from "@solidjs/router";
import { decode } from "decode-formdata";
import { createUniqueId, type Component, type ComponentProps } from "solid-js";
import * as v from "valibot";
import { useI18n } from "~/integrations/i18n";
import { createLink } from "~/integrations/router/create-link";
import { boardsCollection, sectionCollection } from "~/integrations/tanstack-db/collections";
import { createId } from "~/integrations/tanstack-db/create-id";
import { Button } from "~/ui/button/button";
import {
  Dialog,
  DialogActions,
  DialogBackdrop,
  DialogBox,
  DialogClose,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "~/ui/dialog/dialog";
import { PlusIcon } from "~/ui/icons/plus-icon";
import { BoardFields, BoardFieldsSchema } from "./board-fields";

export const InsertBoardDialog: Component = () => {
  const { t } = useI18n();

  const navigate = useNavigate();

  const formId = createUniqueId();
  const dialogId = createUniqueId();

  const onSubmit: ComponentProps<"form">["onSubmit"] = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const parsed = await v.safeParseAsync(BoardFieldsSchema, decode(formData));

    if (!parsed.success) {
      return;
    }

    const boardId = createId();
    const sectionXId = createId();
    const sectionYId = createId();

    const boardTx = boardsCollection.insert({
      description: parsed.output.description,
      id: boardId,
      sectionXOrder: [sectionXId],
      sectionYOrder: [sectionYId],
      title: parsed.output.title,
      user: "1",
    });

    const sectionTx = sectionCollection.insert([
      {
        boardId,
        id: sectionXId,
        name: t("board.forms.xSectionDefault"),
        orientation: "horizontal",
        size: 500,
      },
      {
        boardId,
        id: sectionYId,
        name: t("board.forms.ySectionDefault"),
        orientation: "vertical",
        size: 500,
      },
    ]);

    await boardTx.isPersisted.promise;
    await sectionTx.isPersisted.promise;

    navigate(createLink("/board/:boardId", { params: { boardId } }));
  };

  return (
    <>
      <DialogTrigger color="primary" for={dialogId}>
        <PlusIcon class="size-4" />
        {t("board.forms.createBoard")}
      </DialogTrigger>
      <Dialog id={dialogId}>
        <DialogBox>
          <DialogTitle>{t("board.forms.createBoard")}</DialogTitle>
          <DialogDescription>{t("board.forms.insertDescription")}</DialogDescription>
          <form id={formId} onSubmit={onSubmit}>
            <BoardFields />
          </form>
          <DialogActions>
            <DialogClose />
            <Button color="primary" form={formId} type="submit">
              {t("common.save")}
            </Button>
          </DialogActions>
        </DialogBox>
        <DialogBackdrop />
      </Dialog>
    </>
  );
};
