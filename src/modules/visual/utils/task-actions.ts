import type {
  EdgeListInstance,
  TaskInput,
  TaskInstance,
  TaskListInstance,
  TaskPositionInstance,
} from "~/integrations/jazz/schema";

type DeleteTaskWithDependenciesArgs = {
  taskId: string;
  tasks?: TaskListInstance;
  edges?: EdgeListInstance;
};

export const deleteTaskWithDependencies = ({
  taskId,
  tasks,
  edges,
}: DeleteTaskWithDependenciesArgs) => {
  edges?.$jazz.remove((edge) =>
    edge.$isLoaded ? edge.target === taskId || edge.source === taskId : false,
  );
  tasks?.$jazz.remove((task) => task.$jazz.id === taskId);
};

export const updateTaskSections = (
  instance: TaskInstance,
  task: Pick<TaskInput, "sectionX" | "sectionY">,
) => {
  instance.$jazz.set("sectionX", task.sectionX);
  instance.$jazz.set("sectionY", task.sectionY);
};

export const updateTaskPosition = (
  position: TaskPositionInstance,
  task: Pick<TaskPositionInstance, "x" | "y">,
) => {
  position.$jazz.set("x", task.x);
  position.$jazz.set("y", task.y);
};

export const updateTaskData = (
  instance: TaskInstance,
  task: Pick<TaskInput, "description" | "estimate" | "link" | "title">,
) => {
  instance.$jazz.set("description", task.description);
  instance.$jazz.set("estimate", task.estimate);
  instance.$jazz.set("link", task.link);
  instance.$jazz.set("title", task.title);
};
