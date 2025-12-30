import type { ComponentProps, ValidComponent } from "solid-js";
import type { VariantProps } from "tailwind-variants";

export type ComponentVariantProps<
  T extends ValidComponent,
  // biome-ignore lint/suspicious/noExplicitAny: library code
  Component extends (...args: any) => any,
  // biome-ignore lint/complexity/noBannedTypes: library code
  Rest = {},
> = ComponentProps<T> & VariantProps<Component> & Rest;
