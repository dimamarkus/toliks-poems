import type {
  GenericContent,
  SiteConfiguration,
  SiteContentType,
  SiteFieldMapping,
} from "./types";

export class WordPressClient {
  constructor(private readonly config: SiteConfiguration) {}

  async fetchContent(
    contentTypeName: string,
    limit = 10,
    filters?: Record<string, unknown>,
  ): Promise<GenericContent[]> {
    const contentType = this.config.contentTypes[contentTypeName];

    if (!contentType) {
      throw new Error(`Content type '${contentTypeName}' not found in site configuration`);
    }

    try {
      const endpoint = this.config.api.endpoints?.[contentType.source];

      if (!endpoint) {
        throw new Error(`Endpoint not found for content source: ${contentType.source}`);
      }

      const url = new URL(`${this.config.baseUrl}${endpoint}`);

      url.searchParams.set("per_page", String(limit));

      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          url.searchParams.set(key, String(value));
        }
      }

      url.searchParams.set("_embed", "1");

      const response = await fetch(url.toString(), {
        headers: this.config.api.headers ?? {},
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const payload = await response.json();
      const items = Array.isArray(payload) ? payload : [payload];

      return items.map((item) => this.transformContent(item, contentType));
    } catch (error) {
      console.error(`Failed to fetch ${contentTypeName}:`, error);
      return [];
    }
  }

  async fetchContentWithMeta(
    contentTypeName: string,
    limit = 10,
    filters?: Record<string, unknown>,
  ): Promise<{ items: GenericContent[]; totalItems?: number; totalPages?: number }> {
    const contentType = this.config.contentTypes[contentTypeName];

    if (!contentType) {
      throw new Error(`Content type '${contentTypeName}' not found in site configuration`);
    }

    try {
      const endpoint = this.config.api.endpoints?.[contentType.source];

      if (!endpoint) {
        throw new Error(`Endpoint not found for content source: ${contentType.source}`);
      }

      const url = new URL(`${this.config.baseUrl}${endpoint}`);

      url.searchParams.set("per_page", String(limit));

      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          url.searchParams.set(key, String(value));
        }
      }

      url.searchParams.set("_embed", "1");

      const response = await fetch(url.toString(), {
        headers: this.config.api.headers ?? {},
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const payload = await response.json();
      const items = (Array.isArray(payload) ? payload : [payload]).map((item) =>
        this.transformContent(item, contentType),
      );

      return {
        items,
        totalItems: toOptionalNumber(response.headers.get("X-WP-Total")),
        totalPages: toOptionalNumber(response.headers.get("X-WP-TotalPages")),
      };
    } catch (error) {
      console.error(`Failed to fetch ${contentTypeName} (with meta):`, error);
      return { items: [] };
    }
  }

  private transformContent(rawData: unknown, contentType: SiteContentType): GenericContent {
    const raw = isRecord(rawData) ? rawData : {};

    const transformed: GenericContent = {
      id: String(raw.id ?? crypto.randomUUID()),
      type: contentType.type,
      title:
        asString(this.extractField(raw, contentType.fields.title ?? "")) ??
        asString(contentType.defaults?.title) ??
        asString(this.config.settings.fallbacks?.title) ??
        "Untitled",
      data: {},
      _raw: rawData,
    };

    if (contentType.fields.content) {
      transformed.content = asString(this.extractField(raw, contentType.fields.content));
    }

    if (contentType.fields.excerpt) {
      transformed.excerpt = asString(this.extractField(raw, contentType.fields.excerpt));
    }

    if (contentType.fields.featuredImage) {
      transformed.featuredImage = asString(
        this.extractField(raw, contentType.fields.featuredImage),
      );
    }

    if (contentType.fields.date) {
      transformed.date = asString(this.extractField(raw, contentType.fields.date));
    }

    if (contentType.fields.author) {
      transformed.author = asString(this.extractField(raw, contentType.fields.author));
    }

    if (contentType.fields.slug) {
      transformed.slug = asString(this.extractField(raw, contentType.fields.slug));
    }

    if (contentType.fields.acf) {
      for (const [key, fieldPath] of Object.entries(contentType.fields.acf)) {
        const value = this.extractField(raw, fieldPath);

        if (value !== undefined) {
          transformed.data[key] = value;
        }
      }
    }

    if (contentType.defaults) {
      for (const [key, value] of Object.entries(contentType.defaults)) {
        if (transformed.data[key] === undefined) {
          transformed.data[key] = value;
        }
      }
    }

    return transformed;
  }

  private extractField(
    data: Record<string, unknown>,
    fieldPath: string | SiteFieldMapping,
  ): unknown {
    if (typeof fieldPath !== "string") {
      return fieldPath;
    }

    return fieldPath
      .split(".")
      .reduce<unknown>(
        (current, key) =>
          isRecord(current) ? current[key] : undefined,
        data,
      );
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function toOptionalNumber(value: string | null): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}
