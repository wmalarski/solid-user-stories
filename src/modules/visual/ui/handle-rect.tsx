import type { Component, ComponentProps } from "solid-js";
import { cx } from "tailwind-variants";

export const HandleRect: Component<ComponentProps<"rect">> = (props) => {
  return <rect {...props} class={cx("fill-accent", props.class)} />;
};
