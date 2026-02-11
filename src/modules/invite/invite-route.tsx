import { useNavigate } from "@solidjs/router";
import { consumeInviteLink } from "jazz-tools";
import type { Component } from "solid-js";
import { useI18n } from "~/integrations/i18n";
import { BoardSchema } from "~/integrations/jazz/schema";
import { createLink } from "~/integrations/router/create-link";
import { Button } from "~/ui/button/button";

export const InviteRoute: Component = () => {
  const { t } = useI18n();

  const navigate = useNavigate();

  const onClick = async () => {
    const result = await consumeInviteLink({
      inviteURL: globalThis.location.toString(),
      invitedObjectSchema: BoardSchema,
    });

    if (result) {
      navigate(createLink("/board/:boardId", { params: { boardId: result.valueID } }));
    }
  };

  return (
    <div class="mx-auto flex flex-col gap-4 p-4 max-w-md">
      <h1 class="w-full text-center text-4xl font-semibold uppercase">{t("info.title")}</h1>
      <Button onClick={onClick}>{t("board.invite.acceptInvite")}</Button>
    </div>
  );
};
