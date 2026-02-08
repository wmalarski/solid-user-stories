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

export const getSectionConfigs = <X extends SectionListInstance, Y extends SectionListInstance>(
  sectionsX?: X,
  sectionsY?: Y,
) => {
  const loadedSectionsX =
    sectionsX?.flatMap((section) => (section.$isLoaded ? [section] : [])) ?? [];

  const loadedSectionsY =
    sectionsY?.flatMap((section) => (section.$isLoaded ? [section] : [])) ?? [];

  const horizontalPositions = getPositions(loadedSectionsX);
  const verticalPositions = getPositions(loadedSectionsY);

  const x = loadedSectionsX.map((section, index) => ({
    end: horizontalPositions[index + 1],
    index,
    section,
    start: horizontalPositions[index],
  }));

  const y = loadedSectionsY.map((section, index) => ({
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

  return { sectionX: sectionX?.section ?? null, sectionY: sectionY?.section ?? null };
};
