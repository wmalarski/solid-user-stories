import {
  createContext,
  createEffect,
  createMemo,
  createResource,
  onCleanup,
  useContext,
  type Accessor,
  type Component,
  type ParentProps,
} from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import {
  BoardSchema,
  CURSOR_FEED_TYPE,
  CursorFeedSchema,
  type BoardInstance,
} from "~/integrations/jazz/schema";

import { createCurrentDate } from "~/integrations/jazz/create-current-date";
import {
  mapToBoardModel,
  mapToCursorModel,
  type BoardModel,
  type CursorModel,
} from "./board-model";
import { getSectionConfig } from "./section-configs";

export const createCursorsFeed = (board: Accessor<BoardInstance>) => {
  const date = createCurrentDate();

  const [cursors] = createResource(board, async (resolvedBoard) => {
    const group = resolvedBoard.$jazz.owner;

    const feed = await CursorFeedSchema.getOrCreateUnique({
      owner: group,
      unique: {
        date: date(),
        origin: globalThis.location.origin,
        type: CURSOR_FEED_TYPE,
      },
      value: [],
    });

    if (!feed.$isLoaded) {
      throw new Error("feed is not loaded");
    }

    resolvedBoard.$jazz.set("cursors", feed);

    return feed;
  });

  return cursors;
};

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
      BoardSchema.subscribe(boardIdValue, {}, (value) => {
        setStore(reconcile(mapToBoardModel(value)));
      }),
    );
  });

  const sectionXConfigs = createMemo(() => getSectionConfig(store.sectionsX));
  const sectionYConfigs = createMemo(() => getSectionConfig(store.sectionsY));

  const cursorsFeed = createCursorsFeed(board);
  const [cursors, setCursors] = createStore<CursorModel[]>([]);

  createEffect(() => {
    const cursorsFeedValue = cursorsFeed();

    if (!cursorsFeedValue) {
      return;
    }

    onCleanup(
      cursorsFeedValue.$jazz.subscribe({}, (resolvedCursors) => {
        setCursors(mapToCursorModel(resolvedCursors));
      }),
    );
  });

  return {
    board,
    cursors,
    cursorsFeed,
    sectionXConfigs,
    sectionYConfigs,
    store,
  };
};

export type BoardStateContextValue = ReturnType<typeof createBoardStateContext>;

const BoardStateContext = createContext<BoardStateContextValue | null>(null);

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
