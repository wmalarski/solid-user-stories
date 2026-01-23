import { eq, useLiveQuery } from "@tanstack/solid-db";
import {
  type Accessor,
  type Component,
  type ParentProps,
  createContext,
  createMemo,
  useContext,
} from "solid-js";
import { axisCollection } from "~/integrations/tanstack-db/collections";
import type { AxisModel, BoardModel } from "~/integrations/tanstack-db/schema";

import { AXIS_X_OFFSET, AXIS_Y_OFFSET } from "../utils/constants";
import type { Point2D } from "../utils/types";
import { useBoardId, useBoardModelContext } from "./board-model";

const createAxisConfigContext = (boardId: string) => {
  const boardModel = useBoardModelContext();

  const entries = useLiveQuery((q) =>
    q.from({ axis: axisCollection }).where(({ axis }) => eq(axis.boardId, boardId)),
  );

  const config = createMemo(() => getAxisValues(entries(), boardModel().board));

  return {
    get config() {
      return config();
    },
  };
};

const AxisConfigContext = createContext<Accessor<ReturnType<typeof createAxisConfigContext>>>(
  () => {
    throw new Error("AxisConfigContext not defined");
  },
);

export const useAxisConfigContext = () => {
  return useContext(AxisConfigContext);
};

export const AxisConfigProvider: Component<ParentProps> = (props) => {
  const boardId = useBoardId();

  const value = createMemo(() => createAxisConfigContext(boardId()));

  return <AxisConfigContext.Provider value={value}>{props.children}</AxisConfigContext.Provider>;
};

const orderAxisModels = (collection: AxisModel[], order: string[]) => {
  const map = new Map(collection.map((axis) => [axis.id, axis] as const));
  const result: AxisModel[] = [];

  for (const axisId of order) {
    const axis = map.get(axisId);
    if (axis) {
      result.push(axis);
    }
  }

  return result;
};

const getPositions = (collection: AxisModel[]) => {
  return collection.reduce(
    (previous, current) => {
      const last = previous.at(-1) ?? 0;
      previous.push(last + current.size);
      return previous;
    },
    [0],
  );
};

const getAxisValues = (entries: AxisModel[], board: BoardModel) => {
  const horizontal: AxisModel[] = [];
  const vertical: AxisModel[] = [];

  for (const entry of entries) {
    const array = entry.orientation === "horizontal" ? horizontal : vertical;
    array.push(entry);
  }

  const orderedHorizontal = orderAxisModels(horizontal, board.axisXOrder);
  const orderedVertical = orderAxisModels(vertical, board.axisYOrder);

  const horizontalPositions = getPositions(orderedHorizontal);
  const verticalPositions = getPositions(orderedVertical);

  const x = orderedHorizontal.map((axis, index) => ({
    axis,
    end: horizontalPositions[index + 1],
    index,
    start: horizontalPositions[index],
  }));

  const y = orderedVertical.map((axis, index) => ({
    axis,
    end: verticalPositions[index + 1],
    index,
    start: verticalPositions[index],
  }));

  return { x, y } as const;
};

export const mapToAxis = (config: ReturnType<typeof getAxisValues>, point: Point2D) => {
  const x = point.x - AXIS_X_OFFSET;
  const y = point.y - AXIS_Y_OFFSET;

  const axisX = config.x.find((entry) => entry.start <= x && x < entry.end);
  const axisY = config.y.find((entry) => entry.start <= y && y < entry.end);

  return { axisX: axisX?.axis.id ?? null, axisY: axisY?.axis.id ?? null };
};

export type AxisConfigContext = ReturnType<typeof createAxisConfigContext>["config"];
export type AxisConfig = ReturnType<typeof getAxisValues>["x"][0];
