import type { Component } from "solid-js";
import { AxisContainer } from "./axis-container";
import { useStageTransform } from "./use-stage-transform";

export const StoriesBoard: Component = () => {
  useStageTransform();

  return (
    <>
      <AxisContainer />
    </>
  );
};
