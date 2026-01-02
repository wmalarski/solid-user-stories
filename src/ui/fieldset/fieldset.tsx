import type { Component } from "solid-js";
import type { ComponentVariantProps } from "../utils/types";
import { fieldsetLabelRecipe, fieldsetLegendRecipe, fieldsetRecipe } from "./fieldset.recipe";

type FieldsetProps = ComponentVariantProps<"fieldset", typeof fieldsetRecipe>;

export const Fieldset: Component<FieldsetProps> = (props) => {
  return <fieldset {...props} class={fieldsetRecipe({ class: props.class })} />;
};

type FieldsetLabelProps = ComponentVariantProps<"label", typeof fieldsetLabelRecipe>;

export const FieldsetLabel: Component<FieldsetLabelProps> = (props) => {
  return (
    // oxlint-disable-next-line label-has-associated-control
    <label {...props} class={fieldsetLabelRecipe({ class: props.class })} />
  );
};

type FieldsetLegendProps = ComponentVariantProps<"legend", typeof fieldsetLegendRecipe>;

export const FieldsetLegend: Component<FieldsetLegendProps> = (props) => {
  return <legend {...props} class={fieldsetLegendRecipe({ class: props.class })} />;
};
