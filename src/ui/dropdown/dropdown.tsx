import { type Component, splitProps } from "solid-js";
import type { ComponentVariantProps } from "../utils/types";
import { dropdownContentRecipe, dropdownRecipe } from "./dropdown.recipe";

const dropdownSplitProps = ["align", "close", "hover", "open", "placement"] as const;

export type DropdownProps = ComponentVariantProps<"div", typeof dropdownRecipe>;

export const Dropdown: Component<DropdownProps> = (props) => {
  const [variants, withoutVariants] = splitProps(props, dropdownSplitProps);

  return <div {...withoutVariants} class={dropdownRecipe({ ...variants, class: props.class })} />;
};

export type DropdownContentProps = ComponentVariantProps<"ul", typeof dropdownContentRecipe>;

export const DropdownContent: Component<DropdownContentProps> = (props) => {
  return <ul tabindex="-1" {...props} class={dropdownContentRecipe({ class: props.class })} />;
};
