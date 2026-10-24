// The three modules against a fake ctx: nothing is ever sent. Run with `npm test` (node --test, no dependencies).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import linkedin, { linkedinEscape } from "../modules/linkedin/index.mjs";
import facebook from "../modules/facebook/index.mjs";
import instagram from "../modules/instagram/index.mjs";

/** A ctx like Agent Control's: settings plus a json() that records the calls and answers from `reply`. */
function fakeCtx(settings, reply = () => ({})) {
  const calls = [];
  return {
    calls,
    ctx: {
      settings, account: null, secret: () => null, token: async () => "t",
      async json(url, init = {}) { calls.push({ url, init }); return reply(url, init); },
    },
  };
}

test("LinkedIn: Posts API with the version header and escaped text", async () => {
  const { ctx, calls } = fakeCtx({ author: "urn:li:person:abc" }, () => ({ __headers: new Headers({ "x-restli-id": "urn:li:share:9" }) }));
  const r = await linkedin.provider.publish(ctx, { text: "New (finally) #live", media: [] });
  assert.equal(calls[0].url, "https://api.linkedin.com/rest/posts");
  assert.equal(calls[0].init.headers["LinkedIn-Version"], "202605");
  assert.equal(JSON.parse(calls[0].init.body).commentary, linkedinEscape("New (finally) #live"));
  assert.equal(r.externalId, "urn:li:share:9");
});

test("LinkedIn: without an author the signed-in profile posts; organisation pages get the organisation scope", async () => {
  const { ctx, calls } = fakeCtx({}, (url) => url.endsWith("/userinfo") ? { sub: "me1", name: "Me" } : { id: "x" });
  await linkedin.provider.publish(ctx, { text: "hi", media: [] });
  assert.equal(JSON.parse(calls[1].init.body).author, "urn:li:person:me1");
  assert.ok(linkedin.oauth.scopes({ author: "urn:li:organization:1" }).includes("w_organization_social"));
  assert.ok(linkedin.oauth.scopes({}).includes("w_member_social"));
  assert.equal(linkedinEscape("a_b*c"), "a\\_b\\*c");
});

test("Facebook: text goes to the feed, an https image becomes a photo post", async () => {
  const a = fakeCtx({ pageId: "123" }, () => ({ id: "p1" }));
  await facebook.provider.publish(a.ctx, { text: "Open day", media: [] });
  assert.equal(a.calls[0].url, "https://graph.facebook.com/v26.0/123/feed");
  const b = fakeCtx({ pageId: "123", apiVersion: "27.0" }, () => ({ post_id: "p2" }));
  const r = await facebook.provider.publish(b.ctx, { text: "Look", media: ["http://insecure/x.jpg", "https://cdn.example/x.jpg"] });
  assert.equal(b.calls[0].url, "https://graph.facebook.com/v27.0/123/photos");
  assert.equal(JSON.parse(b.calls[0].init.body).url, "https://cdn.example/x.jpg");
  assert.equal(r.externalId, "p2");
});

test("Instagram: needs an image, waits for the container, then publishes it", async () => {
  const none = fakeCtx({ igUserId: "9" });
  await assert.rejects(instagram.provider.publish(none.ctx, { text: "x", media: [] }), /needs an image|requires an image/);
  let polls = 0;
  const { ctx, calls } = fakeCtx({ igUserId: "9", pollMs: 1 }, (url) => {
    if (url.endsWith("/media")) return { id: "c1" };
    if (url.includes("status_code")) return { status_code: ++polls < 2 ? "IN_PROGRESS" : "FINISHED" };
    return { id: "m1" };
  });
  const r = await instagram.provider.publish(ctx, { text: "Hi", media: ["https://cdn.example/a.jpg"] });
  assert.deepEqual(calls.map((c) => c.url.replace("https://graph.facebook.com/v26.0", "")), ["/9/media", "/c1?fields=status_code", "/c1?fields=status_code", "/9/media_publish"]);
  assert.equal(r.externalId, "m1");
});

test("the plugin manifest lists every module folder, and each module id matches its folder", () => {
  const plugin = JSON.parse(readFileSync(new URL("../manifest.json", import.meta.url)));
  assert.deepEqual(plugin.integrations, ["modules/linkedin", "modules/facebook", "modules/instagram"]);
  assert.ok(plugin.permissions.includes("integrations"));
  for (const f of plugin.integrations) {
    const m = JSON.parse(readFileSync(new URL(`../${f}/manifest.json`, import.meta.url)));
    assert.equal(m.id, f.split("/")[1]);
    assert.equal(m.kind, "social");
    assert.ok(m.actions.includes("publish"));
  }
});
