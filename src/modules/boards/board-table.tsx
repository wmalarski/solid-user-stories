import { A } from "@solidjs/router";
import {
  createMemo,
  createResource,
  For,
  Show,
  Suspense,
  type Component,
  type ComponentProps,
} from "solid-js";
import { useJazzCurrentAccount } from "~/integrations/jazz/provider";
import { BoardSchema } from "~/integrations/jazz/schema";
import { createLink } from "~/integrations/router/create-link";
import { createId } from "~/integrations/tanstack-db/create-id";
import { List, ListColumn, ListRow } from "~/ui/list/list";
import { DeleteBoardDialog } from "./delete-board-dialog";
import { UpdateBoardDialog } from "./update-board-dialog";

export const BoardTable: Component = () => {
  const account = useJazzCurrentAccount();

  const boards = createMemo(() => {
    const accountValue = account();

    console.log("accountValue?.root?.$isLoaded", accountValue?.root?.$isLoaded);

    if (!accountValue?.root?.$isLoaded) {
      return null;
    }

    return accountValue.root.boards;
  });

  const onSubmit: ComponentProps<"form">["onSubmit"] = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const accountValue = account();

    console.log("[accountValue?.$isLoaded]", accountValue?.$isLoaded);
    console.log("[accountValue?.root?.$isLoaded]", accountValue?.root?.$isLoaded);

    if (accountValue?.root?.$isLoaded) {
      console.log("[accountValue?.root.boards.$isLoaded]", accountValue?.root?.boards.$isLoaded);
    }

    if (
      !accountValue?.$isLoaded ||
      !accountValue?.root?.$isLoaded ||
      !accountValue?.root?.boards.$isLoaded
    ) {
      return;
    }

    accountValue.root.boards.$jazz.push({
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
          <For each={boards()}>{(board) => <BoardTableItem boardId={board.$jazz.id} />}</For>
        </List>
      </Suspense>
    </>
  );
};

type BoardTableItemProps = {
  boardId: string;
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
              <DeleteBoardDialog board={board()} />
            </ListColumn>
          </ListRow>
        )}
      </Show>
    </Suspense>
  );
};
