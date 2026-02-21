import { useNavigate } from "@solidjs/router";
import { decode } from "decode-formdata";
import { consumeInviteLink } from "jazz-tools";
import { createSignal, createUniqueId, type Component, type ComponentProps } from "solid-js";
import * as v from "valibot";
import { useI18n } from "~/integrations/i18n";
import { useJazzAccount } from "~/integrations/jazz/provider";
import { BoardSchema } from "~/integrations/jazz/schema";
import { createLink } from "~/integrations/router/create-link";
import { Button } from "~/ui/button/button";
import { parseFormValidationError, type FormIssues } from "~/ui/utils/forms";
import { AccountFields, AccountFieldsSchema } from "./account-fields";

export const AcceptInviteForm: Component = () => {
  const { t } = useI18n();

  const account = useJazzAccount();

  const navigate = useNavigate();

  const formId = createUniqueId();

  const [issues, setIssues] = createSignal<FormIssues>();

  const onSubmit: ComponentProps<"form">["onSubmit"] = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const parsed = await v.safeParseAsync(AccountFieldsSchema, decode(formData));

    if (!parsed.success) {
      setIssues(parseFormValidationError(parsed.issues));
      return;
    }

    const accountValue = account();

    accountValue.profile.$jazz.set("name", parsed.output.name);

    const result = await consumeInviteLink({
      inviteURL: globalThis.location.toString(),
      invitedObjectSchema: BoardSchema,
    });

    if (result) {
      navigate(createLink("/board/:boardId", { params: { boardId: result.valueID } }));
    }
  };

  return (
    <form id={formId} onSubmit={onSubmit} class="flex flex-col gap-2">
      <AccountFields issues={issues()} />
      <Button color="primary" form={formId} type="submit">
        {t("board.invite.acceptInvite")}
      </Button>
    </form>
  );
};
