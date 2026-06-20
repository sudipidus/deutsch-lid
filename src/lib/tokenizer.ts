export interface Token {
  text: string;
  isWord: boolean;
}

const WORD_RE = /\p{L}+/gu;

export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(WORD_RE)) {
    const start = match.index;
    if (start > lastIndex) {
      tokens.push({ text: text.slice(lastIndex, start), isWord: false });
    }
    tokens.push({ text: match[0], isWord: true });
    lastIndex = start + match[0].length;
  }
  if (lastIndex < text.length) {
    tokens.push({ text: text.slice(lastIndex), isWord: false });
  }
  return tokens;
}

export function normalizeWord(word: string): string {
  return word.toLowerCase();
}

export function extractWords(text: string): string[] {
  return tokenize(text)
    .filter((t) => t.isWord)
    .map((t) => t.text);
}
