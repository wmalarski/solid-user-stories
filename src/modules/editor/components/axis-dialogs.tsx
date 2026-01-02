import type { Component } from "solid-js";
import { useI18n } from "~/integrations/i18n";
import { FieldError } from "~/ui/field-error/field-error";
import { Fieldset, FieldsetLabel, FieldsetLegend } from "~/ui/fieldset/fieldset";
import { FormError } from "~/ui/form-error/form-error";
import { Input } from "~/ui/input/input";
import { type FormIssues, getInvalidStateProps } from "~/ui/utils/forms";

type AxisFieldsProps = {
  pending: boolean;
  issues?: FormIssues;
};

const AxisFields: Component<AxisFieldsProps> = (props) => {
  const { t } = useI18n();

  <Fieldset>
    <FieldsetLegend>{t("join.title")}</FieldsetLegend>

    <FormError message={props.issues?.error} />

    <FieldsetLabel for="name">{t("join.name")}</FieldsetLabel>
    <Input
      disabled={props.pending}
      id="name"
      name="name"
      required={true}
      width="full"
      {...getInvalidStateProps({
        errorMessageId: "name-error",
        isInvalid: Boolean(props.issues?.errors?.name),
      })}
    />
    <FieldError id="name-error" message={props.issues?.errors?.name} />
  </Fieldset>;
};
