// The plugin entry: the /posts route returns this plugin's posts in a short form for the Socials page.
import { test } from "node:test";
import assert from "node:assert/strict";
import plugin, { summary } from "../index.mjs";

test("/posts asks the outbox for the workspace and returns short summaries", async () => {
  const routes = new Map();
  let asked;
  const long = "x".repeat(400);
  plugin.onLoad({
    routes: { handle: (method, path, h) => routes.set(`${method} ${path}`, h) },
    outbox: { list: (ws, q) => { asked = [ws, q]; return [{ id: "o1", code: "OB-1", status: "scheduled", statusLabel: "Scheduled", channel: "linkedin", integration: { label: "Me on LinkedIn", approver: "Sam" }, body: long, attachments: [], scheduledAt: "2026-10-30T09:00:00Z", decidedAt: null, createdAt: "2026-10-24T09:00:00Z", error: null, task: { code: "AC-1", title: "t" }, recipients: { to: ["secret@x"] } }]; } },
  });
  const out = await routes.get("GET /posts")({ workspaceId: "ws-1" });
  assert.deepEqual(asked, ["ws-1", { status: "all" }]);
  assert.equal(out.posts[0].account, "Me on LinkedIn");
  assert.equal(out.posts[0].text.length, 280);
  assert.equal("recipients" in out.posts[0], false);
});

test("summary picks the first https image", () => {
  const s = summary({ id: "1", code: "c", status: "draft", statusLabel: "Draft", channel: "instagram", body: "b", attachments: ["/local.png", "https://cdn/x.jpg"], scheduledAt: null, decidedAt: null, createdAt: "", error: null, task: null, integration: null });
  assert.equal(s.image, "https://cdn/x.jpg");
});
