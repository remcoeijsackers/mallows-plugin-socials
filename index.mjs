// Socials plugin for Agent Control. The publishing itself lives in the three integration modules under modules/; this
// file only serves the Socials page: the drafts and posts of this plugin's own accounts, one workspace at a time.
// Approving and publishing stay in Agent Control (Integrations → Social posts for approval): a plugin cannot publish.

/** What the page needs of a post: no recipients, no checks, the text cut to a preview. */
export function summary(p) {
  return {
    id: p.id, code: p.code, status: p.status, statusLabel: p.statusLabel, channel: p.channel,
    account: p.integration?.label ?? null, approver: p.integration?.approver ?? null,
    text: p.body.length > 280 ? `${p.body.slice(0, 279)}…` : p.body, image: p.attachments.find((a) => /^https:\/\//.test(a)) ?? null,
    scheduledAt: p.scheduledAt, decidedAt: p.decidedAt, createdAt: p.createdAt, error: p.error, task: p.task ? { code: p.task.code, title: p.task.title } : null,
  };
}

export default {
  onLoad(ctx) {
    ctx.routes.handle("GET", "/posts", ({ workspaceId }) => ({ posts: ctx.outbox.list(workspaceId, { status: "all" }).map(summary) }));
  },
};
