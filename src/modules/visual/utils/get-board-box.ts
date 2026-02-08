import type { EdgeBreakInstance, TaskPositionInstance } from "~/integrations/jazz/schema";
import { SECTION_X_OFFSET, SECTION_Y_OFFSET, TASK_RECT_HEIGHT, TASK_RECT_WIDTH } from "./constants";
import type { SectionConfigs } from "./section-configs";

const numberSortAscending = (left: number, right: number) => left - right;

type GetBoardBoxArgs = {
  taskPositions: Map<string, TaskPositionInstance>;
  edgePositions: Map<string, EdgeBreakInstance>;
  sections: SectionConfigs;
};

export const getBoardBox = ({ edgePositions, taskPositions, sections }: GetBoardBoxArgs) => {
  const xValues = [
    ...taskPositions
      .values()
      .flatMap((task) => [task.x + SECTION_X_OFFSET, task.x + TASK_RECT_HEIGHT + SECTION_X_OFFSET]),
    ...edgePositions.values().map((edge) => edge.value + SECTION_X_OFFSET),
    ...sections.x.flatMap((section) => [section.start, section.end]),
  ];

  const yValues = [
    ...taskPositions
      .values()
      .flatMap((task) => [task.y + SECTION_Y_OFFSET, task.y + SECTION_Y_OFFSET + TASK_RECT_WIDTH]),
    ...sections.y.flatMap((section) => [section.start, section.end]),
  ];

  xValues.sort(numberSortAscending);
  yValues.sort(numberSortAscending);

  const maxX = xValues.at(-1) ?? 0;
  const maxY = yValues.at(-1) ?? 0;
  const minX = xValues.at(0) ?? 0;
  const minY = yValues.at(0) ?? 0;

  return {
    height: maxY - minY,
    shiftX: -minX,
    shiftY: -minY,
    width: maxX - minX,
  };
};
