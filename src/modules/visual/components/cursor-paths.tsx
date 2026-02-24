import { Key } from "@solid-primitives/keyed";
import { makeMousePositionListener, type MousePosition } from "@solid-primitives/mouse";
import { throttle } from "@solid-primitives/scheduled";
import { createMemo, onCleanup, Show, type Component } from "solid-js";
import { useI18n } from "~/integrations/i18n";
import { useJazzAccount } from "~/integrations/jazz/provider";
import { translateX, translateY, useBoardTransformContext } from "../contexts/board-transform";
import type { CursorModel } from "../state/board-model";
import { useBoardStateContext } from "../state/board-state";
import { MultilineText } from "../ui/multiline-text";
import { getColor } from "../utils/colors";

const OLD_CURSOR_AGE_SECONDS = 10_000;

const CursorPath: Component<CursorPathProps> = (props) => {
  const { t } = useI18n();

  const account = useJazzAccount();
  const [transform] = useBoardTransformContext();

  const isMe = createMemo(() => {
    const accountSessionId = account().$jazz.sessionID;
    return props.cursor.sessionId === accountSessionId;
  });

  const active = createMemo(() => {
    return props.cursor.madeAt >= new Date(Date.now() - 1000 * OLD_CURSOR_AGE_SECONDS);
  });

  const color = createMemo(() => {
    return getColor(props.cursor.sessionId);
  });

  const name = createMemo(() => {
    return props.cursor.name ?? t("board.account.anonymous");
  });

  const transformStyle = createMemo(() => {
    const transformValue = transform();
    const x = translateX(transformValue, props.cursor.x);
    const y = translateY(transformValue, props.cursor.y);
    return `translate(${x}px, ${y}px)`;
  });

  return (
    <Show when={!isMe()}>
      <rect
        opacity={active() ? 100 : 90}
        style={{ fill: color(), transform: transformStyle() }}
        width={10}
        height={10}
        class="duration-100 transition-transform"
      />
      <rect
        opacity={active() ? 100 : 90}
        style={{ fill: color(), transform: transformStyle() }}
        width={100}
        height={20}
        class="duration-100 transition-transform"
        rx="10"
        ry="10"
      />
      <MultilineText
        maxWidth={80}
        x={10}
        y={14}
        font-size="12"
        maxLines={1}
        content={name()}
        style={{ transform: transformStyle() }}
        class="duration-100 transition-transform"
      />
    </Show>
  );
};

export const CursorPaths: Component = () => {
  const boardState = useBoardStateContext();

  const throttled = throttle((pos: MousePosition) => {
    boardState.cursorsFeed()?.$jazz.push({ online: true, position: { x: pos.x, y: pos.y } });
  }, 100);

  onCleanup(makeMousePositionListener(globalThis.window, throttled, { touch: false }));

  onCleanup(() => {
    boardState.cursorsFeed()?.$jazz.push({ online: false, position: { x: 0, y: 0 } });
  });

  return (
    <Key each={boardState.cursors} by="sessionId">
      {(value) => <CursorPath cursor={value()} />}
    </Key>
  );
};

type CursorPathProps = {
  cursor: CursorModel;
};
