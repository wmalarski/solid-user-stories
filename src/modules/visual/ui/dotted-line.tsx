import type { Component, ComponentProps } from "solid-js";
import { cx } from "tailwind-variants";

export const DottedLine: Component<ComponentProps<"line">> = (props) => {
  return (
    <line
      stroke-dasharray="5,5"
      stroke-opacity={0.2}
      stroke-width={3}
      {...props}
      class={cx("stroke-base-content", props.class)}
    />
  );
};
