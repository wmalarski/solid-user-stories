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
import { taskCollection } from "~/integrations/tanstack-db/collections";
import { createId } from "~/integrations/tanstack-db/create-id";
import type { TaskModel } from "~/integrations/tanstack-db/schema";
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
import { PencilIcon } from "~/ui/icons/pencil-icon";
import { Input } from "~/ui/input/input";
import { getInvalidStateProps, type FormIssues } from "~/ui/utils/forms";
import { mapToAxis, useAxisConfigContext } from "../contexts/axis-config";
import { useBoardId } from "../contexts/board-model";
import { useToolsStateContext } from "../contexts/tools-state";
import { SVG_SELECTOR } from "../utils/constants";
import type { Point2D } from "../utils/types";

const TaskFieldsSchema = v.object({
  description: v.string(),
  estimate: v.pipe(v.string(), v.toNumber(), v.integer(), v.minValue(0)),
  link: v.optional(v.string()),
  title: v.string(),
});

export const InsertTaskDialog: Component = () => {
  const { t } = useI18n();

  const boardId = useBoardId();
  const axisConfig = useAxisConfigContext();
  const toolsState = useToolsStateContext();

  const dialogId = createUniqueId();
  const formId = createUniqueId();

  const [formRef, setFormRef] = createSignal<HTMLFormElement>();
  const [position, setPosition] = createSignal<Point2D | null>(null);

  const onSubmit: ComponentProps<"form">["onSubmit"] = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const parsed = await v.safeParseAsync(TaskFieldsSchema, decode(formData));
    const positionValue = position();

    if (!parsed.success || !positionValue) {
      return;
    }

    const taskId = createId();
    const axis = mapToAxis(axisConfig().config, positionValue);

    taskCollection.insert({
      axisX: axis.axisX,
      axisY: axis.axisY,
      boardId: boardId(),
      description: parsed.output.description,
      estimate: parsed.output.estimate,
      id: taskId,
      link: parsed.output.link,
      positionX: positionValue.x,
      positionY: positionValue.y,
      title: parsed.output.title,
    });

    closeDialog(dialogId);
    formRef()?.reset();

    toolsState().setTool("pane");
  };

  createEffect(() => {
    const isCreateTask = toolsState().tool() === "create-task";

    if (!isCreateTask) {
      return;
    }

    const abortController = new AbortController();
    d3.select(SVG_SELECTOR).on(
      "click",
      (event) => {
        setPosition({ x: event.x, y: event.y });
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
        <DialogTitle>{t("board.tasks.insertTask")}</DialogTitle>
        <form ref={setFormRef} id={formId} onSubmit={onSubmit}>
          <TaskFields />
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

type UpdateTaskDialogProps = {
  task: TaskModel;
};

export const UpdateTaskDialog: Component<UpdateTaskDialogProps> = (props) => {
  const { t } = useI18n();

  const formId = createUniqueId();
  const dialogId = createUniqueId();

  const onSubmit: ComponentProps<"form">["onSubmit"] = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const parsed = await v.safeParseAsync(TaskFieldsSchema, decode(formData));

    if (!parsed.success) {
      return;
    }

    taskCollection.update(props.task.id, (draft) => {
      draft.description = parsed.output.description;
      draft.estimate = parsed.output.estimate;
      draft.link = parsed.output.link;
      draft.title = parsed.output.title;
    });

    closeDialog(dialogId);
  };

  const onButtonClick = () => {
    openDialog(dialogId);
  };

  return (
    <>
      <Button
        aria-label={t("board.tasks.updateTask")}
        shape="circle"
        size="xs"
        onClick={onButtonClick}
      >
        <PencilIcon class="size-4" />
      </Button>
      <Dialog id={dialogId}>
        <DialogBox>
          <DialogTitle>{t("common.update")}</DialogTitle>
          <form id={formId} onSubmit={onSubmit}>
            <TaskFields initialValues={props.task} />
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

type TaskFieldsProps = {
  pending?: boolean;
  issues?: FormIssues;
  initialValues?: Partial<TaskModel>;
};

const TaskFields: Component<TaskFieldsProps> = (props) => {
  const { t } = useI18n();

  return (
    <Fieldset>
      <FormError message={props.issues?.error} />

      <FieldsetLabel for="title">{t("board.tasks.title")}</FieldsetLabel>
      <Input
        disabled={props.pending}
        id="title"
        name="title"
        required={true}
        width="full"
        value={props.initialValues?.title}
        {...getInvalidStateProps({
          errorMessageId: "title-error",
          isInvalid: Boolean(props.issues?.errors?.title),
        })}
      />
      <FieldError id="title-error" message={props.issues?.errors?.title} />

      <FieldsetLabel for="description">{t("board.tasks.description")}</FieldsetLabel>
      <Input
        disabled={props.pending}
        id="description"
        name="description"
        required={true}
        width="full"
        value={props.initialValues?.description}
        {...getInvalidStateProps({
          errorMessageId: "description-error",
          isInvalid: Boolean(props.issues?.errors?.description),
        })}
      />
      <FieldError id="description-error" message={props.issues?.errors?.description} />

      <FieldsetLabel for="estimate">{t("board.tasks.estimate")}</FieldsetLabel>
      <Input
        disabled={props.pending}
        id="estimate"
        name="estimate"
        required={true}
        width="full"
        type="number"
        step={1}
        min={0}
        value={props.initialValues?.estimate}
        {...getInvalidStateProps({
          errorMessageId: "estimate-error",
          isInvalid: Boolean(props.issues?.errors?.estimate),
        })}
      />
      <FieldError id="estimate-error" message={props.issues?.errors?.estimate} />

      <FieldsetLabel for="link">{t("board.tasks.link")}</FieldsetLabel>
      <Input
        disabled={props.pending}
        id="link"
        name="link"
        width="full"
        value={props.initialValues?.link}
        {...getInvalidStateProps({
          errorMessageId: "link-error",
          isInvalid: Boolean(props.issues?.errors?.link),
        })}
      />
      <FieldError id="link-error" message={props.issues?.errors?.link} />
    </Fieldset>
  );
};
