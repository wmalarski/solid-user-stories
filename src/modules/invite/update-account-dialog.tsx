import { decode } from "decode-formdata";
import { createSignal, createUniqueId, type Component, type ComponentProps } from "solid-js";
import * as v from "valibot";
import { useI18n } from "~/integrations/i18n";
import { useJazzAccount } from "~/integrations/jazz/provider";
import { Button } from "~/ui/button/button";
import {
  closeDialog,
  Dialog,
  DialogActions,
  DialogBackdrop,
  DialogBox,
  DialogClose,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "~/ui/dialog/dialog";
import { ProfileIcon } from "~/ui/icons/profile-icon";
import { parseFormValidationError, type FormIssues } from "~/ui/utils/forms";
import { AccountFields, AccountFieldsSchema } from "./account-fields";

type UpdateAccountDialogProps = {
  onClose?: () => void;
  onOpen?: () => void;
};

export const UpdateAccountDialog: Component<UpdateAccountDialogProps> = (props) => {
  const { t } = useI18n();

  const account = useJazzAccount();

  const formId = createUniqueId();
  const dialogId = createUniqueId();

  const [issues, setIssues] = createSignal<FormIssues>();

  const onSubmit: ComponentProps<"form">["onSubmit"] = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const parsed = await v.safeParseAsync(AccountFieldsSchema, decode(formData));

    if (!parsed.success) {
      setIssues(parseFormValidationError(parsed.issues));
      return;
    }

    account().profile.$jazz.set("name", parsed.output.name);

    closeDialog(dialogId);
  };

  return (
    <>
      <DialogTrigger
        aria-label={t("board.account.update")}
        shape="circle"
        size="sm"
        for={dialogId}
        onClick={props.onOpen}
      >
        <ProfileIcon class="size-5" />
      </DialogTrigger>
      <Dialog onClose={props.onClose} id={dialogId}>
        <DialogBox>
          <DialogTitle>{t("board.account.update")}</DialogTitle>
          <DialogDescription>{t("board.account.updateDescription")}</DialogDescription>
          <form id={formId} onSubmit={onSubmit}>
            <AccountFields initialValues={{ name: account().profile.name }} issues={issues()} />
          </form>
          <DialogActions>
            <DialogClose />
            <Button color="primary" form={formId} type="submit">
              {t("common.update")}
            </Button>
          </DialogActions>
        </DialogBox>
        <DialogBackdrop />
      </Dialog>
    </>
  );
};
