# Copilot Instructions

## Project: Cloud Networking Desk

This is a Copilot CLI extension pack (`@dmauser/cloud-networking`) providing 19 specialist agents for cloud networking tasks across Azure, AWS, and GCP, plus 14 firewall vendor platforms.

## Build & Run

```
# No build step — pure ES modules
node bin/cli.mjs init          # Install to ~/.copilot/extensions/
node bin/cli.mjs init --project # Install to .github/extensions/ in current repo
node bin/cli.mjs status        # Check installation
node bin/cli.mjs uninstall     # Remove
```

## Architecture

- `bin/cli.mjs` — CLI installer (init, status, uninstall)
- `extensions/cloud-networking/extension.mjs` — Main extension: `REGISTRY` (single source of truth), parameterized tool handlers, session hooks via `@github/copilot-sdk/extension`
- `extensions/cloud-networking/specialists/<name>/` — Each specialist has:
  - `agents/<name>.md` — Agent role definition (persona, workflow, guardrails)
  - `skills/<skill-name>/SKILL.md` — Deep domain expertise for each skill
- All specialists use **Pattern B** (separate files), not Pattern A (single SKILLS.md)

## Key Conventions

- **5 tools only — hard 128-tool API limit.** The CLI/model rejects sessions exposing >128 tools (request fails with "transient API error. Retrying..."). With 19 specialists × (role + orchestrate + ~6 skills) this would be ~162 tools, so tools are **parameterized**, not registered per-specialist. NEVER register one tool per specialist/skill.
- **The 5 tools:** `cn_capabilities`, `cn_route`, `cn_role({ specialist })`, `cn_orchestrate({ specialist })`, `cn_skill({ specialist, skill })`.
- **Single source of truth:** the `REGISTRY` object (prefix → `{ dir, domain, trigger, guidance, skills }`) generates routing, capabilities, orchestration prompts, and skill loading. Add specialists/skills by editing `REGISTRY` only.
- **Specialist prefixes:** vnet, fw, lb, dns, pl, hyb, nsec, ntsh, vwan, nmon, mcn, price, iac, cnet, cdn, nauto, sase, ncap, ipv6
- **Legacy names are references only:** strings like `vnet_skill_address_planner` are NOT callable tools; they're tolerated as the `skill` argument to `cn_skill` (normalized to kebab-case).
- **Routing:** Regex-based keyword detection in `onUserPromptSubmitted` hook injects guidance pointing at the parameterized tools.
- **All tools use `skipPermission: true`** — they deliver read-only content (markdown), not actions
- **No external dependencies** — only `@github/copilot-sdk/extension` and `node:*` builtins
- **Guardrail:** Every specialist output ends with "Analysis only — verify against vendor documentation before applying."
- **14 firewall vendors** in firewall-engineer: Azure FW, AWS NFW, GCP FW, PAN-OS, FortiGate, Check Point, Cisco ASA/FTD, Juniper SRX, Zscaler, Sophos XG, OPNsense, pfSense, VyOS, iptables/nftables
