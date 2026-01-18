import * as d3 from "d3";
import { decode } from "decode-formdata";
import {
  createEffect,
  createSignal,
  createUniqueId,
  onCleanup,
  type Component,
  type ComponentProps,
} from "solid-js";
import * as v from "valibot";
import { useI18n } from "~/integrations/i18n";
import { axisCollection } from "~/integrations/tanstack-db/collections";
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
  openDialog,
} from "~/ui/dialog/dialog";
import { FieldError } from "~/ui/field-error/field-error";
import { Fieldset, FieldsetLabel } from "~/ui/fieldset/fieldset";
import { FormError } from "~/ui/form-error/form-error";
import { Input } from "~/ui/input/input";
import { getInvalidStateProps, type FormIssues } from "~/ui/utils/forms";
import { useAxisConfigContext } from "../contexts/axis-config";
import { useBoardId } from "../contexts/board-model";
import { AXIS_DELETE_BUTTON_SELECTOR, AXIS_UPDATE_BUTTON_SELECTOR } from "../utils/constants";

const AxisFieldsSchema = v.object({
  name: v.string(),
});

type InsertData = {
  orientation: AxisModel["orientation"];
  index: number;
};

export const InsertAxisDialog: Component = () => {
  const { t } = useI18n();

  const boardId = useBoardId();
  const formId = createUniqueId();
  const dialogId = createUniqueId();

  const [insertData, _setInsertData] = createSignal<InsertData>();

  const onSubmit: ComponentProps<"form">["onSubmit"] = async (event) => {
    event.preventDefault();

    const insertDataValue = insertData();

    if (!insertDataValue) {
      return;
    }

    const formData = new FormData(event.currentTarget);

    const parsed = await v.safeParseAsync(AxisFieldsSchema, decode(formData));

    if (!parsed.success) {
      return;
    }

    const axisId = createId();
    axisCollection.insert({
      boardId: boardId(),
      id: axisId,
      name: parsed.output.name,
      orientation: insertDataValue.orientation,
      size: 400,
    });

    closeDialog(dialogId);
  };

  return (
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
  );
};

export const UpdateAxisDialog: Component = () => {
  const { t } = useI18n();

  const formId = createUniqueId();
  const dialogId = createUniqueId();

  const axisConfig = useAxisConfigContext();

  const [axis, setAxis] = createSignal<AxisModel>();

  const onSubmit: ComponentProps<"form">["onSubmit"] = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const parsed = await v.safeParseAsync(AxisFieldsSchema, decode(formData));

    if (!parsed.success) {
      return;
    }

    axisCollection.update(axis()?.id, (draft) => {
      draft.name = parsed.output.name;
    });

    closeDialog(dialogId);
  };

  createEffect(() => {
    const abortController = new AbortController();

    d3.selectAll(AXIS_UPDATE_BUTTON_SELECTOR).on(
      "click",
      (event) => {
        const target: SVGRectElement = event.target;
        const axisId = target.dataset.axisId;
        const axisConfigValue = axisConfig();

        const axis = axisConfigValue.entries.find((entry) => entry.id === axisId);
        setAxis(axis);

        openDialog(dialogId);
      },
      { signal: abortController.signal },
    );

    onCleanup(() => {
      abortController.abort();
    });
  });

  return (
    <Dialog id={dialogId}>
      <DialogBox>
        <DialogTitle>{t("common.update")}</DialogTitle>
        <form id={formId} onSubmit={onSubmit}>
          <AxisFields initialValues={axis()} />
        </form>
        <DialogActions>
          <Button color="primary" form={formId} type="submit">
            {t("common.update")}
          </Button>
        </DialogActions>
      </DialogBox>
      <DialogBackdrop />
    </Dialog>
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

  const dialogId = createUniqueId();

  const [axisId, setAxisId] = createSignal<string>();

  const onSave = () => {
    const axisIdValue = axisId();
    if (axisIdValue) {
      axisCollection.delete(axisIdValue);
    }
  };

  createEffect(() => {
    const abortController = new AbortController();

    d3.selectAll(AXIS_DELETE_BUTTON_SELECTOR).on(
      "click",
      (event) => {
        const target: SVGRectElement = event.target;
        const axisId = target.dataset.axisId;
        setAxisId(axisId);

        openDialog(dialogId);
      },
      { signal: abortController.signal },
    );

    onCleanup(() => {
      abortController.abort();
    });
  });

  return (
    <AlertDialog
      description={t("board.axis.confirmDelete")}
      dialogId={dialogId}
      onSave={onSave}
      title={t("common.delete")}
    />
  );
};
