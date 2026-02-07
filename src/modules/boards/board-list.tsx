import { A } from "@solidjs/router";
import { useLiveQuery } from "@tanstack/solid-db";
import { For, type Component } from "solid-js";
import { createLink } from "~/integrations/router/create-link";
import { useTanstackDbContext } from "~/integrations/tanstack-db/provider";
import type { BoardModel } from "~/integrations/tanstack-db/schema";
import { List, ListColumn, ListRow } from "~/ui/list/list";
import { UpdateBoardDialog } from "../boards/update-board-dialog";
import { DeleteBoardDialog } from "./delete-board-dialog";

export const BoardList: Component = () => {
  const { boardsCollection } = useTanstackDbContext();

  const boards = useLiveQuery((q) => q.from({ board: boardsCollection }));

  return (
    <List>
      <For each={boards()}>{(board) => <BoardListItem board={board} />}</For>
    </List>
  );
};

type BoardListItemProps = {
  board: BoardModel;
};

const BoardListItem: Component<BoardListItemProps> = (props) => {
  return (
    <ListRow>
      <ListColumn grow class="grid grid-cols-1 justify-items-start">
        <A
          class="text-lg"
          href={createLink("/board/:boardId", { params: { boardId: props.board.id } })}
        >
          {props.board.title}
        </A>
        <span class="text-sm opacity-70">{props.board.description}</span>
      </ListColumn>
      <ListColumn class="flex gap-1">
        <UpdateBoardDialog board={props.board} />
        <DeleteBoardDialog board={props.board} boardId="" rootId="" />
      </ListColumn>
    </ListRow>
  );
};
