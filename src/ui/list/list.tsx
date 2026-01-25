import { type Component, splitProps } from "solid-js";
import type { ComponentVariantProps } from "../utils/types";
import { listColumnRecipe, listRecipe, listRowRecipe } from "./list.recipe";

export type ListProps = ComponentVariantProps<"ul", typeof listRecipe>;

export const List: Component<ListProps> = (props) => {
  return <ul {...props} class={listRecipe({ class: props.class })} />;
};

export type ListRowProps = ComponentVariantProps<"li", typeof listRowRecipe>;

export const ListRow: Component<ListRowProps> = (props) => {
  return <li {...props} class={listRowRecipe({ class: props.class })} />;
};

export type ListColumnProps = ComponentVariantProps<"div", typeof listColumnRecipe>;

export const ListColumn: Component<ListColumnProps> = (props) => {
  const [variants, withoutVariants] = splitProps(props, ["grow", "wrap"]);
  return <div {...withoutVariants} class={listColumnRecipe({ class: props.class, ...variants })} />;
};
