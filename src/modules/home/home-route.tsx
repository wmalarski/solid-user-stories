import type { Component } from "solid-js";
import { Comp } from "../../comp";

export const HomeRoute: Component = () => {
  return (
    <div>
      <h1 class="text-2xl text-red-900">Hello world!!!!</h1>
      <button class="btn">AA</button>
      <span>Homepage</span>
      <Comp />
    </div>
  );
};
