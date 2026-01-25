import { decode } from "decode-formdata";
import { createUniqueId, type Component, type ComponentProps } from "solid-js";
import * as v from "valibot";
import { useI18n } from "~/integrations/i18n";
import {
  boardsCollection,
  sectionCollection,
  taskCollection,
} from "~/integrations/tanstack-db/collections";
import { createId } from "~/integrations/tanstack-db/create-id";
import type { SectionModel, TaskModel } from "~/integrations/tanstack-db/schema";
import { AlertDialog } from "~/ui/alert-dialog/alert-dialog";
import { Button } from "~/ui/button/button";
import {
  closeDialog,
  Dialog,
  DialogActions,
  DialogBackdrop,
  DialogBox,
  DialogClose,
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
import { getInvalidStateProps, type FormIssues } from "~/ui/utils/forms";
import { useBoardId, useBoardStateContext } from "../contexts/board-state";
import { useSectionConfigsContext, type SectionConfigs } from "../contexts/section-configs";
import { useDialogBoardToolUtils } from "../contexts/tools-state";

const SectionFieldsSchema = v.object({
  name: v.string(),
});

type ShiftSectionArgs = {
  index: number;
  sectionId: string;
  sectionConfigs: SectionConfigs;
};

type ShiftTasksArgs = {
  shift: number;
  position: number;
  tasks: TaskModel[];
};

type InsertSectionDialogProps = {
  orientation: SectionModel["orientation"];
  index: number;
};

const shiftHorizontalTasks = ({ shift, tasks, position }: ShiftTasksArgs) => {
  const tasksToMove = tasks.filter((entry) => entry.positionX > position).map((entry) => entry.id);

  if (tasksToMove.length > 0) {
    taskCollection.update(tasksToMove, (drafts) => {
      for (const draft of drafts) {
        draft.positionX += shift;
      }
    });
  }
};

const shiftVerticalTasks = ({ shift, tasks, position }: ShiftTasksArgs) => {
  const tasksToMove = tasks.filter((entry) => entry.positionY > position).map((entry) => entry.id);

  if (tasksToMove.length > 0) {
    taskCollection.update(tasksToMove, (drafts) => {
      for (const draft of drafts) {
        draft.positionY += shift;
      }
    });
  }
};

export const InsertSectionDialog: Component<InsertSectionDialogProps> = (props) => {
  const { t } = useI18n();

  const boardId = useBoardId();
  const boardState = useBoardStateContext();
  const sectionConfigs = useSectionConfigsContext();
  const { onClick, onClose } = useDialogBoardToolUtils();

  const formId = createUniqueId();
  const dialogId = createUniqueId();

  const shiftHorizontalSections = ({ index, sectionId, sectionConfigs }: ShiftSectionArgs) => {
    const sectionIds = sectionConfigs.x.map((config) => config.section.id);
    sectionIds.splice(index + 1, 0, sectionId);
    boardsCollection.update(boardId(), (draft) => {
      draft.sectionXOrder = sectionIds;
    });
  };

  const shiftVerticalSections = ({ index, sectionId, sectionConfigs }: ShiftSectionArgs) => {
    const sectionIds = sectionConfigs.y.map((config) => config.section.id);
    sectionIds.splice(index + 1, 0, sectionId);
    boardsCollection.update(boardId(), (draft) => {
      draft.sectionYOrder = sectionIds;
    });
  };

  const onSubmit: ComponentProps<"form">["onSubmit"] = async (event) => {
    event.preventDefault();
    closeDialog(dialogId);

    const formData = new FormData(event.currentTarget);

    const parsed = await v.safeParseAsync(SectionFieldsSchema, decode(formData));

    if (!parsed.success) {
      return;
    }

    const sectionConfigsValue = sectionConfigs();
    const tasks = boardState.tasks();

    const shift = 500;
    const sectionId = createId();
    sectionCollection.insert({
      boardId: boardId(),
      id: sectionId,
      name: parsed.output.name,
      orientation: props.orientation,
      size: shift,
    });

    if (props.orientation === "horizontal") {
      shiftHorizontalSections({
        index: props.index,
        sectionConfigs: sectionConfigsValue,
        sectionId,
      });
      shiftHorizontalTasks({ position: sectionConfigsValue.x[props.index].end, shift, tasks });
    } else {
      shiftVerticalSections({ index: props.index, sectionConfigs: sectionConfigsValue, sectionId });
      shiftVerticalTasks({ position: sectionConfigsValue.y[props.index].end, shift, tasks });
    }

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
          <form id={formId} onSubmit={onSubmit}>
            <SectionFields />
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
};

export const UpdateSectionDialog: Component<UpdateSectionDialogProps> = (props) => {
  const { t } = useI18n();

  const formId = createUniqueId();
  const dialogId = createUniqueId();
  const { onClick, onClose } = useDialogBoardToolUtils();

  const onSubmit: ComponentProps<"form">["onSubmit"] = async (event) => {
    event.preventDefault();

    closeDialog(dialogId);

    const formData = new FormData(event.currentTarget);

    const parsed = await v.safeParseAsync(SectionFieldsSchema, decode(formData));

    if (!parsed.success) {
      return;
    }

    sectionCollection.update(props.section.id, (draft) => {
      draft.name = parsed.output.name;
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
          <DialogTitle>{t("common.update")}</DialogTitle>
          <form id={formId} onSubmit={onSubmit}>
            <SectionFields initialValues={props.section} />
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

  const boardId = useBoardId();
  const boardState = useBoardStateContext();
  const { onClick, onClose } = useDialogBoardToolUtils();

  const dialogId = createUniqueId();

  const onSave = () => {
    closeDialog(dialogId);

    const sectionId = props.section.id;
    const shift = -props.section.size;
    const orientation = props.section.orientation;
    const endPosition = props.endPosition;
    const tasks = boardState.tasks();

    boardsCollection.update(boardId(), (draft) => {
      draft.sectionXOrder = draft.sectionXOrder.filter((id) => id !== sectionId);
      draft.sectionYOrder = draft.sectionYOrder.filter((id) => id !== sectionId);
    });

    if (orientation === "horizontal") {
      shiftHorizontalTasks({ position: endPosition, shift, tasks });
    } else {
      shiftVerticalTasks({ position: endPosition, shift, tasks });
    }

    sectionCollection.delete(sectionId);
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
        description={t("board.sections.confirmDelete")}
        dialogId={dialogId}
        onSave={onSave}
        title={t("common.delete")}
      />
    </>
  );
};
