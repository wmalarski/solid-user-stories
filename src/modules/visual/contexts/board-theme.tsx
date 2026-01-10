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
    axisBoackgroundColor: "0xaabbcc",
    axisGridColor: "0x66bb44",
    axisItemBoackgroundColor: "0xffeedd",
    backgroundDarkColor: "0x1d1d21",
    edgeColor: "0xee3322",
    edgeDrawingColor: "0xee1122",
    selectionColor: "0xeeff33",
    taskBackgroundColor: "0x998877",
    taskHandleBackgroundColor: "0x228877",
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
