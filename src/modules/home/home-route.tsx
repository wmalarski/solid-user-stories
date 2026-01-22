import { A } from "@solidjs/router";
import { useLiveQuery } from "@tanstack/solid-db";
import { For, type Component } from "solid-js";
import { createLink } from "~/integrations/router/create-link";
import { boardsCollection } from "~/integrations/tanstack-db/collections";
import { InsertBoardDialog } from "../boards/insert-board-dialog";

export const HomeRoute: Component = () => {
  return (
    <div>
      <InsertBoardDialog />
      <BoardList />
    </div>
  );
};

const BoardList: Component = () => {
  const boards = useLiveQuery((q) => q.from({ board: boardsCollection }));

  return (
    <ul class="flex flex-col gap-2">
      <For each={boards()}>
        {(board) => (
          <li>
            <A href={createLink("/board/:boardId", { params: { boardId: board.id } })}>
              {board.title}
            </A>
          </li>
        )}
      </For>
    </ul>
  );
};
