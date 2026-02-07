import { useNavigate } from "@solidjs/router";
import { decode } from "decode-formdata";
import { createSignal, createUniqueId, type Component, type ComponentProps } from "solid-js";
import * as v from "valibot";
import { useI18n } from "~/integrations/i18n";
import { createJazzResource } from "~/integrations/jazz/create-jazz-resource";
import { useJazzAccount } from "~/integrations/jazz/provider";
import { BoardsListSchema } from "~/integrations/jazz/schema";
import { createLink } from "~/integrations/router/create-link";
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
import { parseFormValidationError, type FormIssues } from "~/ui/utils/forms";
import { BoardFields, BoardFieldsSchema } from "./board-fields";

export const InsertBoardDialog: Component = () => {
  const { t } = useI18n();

  const account = useJazzAccount();

  const boards = createJazzResource(() => ({
    id: account().root.boards.$jazz.id,
    options: { resolve: true },
    schema: BoardsListSchema,
  }));

  const navigate = useNavigate();

  const formId = createUniqueId();
  const dialogId = createUniqueId();

  const [issues, setIssues] = createSignal<FormIssues>();

  const onSubmit: ComponentProps<"form">["onSubmit"] = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const parsed = await v.safeParseAsync(BoardFieldsSchema, decode(formData));

    if (!parsed.success) {
      setIssues(parseFormValidationError(parsed.issues));
      return;
    }

    const sectionXId = createId();
    const sectionYId = createId();

    const index = boards()?.$jazz.push({
      description: parsed.output.description,
      edges: [],
      sectionXOrder: [sectionXId],
      sectionYOrder: [sectionYId],
      sections: [
        {
          id: sectionXId,
          name: t("board.forms.xSectionDefault"),
          orientation: "horizontal",
          size: 500,
        },
        {
          id: sectionYId,
          name: t("board.forms.ySectionDefault"),
          orientation: "vertical",
          size: 500,
        },
      ],
      tasks: [],
      title: parsed.output.title,
      user: "1",
    });

    if (!index) {
      return;
    }

    const boardId = boards()?.at(index - 1)?.$jazz.id;
    if (boardId) {
      navigate(createLink("/board/:boardId", { params: { boardId } }));
    }
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
            <BoardFields issues={issues()} />
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
