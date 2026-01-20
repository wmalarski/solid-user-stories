import { type Component, splitProps } from "solid-js";
import type { ComponentVariantProps } from "../utils/types";
import { badgeRecipe } from "./badge.recipe";

export type BadgeProps = ComponentVariantProps<"div", typeof badgeRecipe>;

export const Badge: Component<BadgeProps> = (props) => {
  const [variants, withoutVariants] = splitProps(props, ["size", "color", "style"]);

  return <div {...withoutVariants} class={badgeRecipe({ ...variants, class: props.class })} />;
};
