# Skill: ASCII / Text Topology Diagram (console default)

## Purpose

**Plain-text / ASCII is the default topology format shown in the console.** It needs
zero rendering engine, displays correctly in any terminal, SSH session, plaintext
chat, code comment, commit message, or log — making it the right first choice when a
topology is produced inline in the CLI.

This skill draws network topologies using ASCII / Unicode box-drawing characters. It
defines a consistent box, connection, and labeling notation plus reusable templates
for common cloud topologies (hub-spoke, multi-region, transit gateway).

## 🔁 Always keep the richer formats one ask away

Plain text is the console default, but it is **not** the only option. At the end of
every ASCII topology, append a short offer so the user can upgrade to a graphical
format:

> *Want this as a graphical diagram? I can also generate it as:*
> - *Mermaid* (renders inline in GitHub / VS Code / chat) — say "give me the Mermaid version" → `vnet_skill_network_diagram`.
> - *Excalidraw* (`.excalidraw` JSON, hand-drawn / whiteboard style) — say "give me the Excalidraw version" → `vnet_skill_excalidraw_diagram`.
> - *draw.io* (`.drawio` XML with native Azure/AWS/GCP stencils) — say "give me the draw.io version" → `vnet_skill_drawio_diagram`.

Do **not** generate the richer formats by default — they are opt-in to keep the
console response focused.

## Core Knowledge

### Drawing characters

Prefer Unicode box-drawing for clean output; fall back to pure ASCII (`+ - | =`) when
the user asks for ASCII-only or a strictly 7-bit-safe target.

| Purpose | Unicode | ASCII-safe |
|---------|---------|------------|
| Box corners | `┌ ┐ └ ┘` | `+` |
| Box edges | `─` (h) · `│` (v) | `-` · `\|` |
| Nested / container edge | `╔ ╗ ╚ ╝ ═ ║` | `#` / `=` |
| Tee / junction | `├ ┤ ┬ ┴ ┼` | `+` |
| Arrowheads | `▲ ▼ ◄ ►` or `< > ^ v` | `< > ^ v` |

### Connection notation

| Connection | Text notation | Use for |
|------------|---------------|---------|
| Peering (bidirectional) | `<──────>` | VNet/VPC peering |
| One-way traffic flow | `────────>` | Directed traffic / egress |
| VPN tunnel (encrypted) | `~~~~~~~~` or `- - - -` | S2S VPN / IPsec |
| ExpressRoute / Direct Connect / Interconnect | `========` | Dedicated private link |
| Route / UDR (next hop) | `··········>` or `. . . >` | UDR pointing at a next hop |

Always **label the link** inline or just above/below it: `<──VNet Peering──>`,
`══ExpressRoute══`, `~~S2S VPN~~`.

### Labeling conventions

1. **Always include CIDR ranges** in network and subnet boxes: `Web Subnet 10.1.1.0/24`.
2. **Include IPs** for key appliances: `Azure Firewall 10.0.1.4`.
3. **Put the canonical product name** in the box (`Azure Firewall`, not just `Firewall`)
   so the resource type is unambiguous without icons.
4. **Add a region tag** to each network box for multi-region designs: `Hub VNet — East US`.
5. Optionally prefix a box with an emoji marker (🛡️ firewall, 🔐 VPN gw, ⚖️ LB, 🌐 VNet,
   🏢 on-prem, ☁️ internet, 🔒 private endpoint) — but never rely on it alone; the text
   label carries the meaning.

### Template: Hub-Spoke topology

```text
                         ┌──────────────────────────────────────────┐
                         │  Hub VNet  (10.0.0.0/16) — East US        │
                         │  ┌───────────────┐  ┌──────────────────┐  │
                         │  │ Azure Firewall│  │ VPN Gateway      │  │
                         │  │ 10.0.1.4      │  │ 10.0.255.4       │  │
                         │  └───────────────┘  └────────┬─────────┘  │
                         └─────────┬────────────────────┴────────────┘
                  <──VNet Peering──┤                    ║ ~~S2S VPN~~
            ┌──────────────────────┴────┐               ║
            │ Spoke-Prod (10.1.0.0/16)  │      ┌─────────╨────────────┐
            │  Web  10.1.1.0/24         │      │ On-Premises          │
            │  App  10.1.2.0/24         │      │ 192.168.0.0/16       │
            │  Data 10.1.3.0/24         │      └──────────────────────┘
            └───────────────────────────┘
                                                ┌──────────────────────┐
                  <───────VNet Peering─────────>│ Spoke-Dev (10.2/16)  │
                                                │ Dev 10.2.0.0/20      │
                                                └──────────────────────┘

  Egress:  Spoke-* ··UDR 0.0.0.0/0 → 10.0.1.4··> Azure Firewall ────> ☁️ Internet
  Legend:  <──> peering · ~~ VPN · ··> UDR
```

### Template: Multi-region with global peering

```text
   ┌─────────── East US ───────────┐        ┌────────── West Europe ─────────┐
   │ Hub-East (10.0.0.0/16)        │        │ Hub-West (10.4.0.0/16)         │
   │  Firewall 10.0.1.4            │        │  Firewall 10.4.1.4             │
   │  ER Gateway 10.0.255.4        │        │  ER Gateway 10.4.255.4         │
   └───────┬───────────────┬───────┘        └───────┬───────────────┬────────┘
           │ Regional      │  <══════ Global VNet Peering ══════>    │
           │ Peering       ║                        │ Regional Peering
   ┌───────┴───────┐       ║ ExpressRoute   ┌───────┴────────┐       ║ ExpressRoute
   │ Prod-East     │       ║                │ Prod-West      │       ║
   │ 10.1.0.0/16   │       ║                │ 10.5.0.0/16    │       ║
   └───────────────┘       ║                └────────────────┘       ║
                           ╚════════ On-Prem DC 192.168.0.0/16 ══════╝
   Legend:  <──> peering · == ExpressRoute
```

### Template: AWS Transit Gateway

```text
                          ┌──────────────────────┐
                          │   Transit Gateway     │
                          └───┬───────┬───────┬───┘
              Attachment ─────┘       │       └───── Attachment
        ┌───────────────────┐   Attachment   ┌───────────────────┐
        │ Shared Svc VPC    │        │        │ Prod VPC          │
        │ 10.0.0.0/16       │  ┌─────┴──────┐ │ 10.1.0.0/16       │
        │  NAT Gateway      │  │ Dev VPC    │ │  Public 10.1.0/24 │
        │  Network Firewall │  │ 10.2.0.0/16│ │  Priv   10.1.10/24│
        └─────────┬─────────┘  └────────────┘ └───────────────────┘
                  │
   NAT ────> ☁️ Internet            TGW ~~VPN~~ On-Premises
```

### Generation workflow

When generating an ASCII topology from a user's description:

1. **Inventory** — list every VNet/VPC with CIDR + region, subnets with CIDR + purpose,
   and appliances (FW/GW/LB/bastion) with IPs.
2. **Pick a layout** — hub centered with spokes below (hub-spoke), left/right split
   (multi-region), or a vertical stack (single-VNet detail).
3. **Draw containers first** — outer network boxes, then subnet/appliance boxes inside
   by indentation and alignment.
4. **Wire connections** — draw peering/VPN/ExpressRoute/UDR lines between boxes using
   the notation table; label every link.
5. **Align columns** — keep box widths consistent and vertical edges aligned so the
   diagram reads cleanly in a monospace font.
6. **Validate** — every labeled CIDR matches the address plan, no orphaned boxes, and
   each connection type is accurate.

Emit the diagram inside a fenced ```` ```text ```` block so it stays monospaced. If the
user asks to save it, write to
`network-desk/vnet-architect/diagrams/<topic>-<YYYYMMDD>.txt`, e.g.
`hub-spoke-3region-20260528.txt`.

### Tips for readable ASCII diagrams

- **Use a monospace fence** (```` ```text ````) — proportional fonts break alignment.
- **Keep box widths uniform** within a row so vertical edges line up.
- **Limit nesting to 2 levels** — network box as container, subnet/appliance boxes
  inside. Deeper nesting gets unreadable fast in text.
- **For large topologies (10+ networks)**, produce an overview (networks as single
  boxes, no subnet detail) plus per-network detail diagrams.
- **Add a legend** line under the diagram explaining link notation
  (`<──> peering · ~~ VPN · == ExpressRoute · ··> UDR`).
- **Stay ≤ ~100 columns wide** so the diagram doesn't wrap in a standard terminal.

## References

- Unicode Box Drawing block (U+2500–U+257F): https://en.wikipedia.org/wiki/Box-drawing_character
- Azure architecture networking: https://learn.microsoft.com/azure/architecture/networking/
- AWS architecture: https://aws.amazon.com/architecture/

**Analysis only — verify against vendor documentation before applying.**
