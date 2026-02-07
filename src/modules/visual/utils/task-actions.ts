import type {
  EdgeListInstance,
  TaskInput,
  TaskInstance,
  TaskListInstance,
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

export const updateTaskPosition = (
  instance: TaskInstance,
  task: Pick<TaskInput, "positionX" | "positionY" | "sectionX" | "sectionY">,
) => {
  instance.$jazz.set("positionX", task.positionX);
  instance.$jazz.set("positionY", task.positionX);
  instance.$jazz.set("sectionX", task.sectionX);
  instance.$jazz.set("sectionY", task.sectionY);
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
