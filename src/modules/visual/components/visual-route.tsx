import { useParams } from "@solidjs/router";
import { eq, useLiveQuery } from "@tanstack/solid-db";
import { createMemo, Show, Suspense, type Component } from "solid-js";
import { boardsCollection } from "~/integrations/tanstack-db/collections";
import { VisualPanel } from "./visual-panel";

export const VisualRoute: Component = () => {
  const params = useParams();
  const boardId = createMemo(() => params.boardId ?? "");

  const board = useLiveQuery((q) =>
    q
      .from({ board: boardsCollection })
      .where(({ board }) => eq(board.id, boardId()))
      .findOne(),
  );

  return (
    <Suspense fallback={"Loading..."}>
      <Show when={board().at(0)} fallback={"No board..."}>
        {(board) => <VisualPanel board={board()} />}
      </Show>
    </Suspense>
  );
};
