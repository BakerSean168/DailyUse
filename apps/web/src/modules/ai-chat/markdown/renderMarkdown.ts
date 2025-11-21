import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';

// Basic markdown-it instance with commonly useful options
const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
  typographer: true,
});

export function renderMarkdown(raw: string): string {
  const unsafe = md.render(raw ?? '');
  return DOMPurify.sanitize(unsafe, { USE_PROFILES: { html: true } });
}
