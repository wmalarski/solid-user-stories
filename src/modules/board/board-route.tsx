import { useParams } from "@solidjs/router";
import { createMemo, Suspense, type Component } from "solid-js";
import { Editor } from "../editor/components/editor";

export const BoardRoute: Component = () => {
  const params = useParams();
  const boardId = createMemo(() => params.boardId || "");

  return (
    <Suspense>
      <Editor boardId={boardId()} />
    </Suspense>
  );
};
