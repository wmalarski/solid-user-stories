import { edgeCollection, taskCollection } from "./collections";
import type { EdgeModel } from "./schema";

export const deleteTaskWithDependencies = (taskId: string, edges: EdgeModel[]) => {
  edgeCollection.delete(edges.map((edge) => edge.id));
  taskCollection.delete(taskId);
};
