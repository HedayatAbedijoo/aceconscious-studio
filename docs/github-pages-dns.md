# DNS setup for GitHub Pages — aceconscious.studio

Apply these in **Squarespace → Domains → aceconscious.studio → DNS Settings**.

GitHub username: **HedayatAbedijoo** → `www` CNAME: **HedayatAbedijoo.github.io**

---

## Stuck? Cannot delete A @ 198.49.23.144

That row is under **Squarespace Domain Forwarding** — it has **no delete button** on the row.

1. In **Squarespace Domain Forwarding**, click **MANAGE RULES** (top right of that section).
2. Delete the forwarding rule (trash icon).
3. The A record **198.49.23.144** should disappear automatically.

If no rule appears: log out/in, try incognito, or delete **Squarespace Default** preset at the top (keep Mailgun presets).

When adding GitHub A records, if Squarespace shows **Conflicting domain forwarding rule** → click **Manage rules** in the popup and delete the rule.

Still blocked? Contact Squarespace: https://support.squarespace.com/hc/en-us/requests/new — ask to remove Domain Forwarding for `aceconscious.studio`.

Verify locally: `./scripts/verify-dns.sh`

---

## KEEP (do not change)

| TYPE | NAME | DATA |
|------|------|------|
| MX | @ | mxa.mailgun.org (priority 10) |
| MX | @ | mxb.mailgun.org (priority 10) |
| TXT | @ | v=spf1 include:mailgun.org... |
| TXT | smtp._domainkey... | Mailgun DKIM |
| CNAME | _domainconnect | _domainconnect.domains.squarespace.com |

## DELETE (Custom records section)

| TYPE | NAME | DATA |
|------|------|------|
| CNAME | www | ghs.googlehosted.com |
| CNAME | jqm7n54hi... | gv-5kcrvvphsxadlb.dv.googlehosted.com |

*(The Squarespace A record @ 198.49.23.144 is removed via MANAGE RULES above, not here.)*

## ADD (Custom records → ADD RECORD)

Add only after the Squarespace A record is gone:

| TYPE | NAME | DATA |
|------|------|------|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | HedayatAbedijoo.github.io |

---

## After DNS propagates

1. Site pushed to **HedayatAbedijoo/website** with root [`CNAME`](../CNAME) file (`aceconscious.studio`).
2. GitHub → **Settings → Pages** → branch **main**, folder **/ (root)**.
3. Custom domain **aceconscious.studio** → enable **Enforce HTTPS** when available.

Run `./scripts/deploy-github-pages.sh` after `gh auth login -h github.com -p ssh`.
