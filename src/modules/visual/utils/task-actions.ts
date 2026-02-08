import type {
  EdgeListInstance,
  TaskInput,
  TaskInstance,
  TaskListInstance,
} from "~/integrations/jazz/schema";
import type { Point2D } from "./types";

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

export const updateTaskPosition = (instance: TaskInstance, position: Point2D) => {
  instance.$jazz.set("positionX", position.x);
  instance.$jazz.set("positionY", position.y);
};

export const updateTaskData = (
  instance: TaskInstance,
  task: Pick<TaskInstance, "description" | "estimate" | "link" | "title">,
) => {
  instance.$jazz.set("description", task.description);
  instance.$jazz.set("estimate", task.estimate);
  instance.$jazz.set("link", task.link);
  instance.$jazz.set("title", task.title);
};
