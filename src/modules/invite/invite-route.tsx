import { useLocation, useNavigate } from "@solidjs/router";
import { consumeInviteLink } from "jazz-tools";
import type { Component } from "solid-js";
import { useI18n } from "~/integrations/i18n";
import { BoardSchema } from "~/integrations/jazz/schema";
import { createLink } from "~/integrations/router/create-link";
import { Button } from "~/ui/button/button";

export const InviteRoute: Component = () => {
  const { t } = useI18n();

  const location = useLocation();

  const navigate = useNavigate();

  const onClick = async () => {
    const hash = location.hash;

    const result = await consumeInviteLink({
      inviteURL: hash,
      invitedObjectSchema: BoardSchema,
    });

    console.log("[result]", result);

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
