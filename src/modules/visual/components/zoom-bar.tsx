import type { Component } from "solid-js";
import { useI18n } from "~/integrations/i18n";
import { Button } from "~/ui/button/button";
import { MinusIcon } from "~/ui/icons/minus-icon";
import { PlusIcon } from "~/ui/icons/plus-icon";
import { Tooltip } from "~/ui/tooltip/tooltip";
import { useBoardTransformContext } from "../contexts/board-transform";
import { ToolContainer } from "./tool-container";

const center = () => {
  return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
};

export const ZoomBar: Component = () => {
  const { t } = useI18n();

  const transform = useBoardTransformContext();

  const onZoomInClick = () => {
    transform().zoomIn(center());
  };

  const onZoomOutClick = () => {
    transform().zoomOut(center());
  };

  const onZoomResetClick = () => {
    transform().reset();
  };

  return (
    <ToolContainer class="absolute bottom-2 right-6">
      <Tooltip data-tip={t("board.zoom.zoomIn")}>
        <Button
          aria-label={t("board.zoom.zoomIn")}
          onClick={onZoomInClick}
          shape="circle"
          size="sm"
          variant="ghost"
        >
          <PlusIcon />
        </Button>
      </Tooltip>
      <Tooltip data-tip={t("board.zoom.reset")}>
        <Button
          aria-label={t("board.zoom.reset")}
          class="tabular-nums"
          onClick={onZoomResetClick}
          shape="circle"
          size="sm"
          variant="ghost"
        >
          {Math.round(transform().transform().k * 100)}%
        </Button>
      </Tooltip>
      <Tooltip data-tip={t("board.zoom.zoomOut")}>
        <Button
          aria-label={t("board.zoom.zoomOut")}
          onClick={onZoomOutClick}
          shape="circle"
          size="sm"
          variant="ghost"
        >
          <MinusIcon />
        </Button>
      </Tooltip>
    </ToolContainer>
  );
};
