import { edgeCollection, taskCollection } from "./collections";
import type { EdgeModel } from "./schema";

export const deleteTaskWithDependencies = (taskId: string, edges: EdgeModel[]) => {
  if (edges.length > 0) {
    edgeCollection.delete(edges.map((edge) => edge.id));
  }
  taskCollection.delete(taskId);
};
