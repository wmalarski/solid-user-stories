import type { TaskInput, TaskInstance } from "~/integrations/jazz/schema";
import type { EdgeCollection, TaskCollection } from "~/integrations/tanstack-db/collections";
import type { EdgeEntry } from "../contexts/board-state";

const getEdgesByTask = (edges: EdgeEntry[], taskId: string) => {
  return edges
    .map((entry) => entry.edge)
    .filter((edge) => edge.source === taskId || edge.target === taskId);
};

type DeleteTaskWithDependenciesArgs = {
  taskId: string;
  edges: EdgeEntry[];
  taskCollection: TaskCollection;
  edgeCollection: EdgeCollection;
};

export const deleteTaskWithDependencies = ({
  edges,
  taskId,
  taskCollection,
  edgeCollection,
}: DeleteTaskWithDependenciesArgs) => {
  const taskEdges = getEdgesByTask(edges, taskId);
  if (edges.length > 0) {
    edgeCollection.delete(taskEdges.map((edge) => edge.id));
  }
  taskCollection.delete(taskId);
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
