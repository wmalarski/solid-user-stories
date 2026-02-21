import type { Component } from "solid-js";
import { useI18n } from "~/integrations/i18n";
import { WithJazz } from "~/integrations/jazz/provider";
import { AcceptInviteForm } from "./accept-invite-form";

export const InviteRoute: Component = () => {
  const { t } = useI18n();

  return (
    <div class="mx-auto flex flex-col gap-4 p-4 max-w-md">
      <h1 class="w-full text-center text-4xl font-semibold uppercase">{t("info.title")}</h1>
      <WithJazz>
        <AcceptInviteForm />
      </WithJazz>
    </div>
  );
};
