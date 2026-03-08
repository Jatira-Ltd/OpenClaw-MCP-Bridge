# MCP Bridge — Cost & Revenue Analysis

**Version**: 1.0  
**Date**: March 8, 2026  
**Status**: Final

---

## 1. The Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER'S MACHINE                                     │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  OpenClaw (self-hosted)                                             │    │
│  │                                                                      │    │
│  │  ┌─────────────────┐    ┌─────────────────────────────────────┐  │    │
│  │  │   MCP Bridge    │    │         Skill Store (ClawHub)       │  │    │
│  │  │   (free skill)  │    │                                     │  │    │
│  │  │                 │    │   Free:   skill-github              │  │    │
│  │  │  - install      │    │            skill-notion             │  │    │
│  │  │  - list         │    │            skill-slack              │  │    │
│  │  │  - call         │    │   Paid:   skill-github-pro ₹499/yr  │  │    │
│  │  │                 │    │            skill-notion-pro ₹499/yr │  │    │
│  │  └────────┬────────┘    └─────────────────────────────────────┘  │    │
│  │           │                                                            │    │
│  │           ▼                                                            │    │
│  │  ┌────────────────────────────────────────────────────────────────┐  │    │
│  │  │  npx @notionhq/mcp-server (runs locally, user's machine)      │  │    │
│  │  └────────────────────────────────────────────────────────────────┘  │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Cost to Us (Developer)

| Item | Cost | Notes |
|------|------|-------|
| **Development time** | ~20 hours | Build MCP Bridge skill |
| **Maintenance** | ~2 hrs/month | Bug fixes, MCP protocol updates |
| **Infrastructure** | $0 | Everything runs on user's machine |
| **Total Cost** | **$0** | Pure time investment |

**Why $0?**
- OpenClaw is self-hosted → no server costs
- MCP Bridge is a skill → lives in user's ~/.openclaw/
- npx runs locally → no hosting

---

## 3. Revenue Model

### How We Earn

```
MCP Bridge (free)
       │
       ▼
User discovers ClawHub skills
       │
       ├── Buys skill-github-pro: ₹499/yr ($6)
       ├── Buys skill-notion-pro: ₹499/yr ($6)
       ├── Buys skill-slack-pro:  ₹499/yr ($6)
       │
       ▼
Revenue flows to us
```

### Revenue Streams

| Stream | Description | Potential |
|--------|-------------|-----------|
| **Premium Skills** | Paid skills on ClawHub | High |
| **Consulting** | Help setup OpenClaw | Medium |
| **Sponsorships** | YouTube, content | Medium |
| **Spotlighted** | Your main product | High |

---

## 4. Why Free MCP Bridge?

| Reason | Explanation |
|--------|-------------|
| **No hosting cost** | User's machine runs everything |
| **Makes ecosystem valuable** | More tools → more users → more ClawHub sales |
| **Competitive pressure** | Claude Code has MCP built-in → we must match |
| **Funnel to ClawHub** | Free bridge → users browse skills → buy premium |

---

## 5. Simple Economics

```
Time Investment: ~20 hours (one-time)
Ongoing Cost:    $0

Revenue Potential:
├── If 100 users → 5 buy premium skill → ₹2,500/mo
├── If 500 users → 25 buy premium skill → ₹12,500/mo  
└── If 2000 users → 100 buy premium skill → ₹50,000/mo
```

**Realistic?** Start with ₹0. Build it, see traction, then optimize.

---

## 6. End-to-End User Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: User discovers MCP Bridge                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  User on X/Telegram/YouTube:                                                │
│  → "OpenClaw now has MCP Bridge - access 500+ tools"                       │
│  → Visits clawhub.com                                                       │
│  → Searches "mcp"                                                           │
│  → Finds "MCP Bridge" (free)                                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 2: User installs MCP Bridge                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  $ openclaw install @openclaw/mcp-bridge                                   │
│                                                                              │
│  Result:                                                                    │
│  ✅ Installed                                                                │
│     Commands: mcp install, mcp list, mcp call                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 3: User installs an MCP server                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  $ openclaw mcp install @notionhq/mcp-server                               │
│                                                                              │
│  Bridge:                                                                    │
│  → npx -y @notionhq/mcp-server (downloads once)                            │
│  → Runs initialization handshake                                           │
│  → Discovers tools: [create_page, search, query_database]                  │
│  → Saves to config                                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 4: User configures API key                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  $ openclaw mcp config @notionhq/mcp-server --api-key sk-xxx              │
│                                                                              │
│  OR via Control UI:                                                         │
│  Settings → MCP → @notionhq → Paste API Key → Save                        │
│                                                                              │
│  Stored in: ~/.openclaw/openclaw.json                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 5: User uses MCP tools via natural language                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  User (Telegram):                                                           │
│  "Create a Notion page called 'Q1 Planning'"                                │
│                                                                              │
│  Myra:                                                                      │
│  1. Identifies tool: notion.create_page                                    │
│  2. Spawns @notionhq/mcp-server (if not running)                           │
│  3. Sends JSON-RPC: tools/call { name: "create_page", arguments: {...} } │
│  4. Receives result                                                         │
│  5. Returns to user                                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 6: User discovers premium skills                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  User browses ClawHub:                                                       │
│  → Sees "skill-github-pro" (₹499/yr)                                       │
│  → "Advanced GitHub automation, PR reviews, issue management"              │
│  → Clicks "Buy Now"                                                         │
│  → Payment via Stripe/Razorpay                                             │
│  → Skill downloaded to ~/.openclaw/skills/                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Summary

| Aspect | Value |
|--------|-------|
| **Build Cost** | ~20 hours (time only) |
| **Running Cost** | $0 |
| **Revenue from MCP Bridge** | $0 (direct) |
| **Revenue from ClawHub** | Premium skill sales |
| **Purpose** | Drive users to ClawHub |

---

## 8. Decision

| Question | Answer |
|----------|--------|
| Should we build MCP Bridge? | **Yes** — makes OpenClaw competitive |
| Should it be paid? | **No** — free to drive adoption |
| How do we earn? | **ClawHub premium skills** |

**Next step:** Build the POC (install + call one tool)

