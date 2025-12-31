import type { Component, ParentProps } from "solid-js";
import { cx } from "tailwind-variants";

type ToolContainerProps = ParentProps<{
  class: string;
}>;

export const ToolContainer: Component<ToolContainerProps> = (props) => {
  return (
    <div class={cx("absolute flex gap-1 rounded-3xl bg-base-300 p-1 shadow-lg", props.class)}>
      {props.children}
    </div>
  );
};
