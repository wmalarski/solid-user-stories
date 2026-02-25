import { createMemo, type Component, type ComponentProps } from "solid-js";
import { SNAP_SIZE } from "../utils/constants";

const sharedProps: ComponentProps<"line"> = {
  class: "stroke-base-content",
  "stroke-dasharray": "2,2",
  "stroke-opacity": 0.5,
  "stroke-width": 1,
};

type SnapLinesProps = {
  x: number;
  y: number;
};

export const SnapLines: Component<SnapLinesProps> = (props) => {
  const x = createMemo(() => Math.floor(props.x / SNAP_SIZE) * SNAP_SIZE);
  const y = createMemo(() => Math.floor(props.y / SNAP_SIZE) * SNAP_SIZE);

  return (
    <>
      <line x1={0} x2="100%" y1={y()} y2={y()} {...sharedProps} />
      <line y1={0} y2="100%" x1={x()} x2={x()} {...sharedProps} />
    </>
  );
};
