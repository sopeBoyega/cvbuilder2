/**
 * Minimal ambient declaration for `mammoth` — the package ships no types and
 * there is no `@types/mammoth`. We only use `extractRawText`.
 * @see https://github.com/mwilliamson/mammoth.js
 */
declare module "mammoth" {
  interface DocxInput {
    buffer?: Buffer;
    arrayBuffer?: ArrayBuffer;
    path?: string;
  }

  interface Message {
    type: string;
    message: string;
  }

  interface Result {
    value: string;
    messages: Message[];
  }

  export function extractRawText(input: DocxInput): Promise<Result>;
  export function convertToHtml(input: DocxInput): Promise<Result>;
}
