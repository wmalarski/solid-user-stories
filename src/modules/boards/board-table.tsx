import { A } from "@solidjs/router";
import {
  createEffect,
  createResource,
  For,
  onCleanup,
  Show,
  Suspense,
  type Component,
  type ComponentProps,
} from "solid-js";
import { useJazzCurrentAccount } from "~/integrations/jazz/provider";
import { BoardSchema, BoardsList } from "~/integrations/jazz/schema";
import { createLink } from "~/integrations/router/create-link";
import { createId } from "~/integrations/tanstack-db/create-id";
import { List, ListColumn, ListRow } from "~/ui/list/list";
import { DeleteBoardDialog } from "./delete-board-dialog";
import { UpdateBoardDialog } from "./update-board-dialog";

export const BoardTable: Component = () => {
  const account = useJazzCurrentAccount();

  return (
    <Show when={account()?.root.boards.$jazz.id}>
      {(boardsId) => <BoardTableWithAccount boardsId={boardsId()} />}
    </Show>
  );
};

type BoardTableWithAccountProps = {
  boardsId: string;
};

const BoardTableWithAccount: Component<BoardTableWithAccountProps> = (props) => {
  const [boards, { mutate }] = createResource(
    () => ({ id: props.boardsId }),
    async (args) => {
      const root = await BoardsList.load(args.id, { resolve: true });
      return root.$isLoaded ? root : null;
    },
  );

  createEffect(() => {
    onCleanup(
      BoardsList.subscribe(props.boardsId, (value) => {
        mutate(value);
      }),
    );
  });

  const onSubmit: ComponentProps<"form">["onSubmit"] = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    boards()?.$jazz.push({
      description: "desc",
      edges: [],
      id: createId(),
      sectionXOrder: [],
      sectionYOrder: [],
      sections: [],
      tasks: [],
      title: formData.get("title") as string,
      user: "",
    });

    event.currentTarget.reset();
  };

  return (
    <>
      <form onSubmit={onSubmit}>
        <input type="text" name="title" placeholder="Band name" />
        <button>Add</button>
      </form>
      <Suspense>
        <List>
          <For each={boards()}>
            {(board) => <BoardTableItem boardId={board.$jazz.id} boardsId={props.boardsId} />}
          </For>
        </List>
      </Suspense>
    </>
  );
};

type BoardTableItemProps = {
  boardId: string;
  boardsId: string;
};

const BoardTableItem: Component<BoardTableItemProps> = (props) => {
  const [board] = createResource(
    () => ({ boardId: props.boardId }),
    async (args) => {
      const board = await BoardSchema.load(args.boardId);
      return board.$isLoaded ? board : null;
    },
  );

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
              <DeleteBoardDialog
                board={board()}
                boardsId={props.boardsId}
                boardId={board().$jazz.id}
              />
            </ListColumn>
          </ListRow>
        )}
      </Show>
    </Suspense>
  );
};
