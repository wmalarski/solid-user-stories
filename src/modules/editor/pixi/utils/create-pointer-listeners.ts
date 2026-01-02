import type { Container, FederatedPointerEvent } from "pixi.js";
import { onCleanup, onMount } from "solid-js";

type CreatePointerListenersArgs = {
  onPointerUp?: (event: FederatedPointerEvent) => void;
  onPointerMove?: (event: FederatedPointerEvent) => void;
  onPointerDown?: (event: FederatedPointerEvent) => void;
};

export const createPointerListeners = (
  displayObject: Container,
  args: CreatePointerListenersArgs,
) => {
  onMount(() => {
    if (args.onPointerUp) {
      displayObject.on("pointerup", args.onPointerUp);
    }
    if (args.onPointerMove) {
      displayObject.on("pointermove", args.onPointerMove);
    }
    if (args.onPointerDown) {
      displayObject.on("pointerdown", args.onPointerDown);
    }
  });

  onCleanup(() => {
    if (args.onPointerUp) {
      displayObject.off("pointerup", args.onPointerUp);
    }
    if (args.onPointerMove) {
      displayObject.off("pointermove", args.onPointerMove);
    }
    if (args.onPointerDown) {
      displayObject.off("pointerdown", args.onPointerDown);
    }
  });
};
