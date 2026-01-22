import { decode } from "decode-formdata";
import { createUniqueId, type Component, type ComponentProps } from "solid-js";
import * as v from "valibot";
import { useI18n } from "~/integrations/i18n";
import {
  axisCollection,
  boardsCollection,
  taskCollection,
} from "~/integrations/tanstack-db/collections";
import { createId } from "~/integrations/tanstack-db/create-id";
import type { AxisModel } from "~/integrations/tanstack-db/schema";
import { AlertDialog } from "~/ui/alert-dialog/alert-dialog";
import { Button } from "~/ui/button/button";
import {
  closeDialog,
  Dialog,
  DialogActions,
  DialogBackdrop,
  DialogBox,
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
import { useAxisConfigContext, type AxisConfigContext } from "../contexts/axis-config";
import { useBoardId } from "../contexts/board-model";
import { useTasksDataContext } from "../contexts/tasks-data";

const AxisFieldsSchema = v.object({
  name: v.string(),
});

type ShiftAxisArgs = {
  index: number;
  axisId: string;
  axisConfigValue: AxisConfigContext;
};

type ShiftTasksArgs = {
  index: number;
  shift: number;
  axisConfigValue: AxisConfigContext;
};

type InsertAxisDialogProps = {
  orientation: AxisModel["orientation"];
  index: number;
};

export const InsertAxisDialog: Component<InsertAxisDialogProps> = (props) => {
  const { t } = useI18n();

  const axisConfig = useAxisConfigContext();
  const tasksData = useTasksDataContext();

  const boardId = useBoardId();
  const formId = createUniqueId();
  const dialogId = createUniqueId();

  const shiftHorizontalAxis = ({ index, axisId, axisConfigValue }: ShiftAxisArgs) => {
    const axisIds = axisConfigValue.x.map((config) => config.axis.id);
    axisIds.splice(index + 1, 0, axisId);
    boardsCollection.update(boardId(), (draft) => {
      draft.axisXOrder = axisIds;
    });
  };

  const shiftHorizontalTasks = ({ index, shift, axisConfigValue }: ShiftTasksArgs) => {
    const currentConfigEnd = axisConfigValue.x[index].end;

    const tasksToMove = tasksData()
      .entries.filter((entry) => entry.positionX > currentConfigEnd)
      .map((entry) => entry.id);

    if (tasksToMove.length > 0) {
      taskCollection.update(tasksToMove, (drafts) => {
        for (const draft of drafts) {
          draft.positionX += shift;
        }
      });
    }
  };

  const shiftVerticalAxis = ({ index, axisId, axisConfigValue }: ShiftAxisArgs) => {
    const axisIds = axisConfigValue.y.map((config) => config.axis.id);
    axisIds.splice(index + 1, 0, axisId);
    boardsCollection.update(boardId(), (draft) => {
      draft.axisYOrder = axisIds;
    });
  };

  const shiftVerticalTasks = ({ index, shift, axisConfigValue }: ShiftTasksArgs) => {
    const currentConfigEnd = axisConfigValue.y[index].end;

    const tasksToMove = tasksData()
      .entries.filter((entry) => entry.positionY > currentConfigEnd)
      .map((entry) => entry.id);

    if (tasksToMove.length > 0) {
      taskCollection.update(tasksToMove, (drafts) => {
        for (const draft of drafts) {
          draft.positionY += shift;
        }
      });
    }
  };

  const onSubmit: ComponentProps<"form">["onSubmit"] = async (event) => {
    event.preventDefault();
    closeDialog(dialogId);

    const formData = new FormData(event.currentTarget);

    const parsed = await v.safeParseAsync(AxisFieldsSchema, decode(formData));

    if (!parsed.success) {
      return;
    }

    const axisConfigValue = axisConfig().config;

    const shift = 500;
    const axisId = createId();
    axisCollection.insert({
      boardId: boardId(),
      id: axisId,
      name: parsed.output.name,
      orientation: props.orientation,
      size: shift,
    });

    if (props.orientation === "horizontal") {
      shiftHorizontalAxis({ axisConfigValue, axisId, index: props.index });
      shiftHorizontalTasks({ axisConfigValue, index: props.index, shift });
    } else {
      shiftVerticalAxis({ axisConfigValue, axisId, index: props.index });
      shiftVerticalTasks({ axisConfigValue, index: props.index, shift });
    }
  };

  return (
    <>
      <DialogTrigger
        aria-label={t("board.axis.insertAxis")}
        shape="circle"
        size="sm"
        for={dialogId}
      >
        <PlusIcon class="size-4" />
      </DialogTrigger>
      <Dialog id={dialogId}>
        <DialogBox>
          <DialogTitle>{t("board.axis.insertAxis")}</DialogTitle>
          <form id={formId} onSubmit={onSubmit}>
            <AxisFields />
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

type UpdateAxisDialogProps = {
  axis: AxisModel;
};

export const UpdateAxisDialog: Component<UpdateAxisDialogProps> = (props) => {
  const { t } = useI18n();

  const formId = createUniqueId();
  const dialogId = createUniqueId();

  const onSubmit: ComponentProps<"form">["onSubmit"] = async (event) => {
    event.preventDefault();
    closeDialog(dialogId);

    const formData = new FormData(event.currentTarget);

    const parsed = await v.safeParseAsync(AxisFieldsSchema, decode(formData));

    if (!parsed.success) {
      return;
    }

    axisCollection.update(props.axis.id, (draft) => {
      draft.name = parsed.output.name;
    });
  };

  return (
    <>
      <DialogTrigger
        aria-label={t("board.axis.updateAxis")}
        shape="circle"
        size="sm"
        for={dialogId}
      >
        <PencilIcon class="size-4" />
      </DialogTrigger>
      <Dialog id={dialogId}>
        <DialogBox>
          <DialogTitle>{t("common.update")}</DialogTitle>
          <form id={formId} onSubmit={onSubmit}>
            <AxisFields initialValues={props.axis} />
          </form>
          <DialogActions>
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

type AxisFieldsProps = {
  pending?: boolean;
  issues?: FormIssues;
  initialValues?: Partial<AxisModel>;
};

const AxisFields: Component<AxisFieldsProps> = (props) => {
  const { t } = useI18n();

  return (
    <Fieldset>
      <FormError message={props.issues?.error} />

      <FieldsetLabel for="name">{t("board.axis.name")}</FieldsetLabel>
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

type DeleteAxisDialogProps = {
  axisId: string;
};

export const DeleteAxisDialog: Component<DeleteAxisDialogProps> = (props) => {
  const { t } = useI18n();

  const boardId = useBoardId();
  const dialogId = createUniqueId();

  const onSave = () => {
    closeDialog(dialogId);

    const axisId = props.axisId;

    boardsCollection.update(boardId(), (draft) => {
      draft.axisXOrder = draft.axisXOrder.filter((id) => id !== axisId);
      draft.axisYOrder = draft.axisYOrder.filter((id) => id !== axisId);
    });

    axisCollection.delete(axisId);
  };

  return (
    <>
      <DialogTrigger
        aria-label={t("board.axis.deleteAxis")}
        shape="circle"
        size="sm"
        for={dialogId}
      >
        <TrashIcon class="size-4" />
      </DialogTrigger>
      <AlertDialog
        description={t("board.axis.confirmDelete")}
        dialogId={dialogId}
        onSave={onSave}
        title={t("common.delete")}
      />
    </>
  );
};
