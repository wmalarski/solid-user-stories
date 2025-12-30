import { Route, Router } from "@solidjs/router";
import type { Component } from "solid-js";
import { BoardRoute } from "./modules/board/board-route";
import { HomeRoute } from "./modules/home/home-route";

export const App: Component = () => (
  <>
    <Router>
      <Route path="/" component={HomeRoute} />
      <Route path="/board/:boardId" component={BoardRoute} />
    </Router>
  </>
);
