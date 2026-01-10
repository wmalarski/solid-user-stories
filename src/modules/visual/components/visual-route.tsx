import { Navigate } from "@solidjs/router";
import { useLiveQuery } from "@tanstack/solid-db";
import { Show, Suspense, type Component } from "solid-js";
import { createLink } from "~/integrations/router/create-link";
import { boardsCollection } from "~/integrations/tanstack-db/collections";
import { VisualPanel } from "./visual-panel";

export const VisualRoute: Component = () => {
  //   const params = useParams();
  //   const boardId = createMemo(() => params.boardId || "");

  const board = useLiveQuery((q) => q.from({ board: boardsCollection }).findOne());

  return (
    <Show when={board.data.at(0)} fallback={<Navigate href={createLink("/404", {})} />}>
      {(board) => (
        <Suspense>
          <VisualPanel board={board()} />
        </Suspense>
      )}
    </Show>
  );
};
