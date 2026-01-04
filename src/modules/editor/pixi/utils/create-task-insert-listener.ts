import type { FederatedPointerEvent } from "pixi.js";
import { RIGHT_BUTTON } from "../../utils/constants";
import { usePixiContainer } from "../pixi-app";
import { createPointerListeners } from "./create-pointer-listeners";

type CreateTaskInsertListenerArgs = {
  onDoubleClick: (event: FederatedPointerEvent) => void;
};

export const createTaskInsertListener = (args: CreateTaskInsertListenerArgs) => {
  const container = usePixiContainer();

  createPointerListeners(container, {
    onPointerDown: (event: FederatedPointerEvent) => {
      if (event.target === container && event.button !== RIGHT_BUTTON && event.detail === 2) {
        args.onDoubleClick(event);
      }
    },
  });
};
