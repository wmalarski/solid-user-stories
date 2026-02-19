import { type Component, splitProps } from "solid-js";
import type { ComponentVariantProps } from "../utils/types";
import { avatarContentRecipe, avatarGroupRecipe, avatarRecipe } from "./avatar.recipe";

export type AvatarProps = ComponentVariantProps<"div", typeof avatarRecipe>;

export const Avatar: Component<AvatarProps> = (props) => {
  const [variants, withoutVariants] = splitProps(props, ["offline", "online", "placeholder"]);

  return <div {...withoutVariants} class={avatarRecipe({ ...variants, class: props.class })} />;
};

export type AvatarContentProps = ComponentVariantProps<"div", typeof avatarContentRecipe>;

export const AvatarContent: Component<AvatarContentProps> = (props) => {
  return <div {...props} class={avatarContentRecipe({ class: props.class })} />;
};

export type AvatarGroupProps = ComponentVariantProps<"div", typeof avatarGroupRecipe>;

export const AvatarGroup: Component<AvatarGroupProps> = (props) => {
  return <div {...props} class={avatarGroupRecipe({ class: props.class })} />;
};
