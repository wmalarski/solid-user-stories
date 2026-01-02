import { type Component, Show } from "solid-js";
import { Alert, AlertIcon } from "../alert/alert";

type FormErrorProps = {
  message?: string;
};

export const FormError: Component<FormErrorProps> = (props) => {
  return (
    <Show when={props.message}>
      <Alert color="error">
        <AlertIcon variant="error" />
        {props.message}
      </Alert>
    </Show>
  );
};
