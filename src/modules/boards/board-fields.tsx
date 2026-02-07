import type { Component } from "solid-js";
import * as v from "valibot";
import { useI18n } from "~/integrations/i18n";
import type { BoardInstance } from "~/integrations/jazz/schema";
import { FieldError } from "~/ui/field-error/field-error";
import { Fieldset, FieldsetLabel } from "~/ui/fieldset/fieldset";
import { FormError } from "~/ui/form-error/form-error";
import { Input } from "~/ui/input/input";
import { getInvalidStateProps, type FormIssues } from "~/ui/utils/forms";

export const BoardFieldsSchema = v.object({
  description: v.string(),
  title: v.string(),
});

type BoardFieldsProps = {
  pending?: boolean;
  issues?: FormIssues;
  initialValues?: Partial<BoardInstance>;
};

export const BoardFields: Component<BoardFieldsProps> = (props) => {
  const { t } = useI18n();

  return (
    <Fieldset>
      <FormError message={props.issues?.error} />

      <FieldsetLabel for="title">{t("board.forms.title")}</FieldsetLabel>
      <Input
        disabled={props.pending}
        id="title"
        name="title"
        required={true}
        width="full"
        value={props.initialValues?.title}
        {...getInvalidStateProps({
          errorMessageId: "title-error",
          isInvalid: Boolean(props.issues?.errors?.title),
        })}
      />
      <FieldError id="title-error" message={props.issues?.errors?.title} />

      <FieldsetLabel for="description">{t("board.forms.description")}</FieldsetLabel>
      <Input
        disabled={props.pending}
        id="description"
        name="description"
        required={true}
        width="full"
        value={props.initialValues?.description}
        {...getInvalidStateProps({
          errorMessageId: "description-error",
          isInvalid: Boolean(props.issues?.errors?.description),
        })}
      />
      <FieldError id="description-error" message={props.issues?.errors?.description} />
    </Fieldset>
  );
};
