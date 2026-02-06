import { createEffect, type Component } from "solid-js";
import { useJazzCurrentAccount } from "~/integrations/jazz/provider";

export const BoardTable: Component = () => {
  const account = useJazzCurrentAccount();

  createEffect(() => {
    account()?.root.$jazz;
  });

  return <pre>Hello</pre>;
};

//
// type BoardTableItemProps = {
//   board: BoardModel;
// };

// const BoardTableItem: Component<BoardTableItemProps> = (props) => {
//   return (
//     <ListRow>
//       <ListColumn grow class="grid grid-cols-1 justify-items-start">
//         <A
//           class="text-lg"
//           href={createLink("/board/:boardId", { params: { boardId: props.board.id } })}
//         >
//           {props.board.title}
//         </A>
//         <span class="text-sm opacity-70">{props.board.description}</span>
//       </ListColumn>
//       <ListColumn class="flex gap-1">
//         <UpdateBoardDialog board={props.board} />
//         <DeleteBoardDialog board={props.board} />
//       </ListColumn>
//     </ListRow>
//   );
// };
