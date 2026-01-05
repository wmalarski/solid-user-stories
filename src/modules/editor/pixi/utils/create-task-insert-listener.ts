import type { FederatedPointerEvent } from "pixi.js";
import { onCleanup, onMount } from "solid-js";
import { RIGHT_BUTTON } from "../../utils/constants";
import { useTaskContainer } from "../pixi-app";

type CreateTaskInsertListenerArgs = {
  onDoubleClick: (event: FederatedPointerEvent) => void;
};

export const createTaskInsertListener = (args: CreateTaskInsertListenerArgs) => {
  const container = useTaskContainer();

  const onPointerDown = (event: FederatedPointerEvent) => {
    if (event.target === container && event.button !== RIGHT_BUTTON && event.detail === 2) {
      args.onDoubleClick(event);
    }
  };

  onMount(() => {
    container.on("click", onPointerDown);
  });

  onCleanup(() => {
    container.off("click", onPointerDown);
  });
};
