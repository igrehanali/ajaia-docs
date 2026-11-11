import { marked } from "marked";
import { sanitizeDocHtml } from "./sanitize";

export const SUPPORTED_EXTENSIONS = [".txt", ".md", ".docx"] as const;
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2 MB

export class ImportError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

function extensionOf(name: string) {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot).toLowerCase();
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Plain text → paragraphs (blank lines split paragraphs, single newlines become <br>). */
export function textToHtml(text: string): string {
  const normalized = text.replace(/\r\n?/g, "\n").trim();
  if (!normalized) return "<p></p>";
  return normalized
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/** Title from the file name, without the extension. */
export function titleFromFileName(name: string): string {
  const base = name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  return (base || "Imported document").slice(0, 200);
}

/**
 * Converts an uploaded file into sanitized editor HTML.
 * Supported: .txt, .md, .docx (max 2 MB). Anything else is rejected with a clear message.
 */
export async function fileToHtml(name: string, bytes: ArrayBuffer): Promise<string> {
  const ext = extensionOf(name);
  if (!(SUPPORTED_EXTENSIONS as readonly string[]).includes(ext)) {
    throw new ImportError(
      `Unsupported file type "${ext || "none"}". Upload a .txt, .md or .docx file.`,
      415,
    );
  }
  if (bytes.byteLength === 0) throw new ImportError("The file is empty.");
  if (bytes.byteLength > MAX_UPLOAD_BYTES) {
    throw new ImportError("File is larger than 2 MB.", 413);
  }

  let html: string;
  if (ext === ".docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.convertToHtml({ buffer: Buffer.from(bytes) });
    html = result.value;
  } else {
    const text = new TextDecoder("utf-8").decode(bytes);
    html = ext === ".md" ? await marked.parse(text, { gfm: true }) : textToHtml(text);
  }

  const clean = sanitizeDocHtml(html).trim();
  return clean || "<p></p>";
}
