import { Key } from "@solid-primitives/keyed";
import { A } from "@solidjs/router";
import { Show, Suspense, type Component } from "solid-js";
import { createJazzResourceSubscription } from "~/integrations/jazz/create-jazz-resource-subscription";
import { useJazzAccount } from "~/integrations/jazz/provider";
import { BoardSchema, BoardsListSchema } from "~/integrations/jazz/schema";
import { createLink } from "~/integrations/router/create-link";
import { List, ListColumn, ListRow } from "~/ui/list/list";
import { DeleteBoardDialog } from "./delete-board-dialog";
import { UpdateBoardDialog } from "./update-board-dialog";

type BoardTableItemProps = {
  boardId: string;
};

const BoardTableItem: Component<BoardTableItemProps> = (props) => {
  const board = createJazzResourceSubscription(() => ({
    id: props.boardId,
    key: "BOARD_ITEM",
    options: { resolve: false },
    schema: BoardSchema,
  }));

  return (
    <Suspense fallback="Suspense">
      <Show when={board()} fallback="Show">
        {(resolvedBoard) => (
          <ListRow>
            <ListColumn grow class="grid grid-cols-1 justify-items-start">
              <A
                class="text-lg"
                href={createLink("/board/:boardId", { params: { boardId: props.boardId } })}
              >
                {resolvedBoard().title}
              </A>
              <span class="text-sm opacity-70">{resolvedBoard().description}</span>
            </ListColumn>
            <ListColumn class="flex gap-1">
              <UpdateBoardDialog board={resolvedBoard()} />
              <DeleteBoardDialog boardId={resolvedBoard().$jazz.id} />
            </ListColumn>
          </ListRow>
        )}
      </Show>
    </Suspense>
  );
};

export const BoardTable: Component = () => {
  const account = useJazzAccount();

  const boards = createJazzResourceSubscription(() => ({
    id: account().root.boards.$jazz.id,
    key: "BOARD_LIST",
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
