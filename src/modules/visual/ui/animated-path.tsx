import type { Component, ComponentProps } from "solid-js";

export const AnimatedPath: Component<ComponentProps<"path">> = (props) => {
  return (
    <path
      class="stroke-accent"
      fill="none"
      stroke-dasharray="5,5"
      marker-end="url(#arrow)"
      {...props}
    >
      <animate
        attributeName="stroke-dashoffset"
        values="10;0"
        dur="0.5s"
        repeatCount="indefinite"
      />
    </path>
  );
};
