import { Key } from "@solid-primitives/keyed";
import { makeMousePositionListener, type MousePosition } from "@solid-primitives/mouse";
import { throttle } from "@solid-primitives/scheduled";
import { createMemo, onCleanup, Show, type Component } from "solid-js";
import { useI18n } from "~/integrations/i18n";
import { useJazzAccount } from "~/integrations/jazz/provider";
import type { CursorModel } from "../state/board-model";
import { useBoardStateContext } from "../state/board-state";
import { getColor } from "../utils/colors";

const OLD_CURSOR_AGE_SECONDS = 10_000;

export const CursorPaths: Component = () => {
  const boardState = useBoardStateContext();

  const throttled = throttle((pos: MousePosition) => {
    boardState.cursorsFeed()?.$jazz.push({ position: { x: pos.x, y: pos.y } });
  }, 250);

  onCleanup(makeMousePositionListener(globalThis.window, throttled, { touch: false }));

  return (
    <Key each={boardState.cursors} by="sessionId">
      {(value) => <CursorPath cursor={value()} />}
    </Key>
  );
};

type CursorPathProps = {
  cursor: CursorModel;
};

const CursorPath: Component<CursorPathProps> = (props) => {
  const { t } = useI18n();

  const account = useJazzAccount();

  const isMe = createMemo(() => {
    const accountSessionId = account().$jazz.sessionID;
    return props.cursor.sessionId === accountSessionId;
  });

  const active = createMemo(() => {
    return (
      !OLD_CURSOR_AGE_SECONDS ||
      props.cursor.madeAt >= new Date(Date.now() - 1000 * OLD_CURSOR_AGE_SECONDS)
    );
  });

  const color = createMemo(() => {
    return getColor(props.cursor.sessionId);
  });

  const name = createMemo(() => {
    return props.cursor.name && t("board.cursors.anonymous");
  });

  return (
    <Show when={!isMe()}>
      <rect
        opacity={active() ? 100 : 90}
        style={{ fill: color() }}
        width={10}
        height={10}
        x={props.cursor.x}
        y={props.cursor.y}
      />
      <text x={props.cursor.x} y={props.cursor.y}>
        {name()}
      </text>
    </Show>
  );
};
