import type { SectionInstance, SectionListInstance } from "~/integrations/jazz/schema";
import { SECTION_X_OFFSET, SECTION_Y_OFFSET } from "./constants";
import type { Point2D } from "./types";

const getPositions = (collection: SectionInstance[]) => {
  return collection.reduce(
    (previous, current) => {
      const last = previous.at(-1) ?? 0;
      const size = current.size.$isLoaded ? current.size.value : 0;
      previous.push(last + size);
      return previous;
    },
    [0],
  );
};

export const getSectionConfig = (sections?: SectionListInstance) => {
  const loadedSections = sections?.flatMap((section) => (section.$isLoaded ? [section] : [])) ?? [];

  const positions = getPositions(loadedSections);

  return loadedSections.map((section, index) => ({
    end: positions[index + 1],
    index,
    section,
    start: positions[index],
  }));
};

export const getSectionConfigs = (
  sectionsX?: SectionListInstance,
  sectionsY?: SectionListInstance,
) => {
  return { x: getSectionConfig(sectionsX), y: getSectionConfig(sectionsY) } as const;
};

export type SectionConfigs = ReturnType<typeof getSectionConfigs>;
export type SectionConfigs2 = ReturnType<typeof getSectionConfig>;
export type SectionConfig = SectionConfigs["x"][0];

export const mapToSections = (
  configX: SectionConfigs2,
  configY: SectionConfigs2,
  point: Point2D,
) => {
  const x = point.x - SECTION_X_OFFSET;
  const y = point.y - SECTION_Y_OFFSET;

  const sectionX = configX.find((entry) => entry.start <= x && x < entry.end);
  const sectionY = configY.find((entry) => entry.start <= y && y < entry.end);

  return { sectionX: sectionX?.section ?? null, sectionY: sectionY?.section ?? null };
};
