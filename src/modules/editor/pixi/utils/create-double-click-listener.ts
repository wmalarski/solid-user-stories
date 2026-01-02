import type { Container, FederatedMouseEvent } from "pixi.js";
import { onCleanup, onMount } from "solid-js";

type CreateDoubleClickListenerArgs = {
  displayObject: Container;
  onDoubleClick: (event: FederatedMouseEvent) => void;
};

export const createDoubleClickListener = (args: CreateDoubleClickListenerArgs) => {
  const onPointerDown = (event: FederatedMouseEvent) => {
    if (event.detail === 2) {
      args.onDoubleClick(event);
    }
  };

  onMount(() => {
    args.displayObject.on("pointerdown", onPointerDown);
  });

  onCleanup(() => {
    args.displayObject.off("pointerdown", onPointerDown);
  });
};
