import type { EdgeInput, TaskInput } from "~/integrations/jazz/schema";
import { SECTION_X_OFFSET, SECTION_Y_OFFSET, TASK_RECT_HEIGHT, TASK_RECT_WIDTH } from "./constants";
import type { SectionConfigs } from "./section-configs";

const numberSortAscending = (left: number, right: number) => left - right;

type GetBoardBoxArgs = {
  tasks: TaskInput[];
  edges: EdgeInput[];
  sections: SectionConfigs;
};

export const getBoardBox = ({ tasks, edges, sections }: GetBoardBoxArgs) => {
  const xValues = [
    ...tasks.flatMap((task) => [
      task.positionX + SECTION_X_OFFSET,
      task.positionX + TASK_RECT_HEIGHT + SECTION_X_OFFSET,
    ]),
    ...edges.map((edge) => edge.breakX + SECTION_X_OFFSET),
    ...sections.x.flatMap((section) => [section.start, section.end]),
  ];

  const yValues = [
    ...tasks.flatMap((task) => [
      task.positionY + SECTION_Y_OFFSET,
      task.positionY + SECTION_Y_OFFSET + TASK_RECT_WIDTH,
    ]),
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
