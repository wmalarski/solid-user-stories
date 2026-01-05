import type { Component } from "solid-js";
import { InsertTaskDialog } from "../components/task-dialogs";
import { ZoomBar } from "../components/zoom-bar";
import { EdgeDrawingContextProvider } from "../contexts/edge-drawing-context";
import { SelectionContextProvider } from "../contexts/selection-context";
import { TasksContextProvider } from "../contexts/tasks-context";
import { TransformStateProvider } from "../contexts/transform-state";
import { BoardThemeProvider } from "./board-theme";
import { PixiAppProvider } from "./pixi-app";
import { StoriesBoard } from "./stories-board";

type PixiStageProps = {
  canvas: HTMLCanvasElement;
};

export const PixiStage: Component<PixiStageProps> = (props) => {
  return (
    <BoardThemeProvider>
      <TasksContextProvider>
        <PixiAppProvider canvas={props.canvas}>
          <TransformStateProvider>
            <SelectionContextProvider>
              <EdgeDrawingContextProvider>
                <StoriesBoard />
              </EdgeDrawingContextProvider>
            </SelectionContextProvider>
            <ZoomBar />
            <InsertTaskDialog />
          </TransformStateProvider>
        </PixiAppProvider>
      </TasksContextProvider>
    </BoardThemeProvider>
  );
};
