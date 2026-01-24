import type { Component } from "solid-js";
import { useI18n } from "~/integrations/i18n";
import { Button } from "../button/button";
import {
  Dialog,
  DialogActions,
  DialogBackdrop,
  DialogBox,
  DialogClose,
  DialogTitle,
} from "../dialog/dialog";

type AlertDialogProps = {
  open?: boolean;
  dialogId: string;
  title: string;
  description: string;
  onSave: () => void;
  onClose?: () => void;
};

export const AlertDialog: Component<AlertDialogProps> = (props) => {
  const { t } = useI18n();

  return (
    <Dialog open={props.open} onClose={props.onClose} id={props.dialogId}>
      <DialogBox>
        <DialogTitle>{props.title}</DialogTitle>
        <DialogActions>
          <DialogClose />
          <Button color="primary" type="button" onClick={props.onSave}>
            {t("common.save")}
          </Button>
        </DialogActions>
      </DialogBox>
      <DialogBackdrop />
    </Dialog>
  );
};
