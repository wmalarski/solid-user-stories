import {
  createContext,
  createEffect,
  createMemo,
  onCleanup,
  useContext,
  type Accessor,
  type Component,
  type ParentProps,
} from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { BoardSchema, type BoardInstance } from "~/integrations/jazz/schema";

import {
  deleteEdgeInstance,
  insertEdgeInstanceToPoint,
  insertEdgeInstanceToSecondTask,
  updateEdgeInstance,
  type DeleteEdgeInstanceArgs,
  type InsertEdgeInstanceToPointArgs,
  type InsertEdgeInstanceToTaskArgs,
  type UpdateEdgeInstanceArgs,
} from "../utils/edge-actions";
import {
  deleteHorizontalSectionInstance,
  deleteVerticalSectionInstance,
  insertHorizontalSectionInstance,
  insertVerticalSectionInstance,
  updateHorizontalSectionInstance,
  updateHorizontalSectionInstanceSize,
  updateVerticalSectionInstance,
  updateVerticalSectionInstanceSize,
  type DeleteHorizontalSectionInstanceArgs,
  type DeleteVerticalSectionInstanceArgs,
  type InsertHorizontalSectionInstance,
  type InsertVerticalSectionInstanceArgs,
  type UpdateHorizontalSectionInstanceArgs,
  type UpdateHorizontalSectionInstanceSizeArgs,
  type UpdateVerticalSectionInstanceArgs,
  type UpdateVerticalSectionInstanceSizeArgs,
} from "../utils/section-actions";
import { getSectionConfig } from "../utils/section-configs";
import {
  deleteTaskInstance,
  insertTaskInstance,
  updateTaskInstanceDetails,
  updateTaskInstancePosition,
  type DeleteTaskInstanceArgs,
  type InsertTaskInstanceArgs,
  type UpdateTaskInstanceDetailsArgs,
  type UpdateTaskInstancePositionArgs,
} from "../utils/task-actions";
import { mapToBoardModel, type BoardModel } from "./board-model";

type OmitBoard<T> = Omit<T, "board">;

const createBoardStateContext = (board: Accessor<BoardInstance>) => {
  const [store, setStore] = createStore<BoardModel>({
    edges: [],
    sectionsX: [],
    sectionsY: [],
    tasks: [],
  });

  const boardId = createMemo(() => board().$jazz.id);
  createEffect(() => {
    const boardIdValue = boardId();
    onCleanup(
      BoardSchema.subscribe(boardIdValue, (value) => {
        setStore(reconcile(mapToBoardModel(value)));
      }),
    );
  });

  const sectionXConfigs = createMemo(() => getSectionConfig(store.sectionsX));
  const sectionYConfigs = createMemo(() => getSectionConfig(store.sectionsY));

  return {
    board,
    edges: {
      deleteEdge: (args: OmitBoard<DeleteEdgeInstanceArgs>) =>
        deleteEdgeInstance({ board: board(), ...args }),
      insertEdgeToPoint: (args: OmitBoard<InsertEdgeInstanceToPointArgs>) =>
        insertEdgeInstanceToPoint({ board: board(), ...args }),
      insertEdgeToTask: (args: OmitBoard<InsertEdgeInstanceToTaskArgs>) =>
        insertEdgeInstanceToSecondTask({ board: board(), ...args }),
      updateEdgePosition: (args: OmitBoard<UpdateEdgeInstanceArgs>) =>
        updateEdgeInstance({ board: board(), ...args }),
    },
    sectionX: {
      configs: sectionXConfigs,
      deleteSection: (args: OmitBoard<DeleteHorizontalSectionInstanceArgs>) =>
        deleteHorizontalSectionInstance({ board: board(), ...args }),
      insertSection: (args: OmitBoard<InsertHorizontalSectionInstance>) =>
        insertHorizontalSectionInstance({ board: board(), ...args }),
      updateSectionName: (args: OmitBoard<UpdateHorizontalSectionInstanceArgs>) =>
        updateHorizontalSectionInstance({ board: board(), ...args }),
      updateSectionPosition: (args: OmitBoard<UpdateHorizontalSectionInstanceSizeArgs>) =>
        updateHorizontalSectionInstanceSize({ board: board(), ...args }),
    },
    sectionY: {
      configs: sectionYConfigs,
      deleteSection: (args: OmitBoard<DeleteVerticalSectionInstanceArgs>) =>
        deleteVerticalSectionInstance({ board: board(), ...args }),
      insertSection: (args: OmitBoard<InsertVerticalSectionInstanceArgs>) =>
        insertVerticalSectionInstance({ board: board(), ...args }),
      updateSectionName: (args: OmitBoard<UpdateVerticalSectionInstanceArgs>) =>
        updateVerticalSectionInstance({ board: board(), ...args }),
      updateSectionPosition: (args: OmitBoard<UpdateVerticalSectionInstanceSizeArgs>) =>
        updateVerticalSectionInstanceSize({ board: board(), ...args }),
    },
    store,
    tasks: {
      deleteTask: (args: OmitBoard<DeleteTaskInstanceArgs>) =>
        deleteTaskInstance({ board: board(), ...args }),
      insertTask: (args: OmitBoard<InsertTaskInstanceArgs>) =>
        insertTaskInstance({ board: board(), ...args }),
      updateTaskDetails: (args: OmitBoard<UpdateTaskInstanceDetailsArgs>) =>
        updateTaskInstanceDetails({ board: board(), ...args }),
      updateTaskPosition: (args: OmitBoard<UpdateTaskInstancePositionArgs>) =>
        updateTaskInstancePosition({ board: board(), ...args }),
    },
  };
};

const BoardStateContext = createContext<ReturnType<typeof createBoardStateContext> | null>(null);

export const useBoardStateContext = () => {
  const context = useContext(BoardStateContext);
  if (!context) {
    throw new Error("BoardStateContext is not defined");
  }
  return context;
};

type BoardStateProviderProps = ParentProps<{
  board: BoardInstance;
}>;

export const BoardStateProvider: Component<BoardStateProviderProps> = (props) => {
  const value = createBoardStateContext(() => props.board);

  return <BoardStateContext.Provider value={value}>{props.children}</BoardStateContext.Provider>;
};
