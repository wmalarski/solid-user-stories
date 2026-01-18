import {
  type Accessor,
  type Component,
  type ParentProps,
  createContext,
  createMemo,
  createSignal,
  useContext,
} from "solid-js";
import type { AxisModel, TaskModel } from "~/integrations/tanstack-db/schema";
import { closeDialog, openDialog } from "~/ui/dialog/dialog";

export const INSERT_AXIS_DIALOG_ID = "insertAxis";
export const DELETE_AXIS_DIALOG_ID = "deleteAxis";
export const UPDATE_AXIS_DIALOG_ID = "updateAxis";
export const UPDATE_TASK_DIALOG_ID = "updateTask";

type BoardDialogsValue = {
  [INSERT_AXIS_DIALOG_ID]?: {
    orientation: AxisModel["orientation"];
    index: number;
  };
  [DELETE_AXIS_DIALOG_ID]?: {
    axisId: string;
  };
  [UPDATE_AXIS_DIALOG_ID]?: {
    axis: AxisModel;
  };
  [UPDATE_TASK_DIALOG_ID]?: {
    task: TaskModel;
  };
};

const createBoardDialogsContext = () => {
  const [context, setContext] = createSignal<BoardDialogsValue>({});

  const openBoardDialog = <T extends keyof BoardDialogsValue>(
    dialogId: T,
    context: BoardDialogsValue[T],
  ) => {
    setContext((current) => ({ ...current, [dialogId]: context }));
    openDialog(dialogId);
  };

  const closeBoardDialog = <T extends keyof BoardDialogsValue>(dialogId: T) => {
    setContext((current) => ({ ...current, [dialogId]: undefined }));
    closeDialog(dialogId);
  };

  return {
    closeBoardDialog,
    get context() {
      return context();
    },
    openBoardDialog,
  };
};

const BoardDialogsContext = createContext<Accessor<ReturnType<typeof createBoardDialogsContext>>>(
  () => {
    throw new Error("BoardDialogsContext not defined");
  },
);

export const useBoardDialogsContext = () => {
  return useContext(BoardDialogsContext);
};

export const BoardDialogsProvider: Component<ParentProps> = (props) => {
  const value = createMemo(() => createBoardDialogsContext());

  return (
    <BoardDialogsContext.Provider value={value}>{props.children}</BoardDialogsContext.Provider>
  );
};
