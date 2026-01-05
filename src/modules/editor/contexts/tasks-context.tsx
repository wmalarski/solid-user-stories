import { eq, useLiveQuery } from "@tanstack/solid-db";
import {
  type Accessor,
  type Component,
  type ParentProps,
  createContext,
  createMemo,
  useContext,
} from "solid-js";
import { taskCollection } from "~/integrations/tanstack-db/collections";
import { useBoardId } from "./board-context";

const createTasksContextState = (boardId: string) => {
  return useLiveQuery((q) =>
    q.from({ tasks: taskCollection }).where(({ tasks }) => eq(tasks.boardId, boardId)),
  );
};

const TasksContext = createContext<Accessor<ReturnType<typeof createTasksContextState>>>(() => {
  throw new Error("TasksContext not defined");
});

export const useTasksContext = () => {
  return useContext(TasksContext);
};

export const TasksContextProvider: Component<ParentProps> = (props) => {
  const boardId = useBoardId();
  const value = createMemo(() => createTasksContextState(boardId()));
  return <TasksContext.Provider value={value}>{props.children}</TasksContext.Provider>;
};
