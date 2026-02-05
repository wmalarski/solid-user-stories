import type { BoardModel, SectionModel } from "~/integrations/tanstack-db/schema";
import { SECTION_X_OFFSET, SECTION_Y_OFFSET } from "./constants";
import type { Point2D } from "./types";

const orderSectionModels = (collection: SectionModel[], order: string[]) => {
  const map = new Map(collection.map((section) => [section.id, section] as const));
  const result: SectionModel[] = [];

  for (const sectionId of order) {
    const ssection = map.get(sectionId);
    if (ssection) {
      result.push(ssection);
    }
  }

  return result;
};

const getPositions = (collection: SectionModel[]) => {
  return collection.reduce(
    (previous, current) => {
      const last = previous.at(-1) ?? 0;
      previous.push(last + current.size);
      return previous;
    },
    [0],
  );
};

export const getSectionConfigs = (entries: SectionModel[], board: BoardModel) => {
  const horizontal: SectionModel[] = [];
  const vertical: SectionModel[] = [];

  for (const entry of entries) {
    const array = entry.orientation === "horizontal" ? horizontal : vertical;
    array.push(entry);
  }

  const orderedHorizontal = orderSectionModels(horizontal, board.sectionXOrder);
  const orderedVertical = orderSectionModels(vertical, board.sectionYOrder);

  const horizontalPositions = getPositions(orderedHorizontal);
  const verticalPositions = getPositions(orderedVertical);

  const x = orderedHorizontal.map((section, index) => ({
    end: horizontalPositions[index + 1],
    index,
    section,
    start: horizontalPositions[index],
  }));

  const y = orderedVertical.map((section, index) => ({
    end: verticalPositions[index + 1],
    index,
    section,
    start: verticalPositions[index],
  }));

  return { x, y } as const;
};

export type SectionConfigs = ReturnType<typeof getSectionConfigs>;
export type SectionConfig = SectionConfigs["x"][0];

export const mapToSections = (config: SectionConfigs, point: Point2D) => {
  const x = point.x - SECTION_X_OFFSET;
  const y = point.y - SECTION_Y_OFFSET;

  const sectionX = config.x.find((entry) => entry.start <= x && x < entry.end);
  const sectionY = config.y.find((entry) => entry.start <= y && y < entry.end);

  return { sectionX: sectionX?.section.id ?? null, sectionY: sectionY?.section.id ?? null };
};
