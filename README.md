# Socials for Agent Control

A plugin for [Agent Control](https://github.com/remcoeijsackers/agent-control) that brings **LinkedIn**, **Facebook pages**
and **Instagram** (business or creator). Agents write drafts; a post only goes out after the approver of that account
clicks **Publish**, now or at the time you schedule. No browser control and no passwords: everything goes through the
official APIs with your own app registration.

## What you get

- **Three integration modules**: `linkedin` (Posts API), `facebook` and `instagram` (Meta Graph API). You add accounts
  under **Settings → Integrations → Social**, each with its own owner and approver.
- **A Socials page** (**Plugins → Socials**): what is waiting for approval, a two-week content calendar and the recent
  posts, in the dashboard's own design.
- Drafts are approved where they always were in Agent Control: **Integrations → Social posts for approval**. The plugin
  itself cannot publish; it only reads the posts of its own accounts.

## Install

In Agent Control: **Plugins → Browse**, find **Socials** and click **Install**. Then turn it on under
**Plugins → Installed** for the workspaces that need it.

Or install a specific version: **Plugins → Installed → Install from a repository** with
`remcoeijsackers/mallows-plugin-socials`.

Accounts that already existed before Socials became a plugin keep working: their settings, keys and drafts stay in
Agent Control and come back as soon as the plugin is installed and on.

## Setting up the accounts

### LinkedIn

1. Create an app on developer.linkedin.com and link it to a LinkedIn page.
2. Request the product you need:
   - Personal profile: **Sign In with LinkedIn using OpenID Connect** and **Share on LinkedIn** (`w_member_social`).
   - Company page: **Community Management API** (`w_organization_social`). LinkedIn reviews this.
3. Set the redirect address shown on the integration under **Auth**. In Agent Control, enter the client ID, put the client
   secret in the key store and choose **Sign in**. You can also paste an access token from LinkedIn's token generator.
4. LinkedIn does not give regular apps a refresh token. An access token lasts about 60 days; sign in again after that.
5. The `LinkedIn-Version` header is `202605` by default; change it with the `apiVersion` setting.

### Facebook page and Instagram (Meta Graph API)

1. Create an app on developers.facebook.com (type Business) and add **Facebook Login for Business**.
2. Request the permissions you need. Publishing by anyone other than the app's admin requires **App Review**.
   - Facebook: `pages_show_list`, `pages_read_engagement` and `pages_manage_posts`.
   - Instagram (business or creator, linked to a Facebook page): `instagram_basic` and `instagram_content_publish`.
3. Preferably create a system user with access to the page under **Business settings → System users** and generate a
   token there that does not expire. The Graph API Explorer works too: exchange a user token for a long-lived one and
   take the page token from it.
4. Paste the token into Agent Control (it goes straight into the OS key store) and enter the page ID (Facebook) or the
   Instagram account ID (Instagram).
5. The Graph API version is `v26.0` by default; change it with `apiVersion`.

An Instagram post always needs an image with a public `https` URL.

## Layout

```
manifest.json          the plugin: permissions, the three modules, the /posts route and the Socials page
index.mjs              GET /posts: this plugin's posts in the current workspace, shortened for the page
modules/<id>/          one integration module each (manifest.json + index.mjs), see Agent Control's docs/integration-sdk.md
ui/index.html          the Socials page (sandboxed iframe, talks to /posts through the dashboard's bridge)
test/                  node --test, with a fake ctx: nothing is ever sent
```

Permissions it asks for: `integrations` (bring the three modules), `outbox` (read the drafts and posts of its own
accounts) and `routes` (the `/posts` route for its page).

## Develop

```bash
npm test
```

To try a change, install the folder itself: **Plugins → Installed → Install from a repository or a folder** with the path
to this checkout. Bump `version` in `manifest.json` (and in a module's manifest when you change that module) for every
release, so installations see the update.

## Licence

MIT
