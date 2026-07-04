# GitHub MCP setup (Cursor)

GitHub username for DNS and Pages: **HedayatAbedijoo**

## 1. Create a GitHub Personal Access Token

1. Open https://github.com/settings/personal-access-tokens/new
2. Scopes: **repo**, **read:org** (and **workflow** if you use Actions)
3. Copy the token

## 2. Set the token in your shell

Add to `~/.zshrc`:

```bash
export GITHUB_TOKEN="ghp_your_token_here"
```

Then run: `source ~/.zshrc`

## 3. MCP config (already added globally)

File: `~/.cursor/mcp.json` — uses `${env:GITHUB_TOKEN}` (no token stored in the file).

## 4. Restart Cursor

Settings → Tools & MCP → **github** should show a green dot.

Test in chat: "List my GitHub repositories"

## 5. Re-authenticate gh CLI (for terminal deploy)

```bash
gh auth login -h github.com
```

Choose HTTPS, authenticate via browser, account **HedayatAbedijoo**.

## Alternative: Docker local server

If the remote MCP URL fails, use Docker (see [GitHub MCP Cursor guide](https://github.com/github/github-mcp-server/blob/main/docs/installation-guides/install-cursor.md)).
