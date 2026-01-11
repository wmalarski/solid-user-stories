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
    axisBoackgroundColor: "#aabbcc",
    axisGridColor: "#66bb44",
    axisItemBoackgroundColor: "#ffeedd",
    backgroundDarkColor: "#1d1d21",
    edgeColor: "#ee3322",
    edgeDrawingColor: "#ee1122",
    edgeHandleColor: "#ee3344",
    selectionColor: "#eeff33",
    taskBackgroundColor: "#998877",
    taskHandleBackgroundColor: "#228877",
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

export const useBoardThemeContext = () => {
  return useContext(BoardThemeContext);
};
