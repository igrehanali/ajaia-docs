/**
 * Small HTML → Markdown converter for the limited, sanitized tag set the
 * editor produces (headings, paragraphs, marks, lists, quotes, code).
 * A full library (turndown) was not worth the dependency for this scope.
 */
function decode(text: string) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

function inline(html: string): string {
  return decode(
    html
      .replace(/<br\s*\/?>/gi, "  \n")
      .replace(/<(strong|b)>([\s\S]*?)<\/\1>/gi, "**$2**")
      .replace(/<(em|i)>([\s\S]*?)<\/\1>/gi, "*$2*")
      .replace(/<u>([\s\S]*?)<\/u>/gi, "<u>$1</u>")
      .replace(/<s>([\s\S]*?)<\/s>/gi, "~~$1~~")
      .replace(/<code>([\s\S]*?)<\/code>/gi, "`$1`")
      .replace(/<a [^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)")
      .replace(/<(?!\/?u>)[^>]+>/g, ""),
  ).trim();
}

function list(inner: string, ordered: boolean): string {
  const items = [...inner.matchAll(/<li>([\s\S]*?)<\/li>/gi)].map((m) => inline(m[1]));
  return items.map((t, i) => `${ordered ? `${i + 1}.` : "-"} ${t}`).join("\n");
}

export function htmlToMarkdown(html: string): string {
  const blocks: string[] = [];
  const re =
    /<(h1|h2|h3|p|ul|ol|blockquote|pre)[^>]*>([\s\S]*?)<\/\1>|<hr\s*\/?>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    if (!m[1]) {
      blocks.push("---");
      continue;
    }
    const tag = m[1].toLowerCase();
    const inner = m[2];
    if (tag === "h1") blocks.push(`# ${inline(inner)}`);
    else if (tag === "h2") blocks.push(`## ${inline(inner)}`);
    else if (tag === "h3") blocks.push(`### ${inline(inner)}`);
    else if (tag === "ul") blocks.push(list(inner, false));
    else if (tag === "ol") blocks.push(list(inner, true));
    else if (tag === "blockquote") blocks.push(`> ${inline(inner)}`);
    else if (tag === "pre") blocks.push("```\n" + decode(inner.replace(/<[^>]+>/g, "")) + "\n```");
    else {
      const text = inline(inner);
      if (text) blocks.push(text);
    }
  }
  return blocks.join("\n\n") + "\n";
}
