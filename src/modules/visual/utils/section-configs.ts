import type { SectionModel } from "../contexts/board-model";
import { SECTION_X_OFFSET, SECTION_Y_OFFSET } from "./constants";
import type { Point2D } from "./types";

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

export const getSectionConfig = (sections: SectionModel[]) => {
  const positions = getPositions(sections);
  return sections.map((section, index) => ({
    end: positions[index + 1],
    index,
    section,
    start: positions[index],
  }));
};

export type SectionConfigs = ReturnType<typeof getSectionConfig>;
export type SectionConfig = SectionConfigs[number];

export const mapToSections = (configX: SectionConfigs, configY: SectionConfigs, point: Point2D) => {
  const x = point.x - SECTION_X_OFFSET;
  const y = point.y - SECTION_Y_OFFSET;

  const sectionX = configX.find((entry) => entry.start <= x && x < entry.end);
  const sectionY = configY.find((entry) => entry.start <= y && y < entry.end);

  return { sectionX: sectionX?.section ?? null, sectionY: sectionY?.section ?? null };
};
