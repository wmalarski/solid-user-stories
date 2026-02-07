import { decode } from "decode-formdata";
import { createSignal, createUniqueId, type Component, type ComponentProps } from "solid-js";
import * as v from "valibot";
import { useI18n } from "~/integrations/i18n";
import type { SectionInstance } from "~/integrations/jazz/schema";
import type { SectionModel } from "~/integrations/tanstack-db/schema";
import { AlertDialog } from "~/ui/alert-dialog/alert-dialog";
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
import { FieldError } from "~/ui/field-error/field-error";
import { Fieldset, FieldsetLabel } from "~/ui/fieldset/fieldset";
import { FormError } from "~/ui/form-error/form-error";
import { PencilIcon } from "~/ui/icons/pencil-icon";
import { PlusIcon } from "~/ui/icons/plus-icon";
import { TrashIcon } from "~/ui/icons/trash-icon";
import { Input } from "~/ui/input/input";
import { getInvalidStateProps, parseFormValidationError, type FormIssues } from "~/ui/utils/forms";
import { useBoardStateContext } from "../contexts/board-state";
import { useDialogBoardToolUtils } from "../contexts/tools-state";
import { updateSectionData } from "../utils/section-actions";

const SectionFieldsSchema = v.object({
  name: v.string(),
});

type InsertSectionDialogProps = {
  orientation: SectionModel["orientation"];
  index: number;
};

export const InsertSectionDialog: Component<InsertSectionDialogProps> = (props) => {
  const { t } = useI18n();

  const boardState = useBoardStateContext();
  const { onClick, onClose } = useDialogBoardToolUtils();

  const formId = createUniqueId();
  const dialogId = createUniqueId();

  const [issues, setIssues] = createSignal<FormIssues>();

  const onSubmit: ComponentProps<"form">["onSubmit"] = async (event) => {
    event.preventDefault();
    closeDialog(dialogId);

    const formData = new FormData(event.currentTarget);

    const parsed = await v.safeParseAsync(SectionFieldsSchema, decode(formData));

    if (!parsed.success) {
      setIssues(parseFormValidationError(parsed.issues));
      return;
    }

    boardState.insertSection({
      index: props.index,
      name: parsed.output.name,
      orientation: props.orientation,
    });

    event.currentTarget.reset();
  };

  return (
    <>
      <DialogTrigger
        aria-label={t("board.sections.insertSection")}
        shape="circle"
        size="sm"
        for={dialogId}
        onClick={onClick}
      >
        <PlusIcon class="size-4" />
      </DialogTrigger>
      <Dialog id={dialogId} onClose={onClose}>
        <DialogBox>
          <DialogTitle>{t("board.sections.insertSection")}</DialogTitle>
          <DialogDescription>{t("board.sections.insertDescription")}</DialogDescription>
          <form id={formId} onSubmit={onSubmit}>
            <SectionFields issues={issues()} />
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

type UpdateSectionDialogProps = {
  section: SectionInstance;
};

export const UpdateSectionDialog: Component<UpdateSectionDialogProps> = (props) => {
  const { t } = useI18n();

  const formId = createUniqueId();
  const dialogId = createUniqueId();

  const [issues, setIssues] = createSignal<FormIssues>();

  const { onClick, onClose } = useDialogBoardToolUtils();

  const onSubmit: ComponentProps<"form">["onSubmit"] = async (event) => {
    event.preventDefault();

    closeDialog(dialogId);

    const formData = new FormData(event.currentTarget);

    const parsed = await v.safeParseAsync(SectionFieldsSchema, decode(formData));

    if (!parsed.success) {
      setIssues(parseFormValidationError(parsed.issues));
      return;
    }

    updateSectionData(props.section, {
      name: parsed.output.name,
    });
  };

  return (
    <>
      <DialogTrigger
        aria-label={t("board.sections.updateSection")}
        shape="circle"
        size="sm"
        for={dialogId}
        onClick={onClick}
      >
        <PencilIcon class="size-4" />
      </DialogTrigger>
      <Dialog id={dialogId} onClose={onClose}>
        <DialogBox>
          <DialogTitle>{t("board.sections.updateSection")}</DialogTitle>
          <DialogDescription>{t("board.sections.updateDescription")}</DialogDescription>
          <form id={formId} onSubmit={onSubmit}>
            <SectionFields initialValues={props.section} issues={issues()} />
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

type SectionFieldsProps = {
  pending?: boolean;
  issues?: FormIssues;
  initialValues?: Partial<SectionModel>;
};

const SectionFields: Component<SectionFieldsProps> = (props) => {
  const { t } = useI18n();

  return (
    <Fieldset>
      <FormError message={props.issues?.error} />

      <FieldsetLabel for="name">{t("board.sections.name")}</FieldsetLabel>
      <Input
        disabled={props.pending}
        id="name"
        name="name"
        required={true}
        width="full"
        value={props.initialValues?.name}
        {...getInvalidStateProps({
          errorMessageId: "name-error",
          isInvalid: Boolean(props.issues?.errors?.name),
        })}
      />
      <FieldError id="name-error" message={props.issues?.errors?.name} />
    </Fieldset>
  );
};

type DeleteSectionDialogProps = {
  section: SectionModel;
  endPosition: number;
};

export const DeleteSectionDialog: Component<DeleteSectionDialogProps> = (props) => {
  const { t } = useI18n();

  const boardState = useBoardStateContext();
  const { onClick, onClose } = useDialogBoardToolUtils();

  const dialogId = createUniqueId();

  const onSave = () => {
    closeDialog(dialogId);

    boardState.deleteSection({
      endPosition: props.endPosition,
      id: props.section.id,
      orientation: props.section.orientation,
      shift: -props.section.size,
    });
  };

  return (
    <>
      <DialogTrigger
        aria-label={t("board.sections.deleteSection")}
        shape="circle"
        size="sm"
        for={dialogId}
        onClick={onClick}
      >
        <TrashIcon class="size-4" />
      </DialogTrigger>
      <AlertDialog
        onClose={onClose}
        description={t("common.confirm")}
        dialogId={dialogId}
        onSave={onSave}
        title={t("common.delete")}
      />
    </>
  );
};
