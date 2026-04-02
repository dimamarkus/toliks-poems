export function normalizePoemHtml(html: string): string {
  let normalized = html;
  // Remove runs of &nbsp; at the beginning of lines or right after <br>
  normalized = normalized.replace(/(^|<br\s*\/?>(?:\s*|))\s*(?:&nbsp;)+/gi, "$1");
  // Convert remaining &nbsp; to regular spaces so they can wrap naturally
  normalized = normalized.replace(/&nbsp;/g, " ");
  // Drop empty placeholder paragraphs consisting of only &nbsp;
  normalized = normalized.replace(/<p>\s*&nbsp;\s*<\/p>/gi, "");

  // Transform Gutenberg oEmbed wrappers into iframes for common providers
  normalized = normalized.replace(
    /<div[^>]*class=["'][^"']*wp-block-embed__wrapper[^"']*["'][^>]*>(.*?)<\/div>/gis,
    (_, url: string) => renderEmbedIframe(url.trim())
  );
  return normalized;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function highlightInHtml(html: string, query: string): string {
  const q = (query || "").trim();
  if (!q || q.length < 2) return html;
  const parts = html.split(/(<[^>]+>)/g); // keep tags as separate parts
  const rx = new RegExp(escapeRegExp(q), "gi");
  for (let i = 0; i < parts.length; i++) {
    // Only transform text nodes (not tags)
    const chunk = parts[i];
    if (!chunk || (typeof chunk === "string" && chunk.startsWith("<"))) continue;
    parts[i] = chunk.replace(rx, (m) => `<mark class="search-hit">${m}</mark>`);
  }
  return parts.join("");
}

export function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function highlightPlainText(text: string, query: string): string {
  const q = (query || "").trim();
  if (!q || q.length < 2) return escapeHtml(text);
  const rx = new RegExp(escapeRegExp(q), "gi");
  return escapeHtml(text).replace(rx, (m) => `<mark class="search-hit">${escapeHtml(m)}</mark>`);
}

function renderEmbedIframe(url: string): string {
  // YouTube
  const yt = /(?:https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/))([\w-]{11})/i.exec(url);
  if (yt) {
    const id = yt[1];
    return `<div class="embed aspect-video"><iframe src="https://www.youtube.com/embed/${id}" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>`;
  }
  // Vimeo
  const vimeo = /https?:\/\/vimeo\.com\/(\d+)/i.exec(url);
  if (vimeo) {
    const id = vimeo[1];
    return `<div class="embed aspect-video"><iframe src="https://player.vimeo.com/video/${id}" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>`;
  }
  // Fallback: show a plain link
  return `<p><a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a></p>`;
}


