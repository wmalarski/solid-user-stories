import type { Component } from "solid-js";
import { useI18n } from "~/integrations/i18n";
import { WithJazz } from "~/integrations/jazz/provider";
import { BoardTable } from "../boards/board-table";
import { InsertBoardDialog } from "../boards/insert-board-dialog";

export const HomeRoute: Component = () => {
  const { t } = useI18n();

  return (
    <div class="mx-auto flex flex-col gap-4 p-4 max-w-md">
      <h1 class="w-full text-center text-4xl font-semibold uppercase">{t("info.title")}</h1>
      <WithJazz>
        <BoardTable />
        <InsertBoardDialog />
      </WithJazz>
    </div>
  );
};
