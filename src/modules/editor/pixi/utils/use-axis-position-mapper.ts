import { useBoardContext } from "../../contexts/board-context";
import type { Point2D } from "../../utils/types";

export const useAxisPositionMapper = () => {
  const boardContext = useBoardContext();

  return (point: Point2D) => {
    const boardContextValue = boardContext();
    const horizontalIndex =
      boardContextValue.axis.horizontal.positions.findIndex((value) => value > point.x) - 1;
    const verticalIndex =
      boardContextValue.axis.vertical.positions.findIndex((value) => value > point.y) - 1;

    const horizontalAxis =
      horizontalIndex < 0 ? null : boardContextValue.axis.horizontal.axis[horizontalIndex]?.id;
    const verticalAxis =
      verticalIndex < 0 ? null : boardContextValue.axis.vertical.axis[verticalIndex]?.id;

    return { axisX: horizontalAxis, axisY: verticalAxis };
  };
};
