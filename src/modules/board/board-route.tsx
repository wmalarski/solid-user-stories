import { Navigate, useParams } from "@solidjs/router";
import { eq, useLiveQuery } from "@tanstack/solid-db";
import { createMemo, Show, Suspense, type Component } from "solid-js";
import { createLink } from "~/integrations/router/create-link";
import { boardsCollection } from "~/integrations/tanstack-db/collections";
import { Editor } from "../editor/components/editor";

export const BoardRoute: Component = () => {
  const params = useParams();
  const boardId = createMemo(() => params.boardId || "");

  const board = useLiveQuery((q) =>
    q
      .from({ board: boardsCollection })
      .where(({ board }) => eq(board.id, boardId()))
      .findOne(),
  );

  return (
    <Show when={board.data.at(0)} fallback={<Navigate href={createLink("/404", {})} />}>
      {(board) => (
        <Suspense>
          <Editor board={board()} />
        </Suspense>
      )}
    </Show>
  );
};
