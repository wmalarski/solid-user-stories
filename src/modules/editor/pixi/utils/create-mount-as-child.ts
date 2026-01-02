import type { Container } from "pixi.js";
import { onCleanup, onMount } from "solid-js";

export const createMountAsChild = (parent: Container, child: Container) => {
  onMount(() => {
    parent.addChild(child);
  });

  onCleanup(() => {
    parent.removeChild(child);
  });
};
