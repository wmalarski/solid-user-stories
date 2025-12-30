import { A } from "@solidjs/router";
import { type Component, splitProps } from "solid-js";
import type { ComponentVariantProps } from "../utils/types";
import { buttonRecipe } from "./button.recipe";

const buttonSplitProps = ["behaviour", "color", "isLoading", "shape", "size", "variant"] as const;

export type ButtonProps = ComponentVariantProps<"button", typeof buttonRecipe>;

export const Button: Component<ButtonProps> = (props) => {
  const [variants, withoutVariants] = splitProps(props, buttonSplitProps);

  return <button {...withoutVariants} class={buttonRecipe({ ...variants, class: props.class })} />;
};

export type LinkButtonProps = ComponentVariantProps<typeof A, typeof buttonRecipe>;

export const LinkButton: Component<LinkButtonProps> = (props) => {
  const [variants, withoutVariants] = splitProps(props, buttonSplitProps);

  return <A {...withoutVariants} class={buttonRecipe({ ...variants, class: props.class })} />;
};
