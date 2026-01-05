import { useBoardContext } from "../../contexts/board-context";
import type { Point2D } from "../../utils/types";
import { useTaskContainer } from "../pixi-app";

export const useAxisPositionMapper = () => {
  const boardContext = useBoardContext();
  const taskContainer = useTaskContainer();

  return (point: Point2D) => {
    // taskContainer.localTransform.applyInverse(point)

    console.log("[createAxisPositionMap]", point.x, point.y);

    console.log(
      JSON.stringify(
        {
          "taskContainer.groupTransform.apply(point)": taskContainer.groupTransform.apply(point),
          "taskContainer.groupTransform.applyInverse(point)":
            taskContainer.groupTransform.applyInverse(point),
          "taskContainer.localTransform.apply(point)": taskContainer.localTransform.apply(point),
          "taskContainer.localTransform.applyInverse(point)":
            taskContainer.localTransform.applyInverse(point),
        },
        null,
        2,
      ),
    );
  };
};
