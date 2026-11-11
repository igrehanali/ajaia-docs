import { describe, expect, it } from "vitest";
import { fileToHtml, ImportError, MAX_UPLOAD_BYTES, titleFromFileName } from "../convert";
import { htmlToMarkdown } from "../markdown";

const bytes = (s: string) => new TextEncoder().encode(s).buffer as ArrayBuffer;

describe("fileToHtml", () => {
  it("turns plain text into paragraphs and escapes HTML", async () => {
    const html = await fileToHtml("notes.txt", bytes("Hello <world>\n\nSecond line"));
    expect(html).toBe("<p>Hello &lt;world&gt;</p><p>Second line</p>");
  });

  it("keeps Markdown structure (headings, marks, lists)", async () => {
    const html = await fileToHtml("plan.md", bytes("# Plan\n\n**Bold** and *italic*\n\n- one\n- two"));
    expect(html).toContain("<h1>Plan</h1>");
    expect(html).toContain("<strong>Bold</strong>");
    expect(html).toContain("<em>italic</em>");
    expect(html).toMatch(/<ul>\s*<li>one<\/li>\s*<li>two<\/li>\s*<\/ul>/);
  });

  it("strips scripts and event handlers from imported content", async () => {
    const html = await fileToHtml("x.md", bytes('<script>alert(1)</script><p onclick="x()">safe</p>'));
    expect(html).not.toContain("script");
    expect(html).not.toContain("onclick");
    expect(html).toContain("safe");
  });

  it("rejects unsupported, empty and oversized files with clear errors", async () => {
    await expect(fileToHtml("image.png", bytes("x"))).rejects.toMatchObject({ status: 415 });
    await expect(fileToHtml("empty.txt", new ArrayBuffer(0))).rejects.toBeInstanceOf(ImportError);
    await expect(fileToHtml("big.txt", new ArrayBuffer(MAX_UPLOAD_BYTES + 1))).rejects.toMatchObject({ status: 413 });
  });
});

describe("titleFromFileName", () => {
  it("drops the extension and tidies separators", () => {
    expect(titleFromFileName("q3_launch-plan.docx")).toBe("q3 launch plan");
    expect(titleFromFileName(".md")).toBe("Imported document");
  });
});

describe("htmlToMarkdown (export)", () => {
  it("round-trips the editor's main blocks", () => {
    const md = htmlToMarkdown(
      "<h2>Goals</h2><p><strong>Ship</strong> the <em>MVP</em></p><ul><li><p>a</p></li><li><p>b</p></li></ul><ol><li><p>first</p></li></ol>",
    );
    expect(md).toBe("## Goals\n\n**Ship** the *MVP*\n\n- a\n- b\n\n1. first\n");
  });
});
