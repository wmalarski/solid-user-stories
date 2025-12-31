import { type Component, createSignal, lazy, Show } from "solid-js";
import type { BoardModel } from "~/integrations/tanstack-db/schema";
import { BoardContextProvider } from "../contexts/board-context";

const PixiStage = lazy(() =>
  // oxlint-disable-next-line prefer-await-to-then
  import("../pixi/pixi-stage").then((module) => ({
    default: module.PixiStage,
  })),
);

type EditorProps = {
  board: BoardModel;
};

export const Editor: Component<EditorProps> = (props) => {
  return (
    <BoardContextProvider board={props.board}>
      <ClientBoard />
    </BoardContextProvider>
  );
};

const ClientBoard: Component = () => {
  const [canvas, setCanvas] = createSignal<HTMLCanvasElement>();

  return (
    <>
      <canvas class="size-full bg-base-100" ref={setCanvas} />
      <Show when={canvas()}>{(canvas) => <PixiStage canvas={canvas()} />}</Show>
    </>
  );
};
