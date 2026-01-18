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
import { useBoardId } from "./board-model";

const createTasksDataContext = (boardId: string) => {
  const tasks = useLiveQuery((q) =>
    q.from({ tasks: taskCollection }).where(({ tasks }) => eq(tasks.boardId, boardId)),
  );

  return {
    get entries() {
      return tasks();
    },
  };
};

const TasksDataContext = createContext<Accessor<ReturnType<typeof createTasksDataContext>>>(() => {
  throw new Error("TasksDataContext not defined");
});

export const useTasksDataContext = () => {
  return useContext(TasksDataContext);
};

export const TasksDataProvider: Component<ParentProps> = (props) => {
  const boardId = useBoardId();

  const value = createMemo(() => createTasksDataContext(boardId()));

  return <TasksDataContext.Provider value={value}>{props.children}</TasksDataContext.Provider>;
};
