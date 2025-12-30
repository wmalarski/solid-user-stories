import { type Component, createSignal, lazy, Show } from "solid-js";

const PixiStage = lazy(() =>
  // oxlint-disable-next-line prefer-await-to-then
  import("../pixi/pixi-stage").then((module) => ({
    default: module.PixiStage,
  })),
);

type EditorProps = {
  boardId: string;
};

export const Editor: Component<EditorProps> = () => {
  return <ClientBoard />;
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
