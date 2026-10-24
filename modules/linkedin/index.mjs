// LinkedIn through the Posts API (own app registration, OAuth without PKCE). LinkedIn gives regular apps no refresh
// token: an access token lasts about 60 days, then the owner signs in again.

/** LinkedIn's "little text format": these characters need a backslash, otherwise the text is cut off. */
export const linkedinEscape = (s) => s.replace(/[\\|{}@[\]()<>#*_~]/g, (c) => `\\${c}`);

export const provider = {
  async test(ctx) {
    const u = await ctx.json("https://api.linkedin.com/v2/userinfo");
    return { ok: true, detail: `Connected as ${u.name ?? u.sub}`, account: u.sub ? `urn:li:person:${u.sub}` : null };
  },
  async publish(ctx, p) {
    let author = ctx.settings.author;
    if (!author) { const u = await ctx.json("https://api.linkedin.com/v2/userinfo"); author = `urn:li:person:${u.sub}`; }
    const r = await ctx.json("https://api.linkedin.com/rest/posts", {
      method: "POST",
      headers: { "LinkedIn-Version": String(ctx.settings.apiVersion || "202605"), "X-Restli-Protocol-Version": "2.0.0" },
      body: JSON.stringify({
        author, commentary: linkedinEscape(p.text), visibility: "PUBLIC",
        distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
        lifecycleState: "PUBLISHED", isReshareDisabledByAuthor: false,
      }),
    });
    return { externalId: r.__headers?.get?.("x-restli-id") ?? r.id ?? null };
  },
};

export const oauth = {
  authUrl: () => "https://www.linkedin.com/oauth/v2/authorization",
  tokenUrl: () => "https://www.linkedin.com/oauth/v2/accessToken",
  scopes: (s) => ["openid", "profile", String(s.author ?? "").startsWith("urn:li:organization:") ? "w_organization_social" : "w_member_social"],
  needsSecret: true, pkce: false, redirectHost: "localhost",
};

export default { provider, oauth };
