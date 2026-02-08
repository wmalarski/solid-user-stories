import type { EdgeModel, TaskModel } from "../contexts/board-model";
import { SECTION_X_OFFSET, SECTION_Y_OFFSET, TASK_RECT_HEIGHT, TASK_RECT_WIDTH } from "./constants";
import type { SectionConfigs } from "./section-configs";

const numberSortAscending = (left: number, right: number) => left - right;

type GetBoardBoxArgs = {
  tasks: TaskModel[];
  edges: EdgeModel[];
  sectionsX: SectionConfigs;
  sectionsY: SectionConfigs;
};

export const getBoardBox = ({ edges, tasks, sectionsX, sectionsY }: GetBoardBoxArgs) => {
  const xValues = [
    ...tasks
      .values()
      .flatMap((task) => [
        task.position.x + SECTION_X_OFFSET,
        task.position.x + TASK_RECT_HEIGHT + SECTION_X_OFFSET,
      ]),
    ...edges.map((edge) => edge.breakX + SECTION_X_OFFSET),
    ...sectionsX.flatMap((section) => [section.start, section.end]),
  ];

  const yValues = [
    ...tasks
      .values()
      .flatMap((task) => [
        task.position.y + SECTION_Y_OFFSET,
        task.position.y + SECTION_Y_OFFSET + TASK_RECT_WIDTH,
      ]),
    ...sectionsY.flatMap((section) => [section.start, section.end]),
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
