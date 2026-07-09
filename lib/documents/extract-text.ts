import { extractText } from "unpdf";

/**
 * Raw text extraction from an uploaded resume file. This is the deterministic
 * first half of the import pipeline; the AI structuring step
 * (`lib/ai/parse-resume.ts`) turns this text into a typed `ResumeContent`.
 */

/** Below this many characters we assume the document had no real text layer. */
const MIN_TEXT_LENGTH = 40;

/** 10 MB — comfortably covers any real resume, blocks abuse. */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

const PDF_MIME = "application/pdf";
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** Thrown for file types we can't read. */
export class UnsupportedFileError extends Error {
  constructor(message = "Unsupported file type. Upload a PDF or Word (.docx).") {
    super(message);
    this.name = "UnsupportedFileError";
  }
}

/** Thrown when a file has no extractable text (e.g. a scanned/image PDF). */
export class EmptyDocumentError extends Error {
  constructor(
    message = "We couldn't read any text from this file. If it's a scanned image, paste the text instead.",
  ) {
    super(message);
    this.name = "EmptyDocumentError";
  }
}

export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  let text: string;
  if (file.type === PDF_MIME || name.endsWith(".pdf")) {
    text = await extractPdf(buffer);
  } else if (file.type === DOCX_MIME || name.endsWith(".docx")) {
    text = await extractDocx(buffer);
  } else {
    throw new UnsupportedFileError();
  }

  const normalized = normalizeWhitespace(text);
  if (normalized.length < MIN_TEXT_LENGTH) {
    throw new EmptyDocumentError();
  }
  return normalized;
}

async function extractPdf(buffer: Buffer): Promise<string> {
  const { text } = await extractText(new Uint8Array(buffer), {
    mergePages: true,
  });
  return text;
}

async function extractDocx(buffer: Buffer): Promise<string> {
  // Imported lazily so mammoth's Node-only deps never reach the client bundle.
  const mammoth = await import("mammoth");
  const { value } = await mammoth.extractRawText({ buffer });
  return value;
}

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
