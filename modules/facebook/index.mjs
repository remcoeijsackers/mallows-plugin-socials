// Facebook page through the Meta Graph API, with a page token. A post with an https image becomes a photo post.
// Each module folder is installed on its own, so it carries its own copy of this helper.
const graph = (ctx) => `https://graph.facebook.com/${String(ctx.settings.apiVersion || "v26.0").replace(/^(?!v)/, "v")}`;

export const provider = {
  async test(ctx) {
    const p = await ctx.json(`${graph(ctx)}/${encodeURIComponent(ctx.settings.pageId)}?fields=name`);
    return { ok: true, detail: `Page "${p.name}" reachable`, account: p.name ?? null };
  },
  async publish(ctx, p) {
    const page = encodeURIComponent(ctx.settings.pageId);
    const image = p.media.find((m) => /^https:\/\//.test(m));
    const r = image
      ? await ctx.json(`${graph(ctx)}/${page}/photos`, { method: "POST", body: JSON.stringify({ url: image, caption: p.text }) })
      : await ctx.json(`${graph(ctx)}/${page}/feed`, { method: "POST", body: JSON.stringify({ message: p.text }) });
    return { externalId: r.post_id ?? r.id ?? null };
  },
};

export default { provider };
