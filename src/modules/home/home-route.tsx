import { A } from "@solidjs/router";
import { useLiveQuery } from "@tanstack/solid-db";
import { For, type Component } from "solid-js";
import { createLink } from "~/integrations/router/create-link";
import {
  boardsCollection,
  edgeCollection,
  sectionCollection,
  taskCollection,
} from "~/integrations/tanstack-db/collections";
import { Button } from "~/ui/button/button";
import { InsertBoardDialog } from "../boards/insert-board-dialog";

export const HomeRoute: Component = () => {
  return (
    <div>
      <InsertBoardDialog />
      <BoardList />
      <Button
        onClick={() => {
          sectionCollection.utils.clearStorage();
          boardsCollection.utils.clearStorage();
          taskCollection.utils.clearStorage();
          edgeCollection.utils.clearStorage();
        }}
      >
        Clear
      </Button>
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
