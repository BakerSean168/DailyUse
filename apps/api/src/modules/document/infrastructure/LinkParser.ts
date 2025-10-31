/**
 * LinkParser - Parse internal links from markdown content
 * 
 * Syntax Support:
 * - [[document-title]]              - Simple link
 * - [[document-title|alias]]        - Link with alias
 * - [[document-title#section]]      - Link with anchor
 * - [[document-title|alias#section]]- Link with alias and anchor
 */

export interface ParsedLink {
  /** Original match text including [[ ]] */
  fullMatch: string;
  /** Document title extracted from link */
  documentTitle: string;
  /** Display alias (if provided) */
  alias?: string;
  /** Section anchor (if provided) */
  anchor?: string;
  /** Start position in content */
  startPosition: number;
  /** End position in content */
  endPosition: number;
}

export class LinkParser {
  /**
   * Regex pattern to match internal links
   * Captures: [[title|alias#anchor]]
   */
  private static readonly LINK_PATTERN = /\[\[([^\]|#]+)(?:\|([^\]#]+))?(?:#([^\]]+))?\]\]/g;

  /**
   * Parse all internal links from markdown content
   */
  static parseLinks(content: string): ParsedLink[] {
    const links: ParsedLink[] = [];
    const regex = new RegExp(LinkParser.LINK_PATTERN);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null) {
      const [fullMatch, title, alias, anchor] = match;

      links.push({
        fullMatch,
        documentTitle: title.trim(),
        alias: alias?.trim(),
        anchor: anchor?.trim(),
        startPosition: match.index,
        endPosition: match.index + fullMatch.length,
      });
    }

    return links;
  }

  /**
   * Check if content contains any internal links
   */
  static hasLinks(content: string): boolean {
    return LinkParser.LINK_PATTERN.test(content);
  }

  /**
   * Extract unique document titles from links
   */
  static extractUniqueTitles(links: ParsedLink[]): string[] {
    const titles = links.map((link) => link.documentTitle);
    return Array.from(new Set(titles));
  }

  /**
   * Format a link for insertion into content
   */
  static formatLink(title: string, alias?: string, anchor?: string): string {
    let link = `[[${title}`;
    if (alias) link += `|${alias}`;
    if (anchor) link += `#${anchor}`;
    link += ']]';
    return link;
  }

  /**
   * Replace link text in content (useful for renaming documents)
   */
  static replaceLinkTitle(
    content: string,
    oldTitle: string,
    newTitle: string
  ): string {
    const regex = new RegExp(
      `\\[\\[${LinkParser.escapeRegex(oldTitle)}([|#][^\\]]*)?\\]\\]`,
      'g'
    );
    return content.replace(regex, `[[${newTitle}$1]]`);
  }

  /**
   * Escape special regex characters
   */
  private static escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
