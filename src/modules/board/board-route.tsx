import { useParams } from "@solidjs/router";
import { createMemo, type Component } from "solid-js";

export const BoardRoute: Component = () => {
  const params = useParams();
  const boardId = createMemo(() => params.boardId || "");

  return (
    <div>
      <h1 class="text-2xl text-red-900">Hello world!!!!</h1>
      <button class="btn">AA</button>
      <span>BoardRoute</span>
      <span>{boardId()}</span>
    </div>
  );
};
