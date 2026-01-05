import { Application, Container } from "pixi.js";
import {
  type Component,
  type ParentProps,
  createContext,
  createResource,
  onCleanup,
  onMount,
  untrack,
  useContext,
} from "solid-js";
import { useBoardTheme } from "./board-theme";
import { createMountAsChild } from "./utils/create-mount-as-child";

const PixiAppContext = createContext<Application>({} as unknown as Application);

const ContainerContext = createContext<Container>({} as unknown as Container);

const TaskContainerContext = createContext<Container>({} as unknown as Container);

export const usePixiApp = () => {
  return useContext(PixiAppContext);
};

export const usePixiContainer = () => {
  return useContext(ContainerContext);
};

export const useTaskContainer = () => {
  return useContext(TaskContainerContext);
};

type PixiAppProviderProps = ParentProps<{
  canvas: HTMLCanvasElement;
}>;

export const PixiAppProvider: Component<PixiAppProviderProps> = (props) => {
  const boardTheme = useBoardTheme();

  const app = new Application();

  const hitArea = {
    contains() {
      return true;
    },
  };

  const container = new Container({ hitArea });
  createMountAsChild(app.stage, container);

  const taskContainer = new Container({ hitArea, parent: container });

  createResource(async () => {
    await app.init({
      antialias: true,
      backgroundColor: untrack(boardTheme).backgroundDarkColor,
      canvas: props.canvas,
      eventMode: "static",
      height: window.innerHeight,
      width: window.innerWidth,
    });

    app.stage.hitArea = hitArea;
    app.renderer.resize(window.innerWidth, window.innerHeight);
  });

  const onResize = () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
  };

  onMount(() => {
    window.addEventListener("resize", onResize);
  });

  onCleanup(() => {
    window.removeEventListener("resize", onResize);
  });

  return (
    <PixiAppContext.Provider value={app}>
      <ContainerContext.Provider value={container}>
        <TaskContainerContext.Provider value={taskContainer}>
          {props.children}
        </TaskContainerContext.Provider>
      </ContainerContext.Provider>
    </PixiAppContext.Provider>
  );
};
