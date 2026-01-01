import type { Component } from "solid-js";
import { ZoomBar } from "../components/zoom-bar";
import { EdgeDrawingStateContextProvider } from "../contexts/edge-drawing-context";
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
      <PixiAppProvider canvas={props.canvas}>
        <TransformStateProvider>
          <EdgeDrawingStateContextProvider>
            <StoriesBoard />
          </EdgeDrawingStateContextProvider>
          <ZoomBar />
        </TransformStateProvider>
      </PixiAppProvider>
    </BoardThemeProvider>
  );
};
