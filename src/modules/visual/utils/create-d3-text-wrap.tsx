import * as d3 from "d3";
import { createEffect, createSignal, onCleanup, type Component } from "solid-js";

type MultilineTextProps = {
  x: number;
  y: number;
  content: string;
  maxWidth: number;
  lineHeight: number;
  class?: string;
};

export const MultilineText: Component<MultilineTextProps> = (props) => {
  const [ref, setRef] = createSignal<SVGTextElement>();

  createEffect(() => {
    const text = ref();

    if (!text) {
      return;
    }

    const x = props.x;
    const y = props.y;
    const maxWidth = props.maxWidth;
    const lineHeight = props.lineHeight;
    const words = props.content.split(/\s+/).toReversed();

    let word = words.pop();
    let lineNumber = 0;
    let line: string[] = [];
    let element = (<tspan x={x} y={y} />) as SVGTSpanElement;

    text.append(element);

    while (word) {
      line.push(word);
      element.textContent = line.join(" ");

      const textWidth = element.getComputedTextLength();

      if (textWidth > maxWidth) {
        lineNumber += 1;
        line.pop();
        element.textContent = line.join(" ");
        line = [word];
        element = (
          <tspan x={x} y={y + lineNumber * lineHeight}>
            {word}
          </tspan>
        ) as SVGTSpanElement;
        text.append(element);
      }

      word = words.pop();
    }

    onCleanup(() => {
      text.replaceChildren();
    });
  });

  return <text ref={setRef} class={props.class} x={props.x} y={props.y} />;
};

export const wrapText = (ref: SVGTextElement) => {
  const text = d3.select(ref);
  const words = text.text().split(/\s+/).toReversed();
  const lineHeight = 20;
  const width = Number.parseFloat(text.attr("width"));
  const y = Number.parseFloat(text.attr("y"));
  const x = text.attr("x");
  const anchor = text.attr("text-anchor");

  let tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("text-anchor", anchor);
  let lineNumber = 0;
  let line: string[] = [];
  let word = words.pop();

  while (word) {
    line.push(word);
    tspan.text(line.join(" "));
    const computedTextLength = tspan.node()?.getComputedTextLength() ?? 0;
    if (computedTextLength > width) {
      lineNumber += 1;
      line.pop();
      tspan.text(line.join(" "));
      line = [word];
      tspan = text
        .append("tspan")
        .attr("x", x)
        .attr("y", y + lineNumber * lineHeight)
        .attr("anchor", anchor)
        .text(word);
    }
    word = words.pop();
  }
};

export const dotmeText = (ref: SVGTextElement) => {
  const text = d3.select(ref);
  const words = text.text().split(/\s+/);

  const ellipsis = text.text("").append("tspan").attr("class", "elip").text("...");
  const ellipsisWidth = ellipsis.node()?.getComputedTextLength() ?? 0;
  const width = Number.parseFloat(text.attr("width")) - ellipsisWidth;
  const numWords = words.length;

  const tspan = text.insert("tspan", ":first-child").text(words.join(" "));

  // Try the whole line
  // While it's too long, and we have words left, keep removing words
  const computedTextLength = tspan.node()?.getComputedTextLength() ?? 0;
  while (computedTextLength > width && words.length > 0) {
    words.pop();
    tspan.text(words.join(" "));
  }

  if (words.length === numWords) {
    ellipsis.remove();
  }
};
