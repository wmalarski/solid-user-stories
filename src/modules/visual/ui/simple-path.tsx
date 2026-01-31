import type { Component, ComponentProps } from "solid-js";
import { cx } from "tailwind-variants";

export const SimplePath: Component<ComponentProps<"path">> = (props) => {
  return (
    <path
      fill="none"
      stroke-width={2}
      marker-end="url(#arrow)"
      {...props}
      class={cx("stroke-accent opacity-90", props.class)}
    />
  );
};
