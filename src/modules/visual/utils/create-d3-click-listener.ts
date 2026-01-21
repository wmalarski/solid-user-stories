import * as d3 from "d3";
import { createEffect, onCleanup, type Accessor } from "solid-js";

type CreateD3ClickListenerArgs = {
  onClick: (event: PointerEvent) => void;
  ref: Accessor<string | d3.BaseType | undefined>;
};

export const createD3ClickListener = (args: CreateD3ClickListenerArgs) => {
  createEffect(() => {
    const refValue = args.ref();

    if (!refValue) {
      return;
    }

    const abortController = new AbortController();

    // oxlint-disable-next-line typescript/no-explicit-any
    d3.select(refValue as any).on("click", args.onClick, {
      signal: abortController.signal,
    });

    onCleanup(() => {
      abortController.abort();
    });
  });
};
