import { type Component, splitProps } from "solid-js";
import type { ComponentVariantProps } from "../utils/types";
import { dividerRecipe } from "./divider.recipe";

export type DividerProps = ComponentVariantProps<"div", typeof dividerRecipe>;

export const Divider: Component<DividerProps> = (props) => {
  const [variants, withoutVariants] = splitProps(props, ["direction", "color", "placement"]);

  return <div {...withoutVariants} class={dividerRecipe({ ...variants, class: props.class })} />;
};
