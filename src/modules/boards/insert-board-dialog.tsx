import { useNavigate } from "@solidjs/router";
import { decode } from "decode-formdata";
import { createSignal, createUniqueId, type Component, type ComponentProps } from "solid-js";
import * as v from "valibot";
import { useI18n } from "~/integrations/i18n";
import { createJazzResource } from "~/integrations/jazz/create-jazz-resource";
import { useJazzAccount } from "~/integrations/jazz/provider";
import { BoardsListSchema } from "~/integrations/jazz/schema";
import { createLink } from "~/integrations/router/create-link";
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

    const boardsValue = boards();
    if (!boardsValue) {
      return;
    }

    const index = boardsValue.$jazz.push({
      description: parsed.output.description,
      edges: [],
      sectionX: [{ name: t("board.forms.xSectionDefault"), size: 500, tasks: [] }],
      sectionY: [{ name: t("board.forms.ySectionDefault"), size: 500, tasks: [] }],
      tasks: [],
      title: parsed.output.title,
      user: "1",
    });

    const boardId = boardsValue[index - 1].$jazz.id;

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
