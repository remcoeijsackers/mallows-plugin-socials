// Instagram (business or creator) through the Meta Graph API: a media container first, then publish it once Instagram
// has processed the image.
// Each module folder is installed on its own, so it carries its own copy of this helper.
const graph = (ctx) => `https://graph.facebook.com/${String(ctx.settings.apiVersion || "v26.0").replace(/^(?!v)/, "v")}`;

export const provider = {
  async test(ctx) {
    const u = await ctx.json(`${graph(ctx)}/${encodeURIComponent(ctx.settings.igUserId)}?fields=username`);
    return { ok: true, detail: `Instagram account @${u.username} reachable`, account: u.username ? `@${u.username}` : null };
  },
  async publish(ctx, p) {
    const ig = encodeURIComponent(ctx.settings.igUserId);
    const image = p.media.find((m) => /^https:\/\//.test(m));
    if (!image) throw new Error("Instagram requires an image with a public https URL");
    const c = await ctx.json(`${graph(ctx)}/${ig}/media`, { method: "POST", body: JSON.stringify({ image_url: image, caption: p.text }) });
    // The container has to be ready before it can be published.
    for (let i = 0; i < 10; i++) {
      const s = await ctx.json(`${graph(ctx)}/${encodeURIComponent(c.id)}?fields=status_code`);
      if (s.status_code === "FINISHED" || !s.status_code) break;
      if (s.status_code === "ERROR" || s.status_code === "EXPIRED") throw new Error(`Instagram could not process the image (${s.status_code})`);
      await new Promise((r) => setTimeout(r, Number(ctx.settings.pollMs ?? 3000)));
    }
    const r = await ctx.json(`${graph(ctx)}/${ig}/media_publish`, { method: "POST", body: JSON.stringify({ creation_id: c.id }) });
    return { externalId: r.id ?? null };
  },
};

export default { provider };
