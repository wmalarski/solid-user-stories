import { type Component, splitProps } from "solid-js";
import type { ComponentVariantProps } from "../utils/types";
import { tooltipContentRecipe, tooltipRecipe } from "./tooltip.recipe";

export type TooltipProps = ComponentVariantProps<"div", typeof tooltipRecipe>;

export const Tooltip: Component<TooltipProps> = (props) => {
  const [variants, withoutVariants] = splitProps(props, ["color", "open", "placement"]);

  return <div {...withoutVariants} class={tooltipRecipe({ ...variants, class: props.class })} />;
};

export type TooltipContentProps = ComponentVariantProps<"div", typeof tooltipContentRecipe>;

export const TooltipContent: Component<TooltipContentProps> = (props) => {
  return <div {...props} class={tooltipContentRecipe({ class: props.class })} />;
};
