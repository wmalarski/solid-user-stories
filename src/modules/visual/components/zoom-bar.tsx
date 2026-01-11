import * as d3 from "d3";
import type { Component } from "solid-js";
import { useI18n } from "~/integrations/i18n";
import { Button } from "~/ui/button/button";
import { MinusIcon } from "~/ui/icons/minus-icon";
import { PlusIcon } from "~/ui/icons/plus-icon";
import { Tooltip } from "~/ui/tooltip/tooltip";
import { useBoardTransformContext } from "../contexts/board-transform";
import { ToolContainer } from "./tool-container";

type ZoomBarProps = {
  svgRef: SVGSVGElement;
};

export const ZoomBar: Component<ZoomBarProps> = (props) => {
  const { t } = useI18n();

  const transform = useBoardTransformContext();

  // oxlint-disable-next-line consistent-function-scoping
  const center = () => {
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  };

  const onZoomInClick = () => {
    // d3.select(props.svgRef);
    const transformValue = transform();
    const k = transformValue.transform().k;
    // oxlint-disable-next-line no-explicit-any
    const selection = d3.select(props.svgRef) as any;
    transformValue.plugin.scaleTo(selection, k + 0.1, [center().x, center().y]);
    // transform().zoomIn(center());
  };

  const onZoomOutClick = () => {
    const transformValue = transform();
    const k = transformValue.transform().k;
    // oxlint-disable-next-line no-explicit-any
    const selection = d3.select(props.svgRef) as any;
    transformValue.plugin.scaleTo(selection, k - 0.1, [center().x, center().y]);
  };

  const onZoomResetClick = () => {
    transform().reset();
  };

  return (
    <ToolContainer class="bottom-2 right-6">
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
