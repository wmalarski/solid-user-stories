import { useLocation, useNavigate } from "@solidjs/router";
import { consumeInviteLink } from "jazz-tools";
import { createResource, type Component } from "solid-js";
import { useI18n } from "~/integrations/i18n";
import { BoardSchema } from "~/integrations/jazz/schema";
import { createLink } from "~/integrations/router/create-link";

export const InviteRoute: Component = () => {
  const { t } = useI18n();

  const location = useLocation();

  const navigate = useNavigate();

  createResource(
    () => ({ hash: location.hash }),
    async ({ hash }) => {
      const result = await consumeInviteLink({
        inviteURL: hash,
        invitedObjectSchema: BoardSchema,
      });

      console.log("[result]", result);

      if (result) {
        navigate(createLink("/board/:boardId", { params: { boardId: result.valueID } }));
      }
    },
  );

  return (
    <div class="mx-auto flex flex-col gap-4 p-4 max-w-md">
      <h1 class="w-full text-center text-4xl font-semibold uppercase">{t("info.title")}</h1>
      <span>{t("common.loading")}</span>
    </div>
  );
};
