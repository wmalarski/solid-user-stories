import { decode } from "decode-formdata";
import {
  createEffect,
  createSignal,
  createUniqueId,
  type Component,
  type ComponentProps,
} from "solid-js";
import * as v from "valibot";
import { useI18n } from "~/integrations/i18n";
import { taskCollection } from "~/integrations/tanstack-db/collections";
import { createId } from "~/integrations/tanstack-db/create-id";
import type { TaskModel } from "~/integrations/tanstack-db/schema";
import { deleteTaskWithDependencies } from "~/integrations/tanstack-db/utils";
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
  openDialog,
} from "~/ui/dialog/dialog";
import { FieldError } from "~/ui/field-error/field-error";
import { Fieldset, FieldsetLabel } from "~/ui/fieldset/fieldset";
import { FormError } from "~/ui/form-error/form-error";
import { PencilIcon } from "~/ui/icons/pencil-icon";
import { TrashIcon } from "~/ui/icons/trash-icon";
import { Input } from "~/ui/input/input";
import { getInvalidStateProps, type FormIssues } from "~/ui/utils/forms";
import { getEdgesByTask, useBoardId, useBoardStateContext } from "../contexts/board-state";
import { mapToSections, useSectionConfigsContext } from "../contexts/section-configs";
import { useSelectionStateContext } from "../contexts/selection-state";
import { useDialogBoardToolUtils, useToolsStateContext } from "../contexts/tools-state";
import { SVG_SELECTOR } from "../utils/constants";
import { createD3ClickListener } from "../utils/create-d3-click-listener";
import type { Point2D } from "../utils/types";

export const TaskFieldsSchema = v.object({
  description: v.string(),
  estimate: v.pipe(v.string(), v.toNumber(), v.integer(), v.minValue(0)),
  link: v.optional(v.string()),
  title: v.string(),
});

export const InsertTaskByToolDialog: Component = () => {
  const [position, setPosition] = createSignal<Point2D>({ x: 0, y: 0 });

  const dialogId = createUniqueId();

  const { onClick } = useDialogBoardToolUtils();

  const [toolsState] = useToolsStateContext();

  createEffect(() => {
    const isCreateTask = toolsState() === "create-task";

    if (!isCreateTask) {
      return;
    }

    createD3ClickListener({
      onClick(event) {
        onClick();
        setPosition({ x: event.x, y: event.y });
        openDialog(dialogId);
      },
      ref: () => SVG_SELECTOR,
    });
  });

  return <InsertTaskDialog dialogId={dialogId} position={position()} />;
};

type InsertTaskDialogProps = {
  dialogId: string;
  position: Point2D;
  onInsertSuccess?: (taskId: string) => void;
};

export const InsertTaskDialog: Component<InsertTaskDialogProps> = (props) => {
  const { t } = useI18n();

  const boardId = useBoardId();
  const sectionConfigs = useSectionConfigsContext();

  const { onClose } = useDialogBoardToolUtils();
  const [_toolsState, { onToolChage }] = useToolsStateContext();
  const [_selectionState, { onSelectionChange }] = useSelectionStateContext();

  const formId = createUniqueId();

  const onSubmit: ComponentProps<"form">["onSubmit"] = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const parsed = await v.safeParseAsync(TaskFieldsSchema, decode(formData));
    const positionValue = props.position;

    if (!parsed.success) {
      return;
    }

    const taskId = createId();
    const sectionIds = mapToSections(sectionConfigs(), positionValue);

    taskCollection.insert({
      boardId: boardId(),
      description: parsed.output.description,
      estimate: parsed.output.estimate,
      id: taskId,
      link: parsed.output.link,
      positionX: positionValue.x,
      positionY: positionValue.y,
      sectionX: sectionIds.sectionX,
      sectionY: sectionIds.sectionY,
      title: parsed.output.title,
    });

    closeDialog(props.dialogId);

    event.currentTarget.reset();

    onToolChage("pane");
    onSelectionChange({ id: taskId, kind: "task" });
    props.onInsertSuccess?.(taskId);
  };

  return (
    <Dialog id={props.dialogId} onClose={onClose}>
      <DialogBox>
        <DialogTitle>{t("board.tasks.insertTask")}</DialogTitle>
        <DialogDescription>{t("board.tasks.insertDescription")}</DialogDescription>
        <form id={formId} onSubmit={onSubmit}>
          <TaskFields />
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
  );
};

type UpdateTaskDialogProps = {
  task: TaskModel;
};

export const UpdateTaskDialog: Component<UpdateTaskDialogProps> = (props) => {
  const { t } = useI18n();

  const formId = createUniqueId();
  const dialogId = createUniqueId();

  const { onClick, onClose } = useDialogBoardToolUtils();

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

  return (
    <>
      <DialogTrigger
        aria-label={t("board.tasks.updateTask")}
        shape="circle"
        size="sm"
        for={dialogId}
        onClick={onClick}
      >
        <PencilIcon class="size-4" />
      </DialogTrigger>
      <Dialog id={dialogId} onClose={onClose}>
        <DialogBox>
          <DialogTitle>{t("board.tasks.updateTask")}</DialogTitle>
          <DialogDescription>{t("board.tasks.updateDescription")}</DialogDescription>
          <form id={formId} onSubmit={onSubmit}>
            <TaskFields initialValues={props.task} />
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

type DeleteTaskDialogProps = {
  task: TaskModel;
};

export const DeleteTaskDialog: Component<DeleteTaskDialogProps> = (props) => {
  const { t } = useI18n();

  const dialogId = createUniqueId();

  const boardState = useBoardStateContext();
  const { onClick, onClose } = useDialogBoardToolUtils();

  const onConfirmClick = () => {
    closeDialog(dialogId);

    const edges = getEdgesByTask(boardState.edges(), props.task.id);
    deleteTaskWithDependencies(props.task.id, edges);
  };

  return (
    <>
      <DialogTrigger
        aria-label={t("common.delete")}
        for={dialogId}
        onClick={onClick}
        shape="circle"
        size="sm"
      >
        <TrashIcon class="size-4" />
      </DialogTrigger>
      <AlertDialog
        description={t("common.confirm")}
        dialogId={dialogId}
        onClose={onClose}
        onSave={onConfirmClick}
        title={t("common.delete")}
      />
    </>
  );
};
