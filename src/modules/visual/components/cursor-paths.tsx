import { Key } from "@solid-primitives/keyed";
import type { Profile } from "jazz-tools";
import { createMemo, type Component } from "solid-js";
import { useI18n } from "~/integrations/i18n";
import { useJazzAccount } from "~/integrations/jazz/provider";
import { useBoardStateContext } from "../state/board-state";
import { getColor } from "../utils/colors";
import type { Point2D } from "../utils/types";

const OLD_CURSOR_AGE_SECONDS = 10_000;

export const CursorPaths: Component = () => {
  const boardState = useBoardStateContext();

  return (
    <Key each={Object.entries(boardState.cursors()?.perSession ?? {})} by={([key]) => key}>
      {(value) => {
        const [_key, cursor] = value();
        return (
          <CursorPath
            position={cursor.value.position}
            sessionId={cursor.tx.sessionID}
            madeAt={cursor.madeAt}
            profile={cursor.by?.profile.$isLoaded ? cursor.by?.profile : null}
          />
        );
      }}
    </Key>
  );
};

type CursorPathProps = {
  profile: Profile | null;
  position: Point2D;
  sessionId: string;
  madeAt: Date;
};

const CursorPath: Component<CursorPathProps> = (props) => {
  const { t } = useI18n();

  const account = useJazzAccount();

  const isMe = createMemo(() => {
    const accountSessionId = account().$jazz.sessionID;
    return props.sessionId === accountSessionId;
  });

  const active = createMemo(() => {
    return (
      !OLD_CURSOR_AGE_SECONDS ||
      props.madeAt >= new Date(Date.now() - 1000 * OLD_CURSOR_AGE_SECONDS)
    );
  });

  const age = createMemo(() => {
    return Date.now() - new Date(props.madeAt).getTime();
  });

  const color = createMemo(() => {
    return getColor(props.sessionId);
  });

  const name = createMemo(() => {
    return props.profile?.name && t("board.cursors.anonymous");
  });

  return null;
};
