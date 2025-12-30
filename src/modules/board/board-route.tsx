import { useParams } from "@solidjs/router";
import { createMemo, Suspense, type Component } from "solid-js";
import { Editor } from "../editor/components/editor";

export const BoardRoute: Component = () => {
  const params = useParams();
  const boardId = createMemo(() => params.boardId || "");

  return (
    <div>
      <h1 class="text-2xl text-red-900">Hello world!!!!</h1>
      <button class="btn">AA</button>
      <span>BoardRoute</span>
      <Suspense>
        <Editor boardId={boardId()} />
      </Suspense>
    </div>
  );
};
