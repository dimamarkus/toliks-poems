export type PoemContentData = {
  dateWritten?: string;
  publishedAt?: string;
  writtenAtText?: string | null;
  writtenYear?: number;
  sticky?: boolean;
  themes?: string[];
  themeSlugs?: string[];
  hasImage?: boolean;
  hasEmbed?: boolean;
};

export type WordPressTag = {
  id?: number;
  name?: string;
  slug?: string;
};

export type WordPressEmbeddedTerms = {
  "wp:term"?: unknown[];
};

export type WordPressRawPost = {
  sticky?: boolean;
  _embedded?: WordPressEmbeddedTerms;
};
