#!/usr/bin/env bash
# Check aceconscious.studio DNS points to GitHub Pages
set -euo pipefail

DOMAIN="aceconscious.studio"
GITHUB_IPS=(185.199.108.153 185.199.109.153 185.199.110.153 185.199.111.153)
GITHUB_WWW="HedayatAbedijoo.github.io."

ok=0
fail=0

pass() {
  echo "OK   $1"
  ok=$((ok + 1))
}

fail_msg() {
  echo "FAIL $1"
  fail=$((fail + 1))
}

echo "=== DNS check: ${DOMAIN} ==="
echo ""

apex=$(dig +short "$DOMAIN" A | sort -u)
echo "A records (@):"
if [ -z "$apex" ]; then
  echo "  (none)"
else
  echo "$apex" | sed 's/^/  /'
fi
echo ""

www=$(dig +short "www.${DOMAIN}" CNAME | tr -d '\n')
echo "CNAME (www): ${www:-(none)}"
echo ""

mx=$(dig +short "$DOMAIN" MX | head -2)
echo "MX (email, should stay Mailgun):"
echo "$mx" | sed 's/^/  /'
echo ""

squarespace_ip=false
for ip in $apex; do
  [ "$ip" = "198.49.23.144" ] && squarespace_ip=true
done

github_count=0
for want in "${GITHUB_IPS[@]}"; do
  echo "$apex" | grep -qx "$want" && github_count=$((github_count + 1))
done

if [ "$squarespace_ip" = false ]; then pass "apex not on Squarespace (198.49.23.144)"; else fail_msg "apex still on Squarespace (198.49.23.144) — use MANAGE RULES"; fi
if [ "$github_count" -ge 4 ]; then pass "apex has 4 GitHub A records"; else fail_msg "apex missing GitHub A records ($github_count/4)"; fi
if [ "$www" = "$GITHUB_WWW" ]; then pass "www CNAME → HedayatAbedijoo.github.io"; else fail_msg "www not pointing to HedayatAbedijoo.github.io"; fi
if echo "$mx" | grep -q mailgun; then pass "Mailgun MX still present"; else fail_msg "Mailgun MX missing"; fi

echo ""
if [ "$fail" -eq 0 ]; then
  echo "DNS looks ready for GitHub Pages."
  exit 0
fi

echo "DNS not ready yet. See docs/github-pages-dns.md"
exit 1
