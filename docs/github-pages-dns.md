# DNS setup for GitHub Pages — aceconscious.studio

Apply these changes in **Squarespace Domains → aceconscious.studio → DNS Settings**.

GitHub username: **HedayatAbedijoo** → `www` CNAME target: **HedayatAbedijoo.github.io**

## KEEP (do not change)

| Action | TYPE | NAME | DATA |
|--------|------|------|------|
| KEEP | MX | @ | mxa.mailgun.org (priority 10) |
| KEEP | MX | @ | mxb.mailgun.org (priority 10) |
| KEEP | TXT | @ | v=spf1 include:mailgun.org... |
| KEEP | TXT | smtp._domainkey... | k=rsa; p=MIGfMA0GCSqG... |
| KEEP | CNAME | _domainconnect | _domainconnect.domains.squarespace.com |

## DELETE

| Action | TYPE | NAME | DATA |
|--------|------|------|------|
| DELETE | A | @ | 198.49.23.144 |
| DELETE | CNAME | www | ghs.googlehosted.com |
| DELETE | CNAME | jqm7n54hi... | gv-5kcrvvphsxadlb.dv.googlehosted.com |

## ADD

| Action | TYPE | NAME | DATA |
|--------|------|------|------|
| ADD | A | @ | 185.199.108.153 |
| ADD | A | @ | 185.199.109.153 |
| ADD | A | @ | 185.199.110.153 |
| ADD | A | @ | 185.199.111.153 |
| ADD | CNAME | www | HedayatAbedijoo.github.io |

TTL: 1 hour (or Squarespace default) is fine.

## After DNS propagates

1. Repo is pushed to GitHub with `CNAME` file (root of repo).
2. GitHub → repo **Settings → Pages** → deploy from **main** branch, **/ (root)**.
3. **Custom domain:** `aceconscious.studio` → wait for DNS check → enable **Enforce HTTPS**.

Propagation: usually under 1 hour; up to 24–48 hours in rare cases.
