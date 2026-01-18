import { A, useNavigate } from "@solidjs/router";
import { useLiveQuery } from "@tanstack/solid-db";
import { For, type Component } from "solid-js";
import { createLink } from "~/integrations/router/create-link";
import { boardsCollection } from "~/integrations/tanstack-db/collections";
import { createId } from "~/integrations/tanstack-db/create-id";
import { Button } from "~/ui/button/button";

export const HomeRoute: Component = () => {
  const navigate = useNavigate();

  const onAddClick = async () => {
    const boardId = createId();
    const tx = boardsCollection.insert({
      description: "description",
      id: boardId,
      title: "Title1",
      user: "1",
    });

    await tx.isPersisted.promise;

    navigate(createLink("/board/:boardId", { params: { boardId } }));
  };

  return (
    <div>
      <h1 class="text-2xl text-red-900">Hello world!!!!</h1>
      <button class="btn">AA</button>
      <span>Homepage</span>
      <A href={createLink("/board/:boardId", { params: { boardId: "3" } })}>Board</A>
      <Button onClick={onAddClick}>Add board</Button>
      <BoardList />
    </div>
  );
};

const BoardList: Component = () => {
  const boards = useLiveQuery((q) => q.from({ board: boardsCollection }));

  return (
    <For each={boards()}>
      {(board) => (
        <A href={createLink("/board/:boardId", { params: { boardId: board.id } })}>{board.title}</A>
      )}
    </For>
  );
};
