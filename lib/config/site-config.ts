import type { SiteConfiguration } from "../wordpress/types";

export const siteConfig: SiteConfiguration = {
  id: "toliks-poems",
  name: "Стихи Толика",
  baseUrl: process.env.WP_BASE_URL || "",
  api: {
    type: "wordpress",
    endpoints: {
      pages: "/wp-json/wp/v2/pages",
      post: "/wp-json/wp/v2/posts",
      page: "/wp-json/wp/v2/pages",
      posts: "/wp-json/wp/v2/posts",
      tags: "/wp-json/wp/v2/tags",
    },
    headers: process.env.WP_USERNAME && process.env.WP_APP_PASSWORD
      ? {
          Authorization: `Basic ${Buffer.from(`${process.env.WP_USERNAME}:${process.env.WP_APP_PASSWORD}`).toString("base64")}`,
        }
      : {},
  },
  contentTypes: {
    page: {
      source: "pages",
      type: "page",
      fields: {
        title: "title.rendered",
        content: "content.rendered",
        excerpt: "excerpt.rendered",
        slug: "slug",
      },
    },
    post: {
      source: "posts",
      type: "post",
      fields: {
        title: "title.rendered",
        content: "content.rendered",
        excerpt: "excerpt.rendered",
        date: "date",
        slug: "slug",
        acf: {
          dateWritten: "acf.date_written",
        },
      },
      // Keep WP 'date' as site publication time; ACF dateWritten remains in data
    },
  },
  settings: {
    revalidation: 300,
    fallbacks: { title: "Без названия" },
  },
};


