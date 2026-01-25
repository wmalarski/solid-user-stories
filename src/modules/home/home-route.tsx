import type { Component } from "solid-js";
import { useI18n } from "~/integrations/i18n";
import { BoardList } from "../boards/board-list";
import { InsertBoardDialog } from "../boards/insert-board-dialog";

export const HomeRoute: Component = () => {
  const { t } = useI18n();

  return (
    <div class="mx-auto flex flex-col gap-4 p-4 max-w-md">
      <h1 class="w-full text-center text-4xl font-semibold uppercase">{t("info.title")}</h1>
      <BoardList />
      {/* <Button
        onClick={() => {
          sectionCollection.utils.clearStorage();
          boardsCollection.utils.clearStorage();
          taskCollection.utils.clearStorage();
          edgeCollection.utils.clearStorage();
          }}
          >
          Clear
          </Button> */}
      <InsertBoardDialog />
    </div>
  );
};
