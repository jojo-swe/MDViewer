import { getSingletonHighlighter, type Highlighter } from 'shiki';

const LANGS = [
  'javascript',
  'typescript',
  'python',
  'rust',
  'go',
  'json',
  'bash',
  'html',
  'css',
  'markdown',
  'yaml',
  'jsx',
  'tsx',
  'sql',
  'diff',
] as const;

const DARK_THEME = 'one-dark-pro';
const LIGHT_THEME = 'github-light';

let highlighter: Highlighter | null = null;
let highlighterPromise: Promise<Highlighter> | null = null;

export async function getHighlighterInstance(): Promise<Highlighter> {
  if (highlighter) return highlighter;
  if (highlighterPromise) return highlighterPromise;

  highlighterPromise = getSingletonHighlighter({
    themes: [DARK_THEME, LIGHT_THEME],
    langs: [...LANGS],
  }).then((h) => {
    highlighter = h;
    return h;
  });

  return highlighterPromise;
}

export function isSupportedLang(lang: string): boolean {
  return (LANGS as readonly string[]).includes(lang);
}

export async function highlightCode(
  code: string,
  lang: string,
  theme: 'dark' | 'light'
): Promise<string> {
  const h = await getHighlighterInstance();
  const safeLang = isSupportedLang(lang) ? lang : 'markdown';
  return h.codeToHtml(code, {
    lang: safeLang,
    theme: theme === 'dark' ? DARK_THEME : LIGHT_THEME,
  });
}
