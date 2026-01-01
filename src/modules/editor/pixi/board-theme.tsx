import {
  type Accessor,
  type Component,
  type ParentProps,
  createContext,
  createMemo,
  useContext,
} from "solid-js";

const createBoardThemeContext = () => {
  return {
    axisContainerZIndex: 5,
    backgroundDarkColor: 0x1d1d21,
    edgeColor: 0xee3322,
    edgeDrawingColor: 0xee1122,
    selectionColor: 0xeeff33,
    taskBackgroundColor: 0x998877,
    taskHandleBackgroundColor: 0x228877,
    // cursorContainerZIndex: 5,
    // cursorGraphicsZIndex: 6,
    // cursorStrokeColor: 0xffffff,
    // cursorTextZIndex: 7,
    // nodeColor: 0xff6f98,
    // nodeSelectedColor: 0xff86a6,
  };
};

const BoardThemeContext = createContext<Accessor<ReturnType<typeof createBoardThemeContext>>>(
  () => {
    throw new Error("BoardThemeContext is not defined");
  },
);

export const BoardThemeProvider: Component<ParentProps> = (props) => {
  const value = createMemo(() => createBoardThemeContext());

  return <BoardThemeContext.Provider value={value}>{props.children}</BoardThemeContext.Provider>;
};

export const useBoardTheme = () => {
  return useContext(BoardThemeContext);
};
