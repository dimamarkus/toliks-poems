export interface SiteFieldMapping {
  title?: string;
  content?: string;
  excerpt?: string;
  featuredImage?: string;
  date?: string;
  author?: string;
  slug?: string;
  acf?: { [key: string]: string | SiteFieldMapping };
}

export interface SiteContentType {
  source: string;
  type: string;
  fields: SiteFieldMapping;
  defaults?: Record<string, unknown>;
}

export interface SiteConfiguration {
  id: string;
  name: string;
  baseUrl: string;
  api: {
    type: "wordpress";
    endpoints?: Record<string, string>;
    headers?: Record<string, string>;
  };
  contentTypes: Record<string, SiteContentType>;
  settings: {
    revalidation?: number;
    fallbacks?: Record<string, unknown>;
  };
}

export interface GenericContent {
  id: string;
  type: string;
  title: string;
  content?: string;
  excerpt?: string;
  featuredImage?: string;
  date?: string;
  author?: string;
  slug?: string;
  data: Record<string, unknown>;
  _raw?: unknown;
}
