import { Key } from "@solid-primitives/keyed";
import { A } from "@solidjs/router";
import { Show, Suspense, type Component } from "solid-js";
import { createJazzResource } from "~/integrations/jazz/create-jazz-resource";
import { useJazzAccount } from "~/integrations/jazz/provider";
import { BoardSchema, BoardsListSchema } from "~/integrations/jazz/schema";
import { createLink } from "~/integrations/router/create-link";
import { List, ListColumn, ListRow } from "~/ui/list/list";
import { DeleteBoardDialog } from "./delete-board-dialog";
import { UpdateBoardDialog } from "./update-board-dialog";

export const BoardTable: Component = () => {
  const account = useJazzAccount();

  const boards = createJazzResource(() => ({
    id: account().root.boards.$jazz.id,
    options: { resolve: true },
    schema: BoardsListSchema,
  }));

  return (
    <Suspense>
      <List>
        <Key each={boards()} by={(board) => board.$jazz.id}>
          {(board) => <BoardTableItem boardId={board().$jazz.id} />}
        </Key>
      </List>
    </Suspense>
  );
};

type BoardTableItemProps = {
  boardId: string;
};

const BoardTableItem: Component<BoardTableItemProps> = (props) => {
  const board = createJazzResource(() => ({
    id: props.boardId,
    schema: BoardSchema,
  }));

  return (
    <Suspense fallback="Suspense">
      <Show when={board()} fallback="Show">
        {(board) => (
          <ListRow>
            <ListColumn grow class="grid grid-cols-1 justify-items-start">
              <A
                class="text-lg"
                href={createLink("/board/:boardId", { params: { boardId: props.boardId } })}
              >
                {board().title}
              </A>
              <span class="text-sm opacity-70">{board().description}</span>
            </ListColumn>
            <ListColumn class="flex gap-1">
              <UpdateBoardDialog board={board()} />
              <DeleteBoardDialog boardId={board().$jazz.id} />
            </ListColumn>
          </ListRow>
        )}
      </Show>
    </Suspense>
  );
};
