import { splitProps, type Component, type ComponentProps } from "solid-js";
import { cx } from "tailwind-variants";

type SelectablePathProps = ComponentProps<"path"> & {
  isSelected: boolean;
};

export const SelectablePath: Component<SelectablePathProps> = (props) => {
  const [splitted, rest] = splitProps(props, ["isSelected"]);

  return (
    <path
      fill="none"
      stroke-width={16}
      {...rest}
      class={cx(
        {
          "stroke-accent opacity-5": splitted.isSelected,
          "stroke-transparent": !splitted.isSelected,
        },
        props.class,
      )}
    />
  );
};
