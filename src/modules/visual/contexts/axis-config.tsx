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
import { useBoardId } from "./board-model";

const createAxisConfigContext = (boardId: string) => {
  const entries = useLiveQuery((q) =>
    q.from({ axis: axisCollection }).where(({ axis }) => eq(axis.boardId, boardId)),
  );

  const axisValues = createMemo(() => getAxisValues(entries.data));

  return {
    get config() {
      return axisValues();
    },
    entries,
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
    horizontal: {
      axis: horizontal,
      positions: horizontalPositions,
    },
    vertical: {
      axis: vertical,
      positions: verticalPositions,
    },
  } as const;
};
