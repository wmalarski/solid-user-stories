import { type Component, splitProps } from "solid-js";
import type { ComponentVariantProps } from "../utils/types";
import { inputRecipe } from "./input.recipe";

const variantPropsList = ["color", "size", "variant", "width"] as const;

type InputProps = ComponentVariantProps<"input", typeof inputRecipe>;

export const Input: Component<InputProps> = (props) => {
  const [variants, withoutVariants] = splitProps(props, variantPropsList);

  return (
    <input
      autocomplete="off"
      autocorrect="off"
      {...withoutVariants}
      class={inputRecipe({ ...variants, class: props.class })}
    />
  );
};
