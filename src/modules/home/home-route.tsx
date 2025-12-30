import { A } from "@solidjs/router";
import type { Component } from "solid-js";
import { createLink } from "~/integrations/router/create-link";

export const HomeRoute: Component = () => {
  return (
    <div>
      <h1 class="text-2xl text-red-900">Hello world!!!!</h1>
      <button class="btn">AA</button>
      <span>Homepage</span>
      <A href={createLink("/board/:boardId", { params: { boardId: "3" } })}>Board</A>
    </div>
  );
};
