import * as d3 from "d3";

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
