import { type Action, useAction } from "@solidjs/router";
import type { ComponentProps } from "solid-js";
import type * as v from "valibot";

export type FormIssues = {
  error?: string;
  errors?: Record<string, string>;
  success: false;
};

// oxlint-disable-next-line no-explicit-any
export type FormSuccess<T = any> = {
  data: T;
  success: true;
};

// oxlint-disable-next-line no-explicit-any
export type FormResult<T = any> = FormIssues | FormSuccess<T>;

// oxlint-disable-next-line no-explicit-any
export const parseFormSuccessResult = <T = any>(data: T): FormSuccess<T> => {
  return { data, success: true };
};

export const parseFormValidationError = (issues: v.BaseIssue<unknown>[]): FormIssues => {
  return {
    errors: Object.fromEntries(
      issues.map((issue) => [
        issue.path?.map((item) => item.key).join(".") || "global",
        issue.message,
      ]),
    ),
    success: false,
  };
};

export const parseFormException = <T extends { message: string }>(error: T): FormIssues => {
  return { error: error.message, success: false };
};

type GetInvalidStateProps = {
  errorMessageId: string;
  isInvalid: boolean;
};

export const getInvalidStateProps = ({ errorMessageId, isInvalid }: GetInvalidStateProps) => {
  if (!isInvalid) {
    return {};
  }

  return {
    "aria-describedby": errorMessageId,
    "aria-invalid": true,
  };
};

type UseActionOnSubmitArgs = {
  onSuccess: () => void;
  resetOnSuccess?: boolean;
  action: Action<[form: FormData], FormResult, [form: FormData]>;
};

export const useActionOnSubmit = (args: UseActionOnSubmitArgs) => {
  const action = useAction(args.action);

  const onSubmit: ComponentProps<"form">["onSubmit"] = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const result = await action(formData);

    if (!result?.success) {
      return;
    }

    args.onSuccess();

    if (args.resetOnSuccess) {
      event.currentTarget.reset();
    }
  };

  return onSubmit;
};
