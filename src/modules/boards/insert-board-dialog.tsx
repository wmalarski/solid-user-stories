import { useNavigate } from "@solidjs/router";
import { decode } from "decode-formdata";
import { createUniqueId, type Component, type ComponentProps } from "solid-js";
import * as v from "valibot";
import { useI18n } from "~/integrations/i18n";
import { createLink } from "~/integrations/router/create-link";
import { axisCollection, boardsCollection } from "~/integrations/tanstack-db/collections";
import { createId } from "~/integrations/tanstack-db/create-id";
import { Button } from "~/ui/button/button";
import {
  Dialog,
  DialogActions,
  DialogBackdrop,
  DialogBox,
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
    const axisXId = createId();
    const axisYId = createId();

    const boardTx = boardsCollection.insert({
      axisXOrder: [axisXId],
      axisYOrder: [axisYId],
      description: parsed.output.description,
      id: boardId,
      title: parsed.output.title,
      user: "1",
    });

    const axisTx = axisCollection.insert([
      {
        boardId,
        id: axisXId,
        name: t("board.forms.xAxisDefault"),
        orientation: "horizontal",
        size: 500,
      },
      {
        boardId,
        id: axisYId,
        name: t("board.forms.yAxisDefault"),
        orientation: "vertical",
        size: 500,
      },
    ]);

    await boardTx.isPersisted.promise;
    await axisTx.isPersisted.promise;

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
          <form id={formId} onSubmit={onSubmit}>
            <BoardFields />
          </form>
          <DialogActions>
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
