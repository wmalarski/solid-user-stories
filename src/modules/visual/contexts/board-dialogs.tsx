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
import type { AxisModel } from "~/integrations/tanstack-db/schema";
import type { Point2D } from "~/modules/editor/utils/types";
import { AXIS_OFFSET } from "../utils/constants";
import { useBoardId } from "./board-model";

const createAxisConfigContext = (boardId: string) => {
  const entries = useLiveQuery((q) =>
    q.from({ axis: axisCollection }).where(({ axis }) => eq(axis.boardId, boardId)),
  );

  const config = createMemo(() => getAxisValues(entries()));

  const mapToAxis = (point: Point2D) => {
    const configValue = config();

    const x = point.x - AXIS_OFFSET;
    const y = point.y - AXIS_OFFSET;

    const axisX = configValue.x.find((entry) => entry.start <= x && x < entry.end);
    const axisY = configValue.y.find((entry) => entry.start <= y && y < entry.end);

    return { axisX: axisX?.axis.id ?? null, axisY: axisY?.axis.id ?? null };
  };

  return {
    get config() {
      return config();
    },
    entries,
    mapToAxis,
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

const getAxisValues = (entries: AxisModel[]) => {
  const horizontal: AxisModel[] = [];
  const vertical: AxisModel[] = [];

  for (const entry of entries) {
    const array = entry.orientation === "horizontal" ? horizontal : vertical;
    array.push(entry);
  }

  const horizontalPositions = getPositions(horizontal);
  const verticalPositions = getPositions(vertical);

  return {
    x: horizontal.map((axis, index) => ({
      axis,
      end: horizontalPositions[index + 1],
      start: horizontalPositions[index],
    })),
    y: vertical.map((axis, index) => ({
      axis,
      end: verticalPositions[index + 1],
      start: verticalPositions[index],
    })),
  } as const;
};
