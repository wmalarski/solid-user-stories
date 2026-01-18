import { decode } from "decode-formdata";
import { createUniqueId, Show, type Component, type ComponentProps } from "solid-js";
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
import { Dialog, DialogActions, DialogBackdrop, DialogBox, DialogTitle } from "~/ui/dialog/dialog";
import { FieldError } from "~/ui/field-error/field-error";
import { Fieldset, FieldsetLabel } from "~/ui/fieldset/fieldset";
import { FormError } from "~/ui/form-error/form-error";
import { Input } from "~/ui/input/input";
import { getInvalidStateProps, type FormIssues } from "~/ui/utils/forms";
import { useAxisConfigContext } from "../contexts/axis-config";
import {
  DELETE_AXIS_DIALOG_ID,
  INSERT_AXIS_DIALOG_ID,
  UPDATE_AXIS_DIALOG_ID,
  useBoardDialogsContext,
} from "../contexts/board-dialogs";
import { useBoardId } from "../contexts/board-model";
import { useTasksDataContext } from "../contexts/tasks-data";

const AxisFieldsSchema = v.object({
  name: v.string(),
});

export const InsertAxisDialog: Component = () => {
  const { t } = useI18n();

  const axisConfig = useAxisConfigContext();
  const tasksData = useTasksDataContext();
  const boardDialogs = useBoardDialogsContext();

  const boardId = useBoardId();
  const formId = createUniqueId();

  const shiftHorizontalTasks = (index: number, shift: number, newAxisId: string) => {
    const axisConfigValue = axisConfig();
    const horizontalConfigs = axisConfigValue.config.x;
    const config = horizontalConfigs[index];
    const tasksToMove = tasksData()
      .entries.filter((entry) => entry.positionX > config.end)
      .map((entry) => entry.id);

    taskCollection.update(tasksToMove, (drafts) => {
      for (const draft of drafts) {
        draft.positionX += shift;
      }
    });

    const axisIds = horizontalConfigs.map((config) => config.axis.id);
    axisIds.splice(index, 0, newAxisId);
    boardsCollection.update(boardId(), (draft) => {
      draft.axisXOrder = axisIds;
    });
  };

  const shiftVerticalTasks = (index: number, shift: number, newAxisId: string) => {
    const axisConfigValue = axisConfig();
    const verticalConfigs = axisConfigValue.config.y;
    const config = verticalConfigs[index];
    const tasksToMove = tasksData()
      .entries.filter((entry) => entry.positionY > config.end)
      .map((entry) => entry.id);

    taskCollection.update(tasksToMove, (drafts) => {
      for (const draft of drafts) {
        draft.positionY += shift;
      }
    });

    const axisIds = verticalConfigs.map((config) => config.axis.id);
    axisIds.splice(index, 0, newAxisId);
    boardsCollection.update(boardId(), (draft) => {
      draft.axisYOrder = axisIds;
    });
  };

  const onSubmit: ComponentProps<"form">["onSubmit"] = async (event) => {
    event.preventDefault();

    const boardDialogsValue = boardDialogs();
    const insertDataValue = boardDialogsValue.context[INSERT_AXIS_DIALOG_ID];

    if (!insertDataValue) {
      return;
    }

    const formData = new FormData(event.currentTarget);

    const parsed = await v.safeParseAsync(AxisFieldsSchema, decode(formData));

    if (!parsed.success) {
      return;
    }

    const size = 500;
    const axisId = createId();
    axisCollection.insert({
      boardId: boardId(),
      id: axisId,
      name: parsed.output.name,
      orientation: insertDataValue.orientation,
      size,
    });

    boardDialogsValue.closeBoardDialog(INSERT_AXIS_DIALOG_ID);

    if (insertDataValue.orientation === "horizontal") {
      shiftHorizontalTasks(insertDataValue.index, size, axisId);
    } else {
      shiftVerticalTasks(insertDataValue.index, size, axisId);
    }
  };

  return (
    <Show when={boardDialogs().context[INSERT_AXIS_DIALOG_ID]}>
      <Dialog id={INSERT_AXIS_DIALOG_ID}>
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
    </Show>
  );
};

export const UpdateAxisDialog: Component = () => {
  const { t } = useI18n();

  const formId = createUniqueId();

  const boardDialogs = useBoardDialogsContext();

  const onSubmit: ComponentProps<"form">["onSubmit"] = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const parsed = await v.safeParseAsync(AxisFieldsSchema, decode(formData));

    if (!parsed.success) {
      return;
    }

    const boardDialogsValue = boardDialogs();

    const axisId = boardDialogsValue.context[UPDATE_AXIS_DIALOG_ID]?.axis.id;
    axisCollection.update(axisId, (draft) => {
      draft.name = parsed.output.name;
    });

    boardDialogsValue.closeBoardDialog(UPDATE_AXIS_DIALOG_ID);
  };

  return (
    <Show when={boardDialogs().context[UPDATE_AXIS_DIALOG_ID]}>
      <Dialog id={UPDATE_AXIS_DIALOG_ID}>
        <DialogBox>
          <DialogTitle>{t("common.update")}</DialogTitle>
          <form id={formId} onSubmit={onSubmit}>
            <AxisFields initialValues={boardDialogs().context[UPDATE_AXIS_DIALOG_ID]?.axis} />
          </form>
          <DialogActions>
            <Button color="primary" form={formId} type="submit">
              {t("common.update")}
            </Button>
          </DialogActions>
        </DialogBox>
        <DialogBackdrop />
      </Dialog>
    </Show>
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

export const DeleteAxisDialog: Component = () => {
  const { t } = useI18n();

  const boardDialogs = useBoardDialogsContext();

  const onSave = () => {
    const boardDialogsValue = boardDialogs();

    const axisIdValue = boardDialogsValue.context[DELETE_AXIS_DIALOG_ID]?.axisId;
    if (axisIdValue) {
      axisCollection.delete(axisIdValue);
    }

    boardDialogsValue.closeBoardDialog(DELETE_AXIS_DIALOG_ID);
  };

  return (
    <Show when={boardDialogs().context[DELETE_AXIS_DIALOG_ID]}>
      <AlertDialog
        description={t("board.axis.confirmDelete")}
        dialogId={DELETE_AXIS_DIALOG_ID}
        onSave={onSave}
        title={t("common.delete")}
      />
    </Show>
  );
};
