import {
  createEffect,
  createSignal,
  onCleanup,
  splitProps,
  type Component,
  type ComponentProps,
} from "solid-js";

type MultilineTextProps = Omit<ComponentProps<"text">, "children"> & {
  x: number;
  y: number;
  content: string;
  maxWidth: number;
  lineHeight?: number;
  maxLines?: number;
};

export const MultilineText: Component<MultilineTextProps> = (props) => {
  const [splitted, rest] = splitProps(props, ["content", "maxWidth", "lineHeight", "maxLines"]);

  const [ref, setRef] = createSignal<SVGTextElement>();

  createEffect(() => {
    const text = ref();

    if (!text) {
      return;
    }

    const x = rest.x;
    const y = rest.y;
    const maxWidth = splitted.maxWidth;
    const lineHeight = splitted.lineHeight ?? 20;
    const maxLines = splitted.maxLines ?? 1;
    const words = splitted.content.split(/\s+/).toReversed();
    const ellipsis = "...";

    let word = words.pop();
    let lineNumber = 0;
    let line: string[] = [];
    let element = (<tspan x={x} y={y} />) as SVGTSpanElement;

    text.appendChild(element);

    while (word) {
      line.push(word);
      element.textContent = line.join(" ");

      const textWidth = element.getComputedTextLength();

      if (textWidth > maxWidth) {
        lineNumber += 1;
        line.pop();
        element.textContent = line.join(" ");

        if (lineNumber >= maxLines) {
          break;
        }

        line = [word];
        element = (
          <tspan x={x} y={y + lineNumber * lineHeight}>
            {word}
          </tspan>
        ) as SVGTSpanElement;
        text.appendChild(element);
      }

      word = words.pop();
    }

    if (lineNumber >= maxLines) {
      element.textContent = line.join(" ") + ellipsis;
      const textWidth = element.getComputedTextLength();

      while (textWidth > maxWidth) {
        line.pop();
        element.textContent = line.join(" ") + ellipsis;
      }
    }

    onCleanup(() => {
      text.replaceChildren();
    });
  });

  return <text {...rest} ref={setRef} />;
};
