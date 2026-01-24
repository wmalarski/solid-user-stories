import { decode } from "decode-formdata";
import {
  createContext,
  createSignal,
  createUniqueId,
  useContext,
  type Component,
  type ComponentProps,
  type ParentProps,
} from "solid-js";
import * as v from "valibot";
import { useI18n } from "~/integrations/i18n";
import { taskCollection } from "~/integrations/tanstack-db/collections";
import { createId } from "~/integrations/tanstack-db/create-id";
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
import { useBoardId } from "../contexts/board-state";
import { mapToSections, useSectionConfigsContext } from "../contexts/section-configs";
import { useSelectionStateContext } from "../contexts/selection-state";
import { useDialogBoardToolUtils, useToolsStateContext } from "../contexts/tools-state";
import type { Point2D } from "../utils/types";
import { TaskFields, TaskFieldsSchema } from "./task-dialogs";

type InsertTaskDialogContextValue = {
  openInsertDialog: (point: Point2D) => void;
};

const InsertTaskDialogContext = createContext<InsertTaskDialogContextValue>({
  openInsertDialog: () => {},
});

export const useInsertTaskDialogContext = () => {
  return useContext(InsertTaskDialogContext);
};

export const InsertTaskDialogProvider: Component<ParentProps> = (props) => {
  const [position, setPosition] = createSignal<Point2D>({ x: 0, y: 0 });

  const dialogId = createUniqueId();

  const { onClick } = useDialogBoardToolUtils();

  const openInsertDialog = (point: Point2D) => {
    onClick();
    setPosition(point);
    openDialog(dialogId);
  };

  return (
    <>
      <InsertTaskDialogContext.Provider value={{ openInsertDialog }}>
        {props.children}
      </InsertTaskDialogContext.Provider>
      <InsertTaskDialog dialogId={dialogId} position={position()} />
    </>
  );
};

type InsertTaskDialogProps = {
  dialogId: string;
  position: Point2D;
};

const InsertTaskDialog: Component<InsertTaskDialogProps> = (props) => {
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
  };

  return (
    <Dialog id={props.dialogId} onClose={onClose}>
      <DialogBox>
        <DialogTitle>{t("board.tasks.insertTask")}</DialogTitle>
        <form id={formId} onSubmit={onSubmit}>
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
