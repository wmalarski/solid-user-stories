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
