import { decode } from "decode-formdata";
import { createUniqueId, type Component, type ComponentProps } from "solid-js";
import * as v from "valibot";
import { useI18n } from "~/integrations/i18n";
import { axisCollection } from "~/integrations/tanstack-db/collections";
import { createId } from "~/integrations/tanstack-db/create-id";
import type { AxisModel } from "~/integrations/tanstack-db/schema";
import { Button } from "~/ui/button/button";
import {
  Dialog,
  DialogActions,
  DialogBackdrop,
  DialogBox,
  DialogTitle,
  openDialog,
} from "~/ui/dialog/dialog";
import { Dropdown, DropdownContent } from "~/ui/dropdown/dropdown";
import { FieldError } from "~/ui/field-error/field-error";
import { Fieldset, FieldsetLabel, FieldsetLegend } from "~/ui/fieldset/fieldset";
import { FormError } from "~/ui/form-error/form-error";
import { Input } from "~/ui/input/input";
import { getInvalidStateProps, type FormIssues } from "~/ui/utils/forms";
import { useBoardId } from "../contexts/board-context";

type AxisDropdownProps = {
  axis: AxisModel;
};

export const AxisDropdown: Component<AxisDropdownProps> = (props) => {
  const { t } = useI18n();

  const insertDialogId = createUniqueId();
  const updateDialogId = createUniqueId();

  const onDialogTriggerFactory = (dialogId: string) => () => {
    openDialog(dialogId);
  };

  return (
    <>
      <Dropdown>
        <Button>Click</Button>
        <DropdownContent>
          <li>
            <button type="button" onClick={onDialogTriggerFactory(insertDialogId)}>
              {t("board.axis.insertAxis")}
            </button>
          </li>
          <li>
            <button type="button" onClick={onDialogTriggerFactory(updateDialogId)}>
              {t("common.update")}
            </button>
          </li>
        </DropdownContent>
      </Dropdown>
      <InsertAxisDialog dialogId={insertDialogId} orientation={props.axis.orientation} />
      <UpdateAxisDialog dialogId={updateDialogId} axis={props.axis} />
    </>
  );
};

const AxisFieldsSchema = v.object({
  name: v.string(),
});

type InsertAxisDialogProps = {
  dialogId: string;
  orientation: AxisModel["orientation"];
};

export const InsertAxisDialog: Component<InsertAxisDialogProps> = (props) => {
  const { t } = useI18n();

  const boardId = useBoardId();
  const formId = createUniqueId();
  const dialogId = createUniqueId();

  const onSubmit: ComponentProps<"form">["onSubmit"] = async (event) => {
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
      orientation: props.orientation,
      size: 400,
    });
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

type UpdateAxisDialogProps = {
  dialogId: string;
  axis: AxisModel;
};

const UpdateAxisDialog: Component<UpdateAxisDialogProps> = (props) => {
  const { t } = useI18n();

  const formId = createUniqueId();
  const dialogId = createUniqueId();

  const onSubmit: ComponentProps<"form">["onSubmit"] = async (event) => {
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
      <FieldsetLegend>{t("board.axis.insertAxis")}</FieldsetLegend>

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
