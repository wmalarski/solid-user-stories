import type { Container } from "pixi.js";
import { createMemo, onCleanup, onMount, type Accessor } from "solid-js";

export const createMountAsChild = (parent: Container | Accessor<Container>, child: Container) => {
  const parentContainer = createMemo(() => {
    return typeof parent === "function" ? parent() : parent;
  });

  onMount(() => {
    parentContainer().addChild(child);
  });

  onCleanup(() => {
    parentContainer().removeChild(child);
  });
};
