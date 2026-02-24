import { decode } from "decode-formdata";
import { createSignal, createUniqueId, type Component, type ComponentProps } from "solid-js";
import * as v from "valibot";
import { useI18n } from "~/integrations/i18n";
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
import { Tooltip } from "~/ui/tooltip/tooltip";
import { getInvalidStateProps, parseFormValidationError, type FormIssues } from "~/ui/utils/forms";
import { useDialogBoardToolUtils } from "../contexts/tools-state";
import type { SectionModel } from "../state/board-model";
import { useBoardStateContext } from "../state/board-state";
import {
  deleteHorizontalSectionInstance,
  deleteVerticalSectionInstance,
  insertHorizontalSectionInstance,
  insertVerticalSectionInstance,
  updateHorizontalSectionInstance,
  updateVerticalSectionInstance,
} from "../state/section-actions";
import type { Orientation } from "../utils/types";

const SectionFieldsSchema = v.object({
  name: v.string(),
});

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

type InsertSectionDialogProps = {
  orientation: Orientation;
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

    if (props.orientation === "horizontal") {
      insertHorizontalSectionInstance({
        boardState,
        index: props.index,
        name: parsed.output.name,
      });
    } else {
      insertVerticalSectionInstance({
        boardState,
        index: props.index,
        name: parsed.output.name,
      });
    }

    event.currentTarget.reset();
  };

  return (
    <>
      <Tooltip data-tip={t("board.sections.insertSection")} placement="left">
        <DialogTrigger
          aria-label={t("board.sections.insertSection")}
          shape="circle"
          size="sm"
          for={dialogId}
          onClick={onClick}
        >
          <PlusIcon class="size-4" />
        </DialogTrigger>
      </Tooltip>
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
  section: SectionModel;
  orientation: Orientation;
};

export const UpdateSectionDialog: Component<UpdateSectionDialogProps> = (props) => {
  const { t } = useI18n();

  const formId = createUniqueId();
  const dialogId = createUniqueId();

  const [issues, setIssues] = createSignal<FormIssues>();

  const boardState = useBoardStateContext();
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

    const section = {
      boardState,
      name: parsed.output.name,
      sectionId: props.section.id,
    };

    if (props.orientation === "horizontal") {
      updateHorizontalSectionInstance(section);
    } else {
      updateVerticalSectionInstance(section);
    }
  };

  return (
    <>
      <Tooltip data-tip={t("board.sections.updateSection")} placement="left">
        <DialogTrigger
          aria-label={t("board.sections.updateSection")}
          shape="circle"
          size="sm"
          for={dialogId}
          onClick={onClick}
        >
          <PencilIcon class="size-4" />
        </DialogTrigger>
      </Tooltip>
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

type DeleteSectionDialogProps = {
  orientation: Orientation;
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

    const section = {
      boardState,
      endPosition: props.endPosition,
      sectionId: props.section.id,
      shift: -props.section.size,
    };

    if (props.orientation === "horizontal") {
      deleteHorizontalSectionInstance(section);
    } else {
      deleteVerticalSectionInstance(section);
    }
  };

  return (
    <>
      <Tooltip data-tip={t("board.sections.deleteSection")} placement="left">
        <DialogTrigger
          aria-label={t("board.sections.deleteSection")}
          shape="circle"
          size="sm"
          for={dialogId}
          onClick={onClick}
        >
          <TrashIcon class="size-4" />
        </DialogTrigger>
      </Tooltip>
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
