import { type Component, type ComponentProps, Show, splitProps } from "solid-js";
import { fieldErrorRecipe } from "./field-error.recipe";

export type FieldErrorProps = Omit<ComponentProps<"span">, "children"> & {
  message?: string;
  id: string;
};

export const FieldError: Component<FieldErrorProps> = (props) => {
  const [variants, withoutVariants] = splitProps(props, ["message"]);

  return (
    <Show when={variants.message}>
      <span role="alert" {...withoutVariants} class={fieldErrorRecipe({ class: props.class })}>
        {variants.message}
      </span>
    </Show>
  );
};
