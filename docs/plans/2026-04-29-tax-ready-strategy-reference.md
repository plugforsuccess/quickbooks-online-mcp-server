# Wiley-Wilson Tax-Ready Books Strategy — Master Reference

**Purpose:** Single document combining the filing calendar, productized service vision, and supporting strategy. Use this as the source of truth when prompting AI tools to work on related projects.

**Last updated:** April 29, 2026 (rev. 2 — added competitive landscape after Tiddwell research)

---

## 1. The Strategic Goal

Master the bookkeeping and tax-readiness workflow for Wiley-Wilson Agency, Inc. first. Once proven, productize it as a service offering for other small businesses (working name: **Books Ready**).

Sequencing matters:
1. **Phase 1 (now → 60 days):** Get Wiley-Wilson books tax-ready
2. **Phase 2 (Q1 2027):** File 2025 returns successfully (TaxBandits + CPA)
3. **Phase 3 (Q2 2027+):** Land 3 pilot clients, refine playbook
4. **Phase 4 (12+ months):** Productize as SaaS

Don't take a paying client until Phase 2 is done. The successful filing IS the credibility.

### The Insight You're Selling

The category of "AI-native accounting" has been attempted. Tiddwell built a generalist version on Claude Desktop + MCP and never reached visible traction. Xero and Intuit have shipped their own official MCP servers — both generalist, neither tax-form-aware. Claude Cowork has positioned itself as a general AI coworker for accountants. None of these have cracked vertical specialization.

**The wedge that's still open:** vertical specialization (insurance agencies) + tax-readiness layer + AI-native UX, layered on top of QuickBooks Online — not a replacement for it.

The accounting engine is not the moat. Distribution and vertical expertise are the moat. Books Ready wraps QBO, adds the tax-form-aware layer that's missing, and goes to market through channels Cameron already has access to (Allstate captive network, Atlanta professional network, fraternal connections, QuoteSync customer base).

Don't lead the pitch with "AI-powered." Lead with "Allstate agency-specific" and "tax-ready."

---

## 2. Competitive Landscape

| Player | What they are | Status / traction | Gap they leave |
|---|---|---|---|
| **Tiddwell** | Experimental AI-native accounting OS on Claude Desktop + MCP, double-entry, local data | No public footprint beyond landing page; written in past tense; no GitHub repo, no install package, no users visible. Likely a stalled prototype. | Built the engine, never cracked distribution. Generalist with no vertical. |
| **Intuit QBO MCP Server** | Official MCP server for QuickBooks Online (CRUD entities only) | Shipped, 91 stars, 2 commits, very early. Apache-2.0 licensed. | No Reports API. No tax-form mapping. No vertical specialization. **This is the gap your fork is filling.** |
| **Xero MCP Server** | Official MCP server for Xero accounting | Shipped, npm-published, includes Reports API access | Generalist, no tax-readiness layer, smaller US small-business footprint than QBO |
| **Claude Cowork** | General AI coworker for desktop file/task work | Anthropic product, launched Jan 12, 2026; accountants using it for receipt processing, expense reports | Not vertical, not tax-form-aware, not a service offering |
| **Traditional bookkeepers** | Human-run monthly bookkeeping services | Established market, slow to adopt AI | Expensive, slow, not AI-leveraged, generic across industries |
| **Books Ready (Cameron's offering)** | Vertical-specialized, tax-form-aware bookkeeping on top of QBO + AI | In development | — |

**Position statement:** Books Ready is the only offering that combines (a) vertical insurance agency expertise, (b) tax-readiness as the design goal, (c) AI-native delivery via QBO MCP server, and (d) a service layer where a domain expert reviews and signs off. Each competitor has 1–2 of those four. None have all four.

---

## 3. Filing Calendar — 2025 Tax Year (Filed in 2026)

### What TaxBandits Handles

| Form | What | Due |
|---|---|---|
| W-2 / W-3 | Employee wage statements | Feb 2, 2026 |
| 1099-NEC | Contractor payments $600+ | Feb 2, 2026 |
| 1099-MISC | Rent, royalties | Feb 2 / Feb 17 |
| 940 | Annual federal unemployment | Feb 2, 2026 |
| 941 | Quarterly payroll | Apr 30 / Jul 31 / Nov 2 / Feb 2 |

### What TaxBandits Does NOT Handle

| Form | What | Tool |
|---|---|---|
| 1120-S | Federal S-corp return | TurboTax Business / CPA — due **Mar 16, 2026** |
| K-1 | Shareholder pass-through | Generated from 1120-S |
| GA Form 600S | Georgia S-corp return | GA Tax Center / CPA — due **Mar 16, 2026** |
| GA Form 500 | Personal GA return | GA Tax Center / TurboTax — due Apr 15 |
| Form 1040 | Personal federal | TurboTax / CPA — due Apr 15 |
| 1040-ES | Personal estimated | IRS Direct Pay (quarterly) |
| GA G-7 | Quarterly state withholding | GA Tax Center / payroll |

### Key Dates at a Glance

- **Jan 15:** Q4 2025 personal estimated tax
- **Feb 2:** Big day — W-2, 1099-NEC, 940, Q4 941 all due
- **Mar 16:** 1120-S + GA 600S (or extension via Form 7004)
- **Apr 15:** Personal 1040 + GA 500 + Q1 2026 estimated
- **Apr 30:** Q1 2026 941 + GA G-7
- **Jun 15:** Q2 2026 estimated
- **Jul 31:** Q2 2026 941 + GA G-7
- **Sep 15:** Q3 2026 estimated + extended 1120-S deadline
- **Oct 15:** Extended personal 1040 deadline
- **Nov 2:** Q3 2026 941 + GA G-7
- **Dec 15:** Q4 GA estimated

### Setup Required Now

1. **TaxBandits account** under Wiley-Wilson Agency, Inc. EIN
2. **EFTPS enrollment** for federal tax deposits (7-day mail lead time for PIN)
3. **Georgia Tax Center (GTC) account** for G-7 and 600S
4. **CPA engaged** — pick one before February (good ones fill up)

### Penalty Awareness

- Late 1120-S: **$255+/month** times shareholders, up to 12 months
- Late 941: **5%/month** up to 25%
- Late 1099: **$60–$310/form** depending on lateness
- Late GA filing: **5%/month** up to 25%

---

## 4. Tools Stack

### Bookkeeping Layer
- **QuickBooks Online** — Realm ID 9341456605421051
- **QBO MCP Server** (forked from Intuit's official) — for AI-driven analysis
- **Supabase dashboard** — bookkeeper UI (DM Mono / Fraunces fonts)

### Filing Layer
- **TaxBandits** — information returns + payroll forms
- **TurboTax Business** or **CPA** — income tax returns (1120-S, 600S, 1040)
- **EFTPS** — federal tax deposits
- **GA Tax Center** — state filings

### AI Layer
- **Claude Code** (browser) — primary dev environment
- **Claude / [claude.ai](http://claude.ai)** — financial advisor + analyst

---

## 5. The Productized Service — "Books Ready"

### Target Customer (First 10)

- Insurance agencies (captive/independent), $200K–$1.5M revenue
- 0–3 employees + 1–2 contractors
- S-corp or LLC
- On QuickBooks Online
- Owner-operator who currently does books or distrusts current bookkeeper

### Three-Tier Offering

| Tier | Name | Price | What |
|---|---|---|---|
| 1 | Books Reset | $1,500–$3,000 one-time | 12-month cleanup, COA rebuild, reconciliation |
| 2 | Books Ready Monthly | $400–$800/mo | Recurring categorization, monthly P&L, quarterly review |
| 3 | Books Ready + Filing | $1,200–$2,500/season | TaxBandits-handled forms + CPA handoff package |

### What's NOT in Scope

- Income tax returns (1120-S, 1065, 1040)
- Tax planning / strategy
- Sales tax filings
- Payroll processing (refer to Gusto)
- Audit representation
- Multi-state (start GA-only)

### Operating Model Constraint

Cameron cannot be the bookkeeper. He's the system architect.

- AI categorizes transactions (via QBO MCP server) → Cameron reviews exceptions (15–30 min/client/mo)
- AI generates monthly reports → Cameron records 5-min Loom walkthrough (15 min/client/mo)
- Realistic capacity: **25–40 monthly clients** at one person's review bandwidth

### Unit Economics (Estimated)

| Tier | Avg Price | Time | Effective Rate |
|---|---|---|---|
| Books Reset | $2,000 | ~10 hrs | $200/hr |
| Books Ready Monthly | $500 | ~1 hr/mo | $500/hr |
| Books Ready + Filing | $1,500 | ~5 hrs/season | $300/hr |

### Go-to-Market (First 90 Days After Filing 2025 Returns)

- **Days 1–30:** Be your own first customer — file Wiley-Wilson 2025 successfully
- **Days 31–60:** 3 pilot clients at 50% off (Allstate agents in Atlanta) for testimonials
- **Days 61–90:** Productize, launch one-pager, LinkedIn outreach to 50 agency owners

### Build-First List

1. Separate LLC formation for the service entity
2. Engagement letter template (lawyer-reviewed once, reused 50x)
3. Standardized COA template for insurance agencies (your most reusable asset)
4. Intake form (Typeform)
5. Case study from your own 2025 filing

---

## 6. Open Decisions

These are unresolved and need answers before Phase 3:

- [ ] Service entity name (Books Ready vs. alternatives)
- [ ] Service entity LLC formation timing
- [ ] CPA selection for Wiley-Wilson 2025 filing
- [ ] Whether Tracy is W-2 or 1099 (affects Jan 31 filings)
- [ ] Final QBO chart of accounts mapped to 1120-S form lines
- [ ] **Domain registration** — secure `[booksready.com](http://booksready.com)` (or chosen name) before further branding work
- [ ] **Trademark check** for the service name (USPTO Class 35 + Class 42, same path as PermitCheck)
- [ ] **Build on QBO indefinitely vs. eventually replace with native engine?** — **Decision: stay on QBO indefinitely.** The accounting engine is not the moat. Tiddwell proved building one is possible but doesn't drive traction.

---

## 7. Document Index

Other reference artifacts in this strategy:

- `[01-financial-advisor-prompt.md](http://01-financial-advisor-prompt.md)` — fractional CFO prompt for Wiley-Wilson
- `[02-qbo-reports-mcp-prompt.md](http://02-qbo-reports-mcp-prompt.md)` — full Reports API extension prompt
- `[03-claude-code-setup-guide.md](http://03-claude-code-setup-guide.md)` — Codespaces setup walkthrough
- `[04-one-shot-implementation-prompt.md](http://04-one-shot-implementation-prompt.md)` — combined dev session prompt

---

## 8. Honest Risks

The biggest risks to this whole plan, in order:

1. **Selling before delivering.** Don't take Books Ready clients before Wiley-Wilson 2025 is filed clean. The case study IS the marketing.
2. **Scope creep on the service.** "Can you just also handle..." kills service businesses. Stay narrow.
3. **MCP server staying local-only forever.** Fine for Wiley-Wilson, blocking for productization. Migrate to hosted when you have 3+ clients.
4. **CPA bottleneck in March.** Engage before February. Don't wait.
5. **Treating "Books Ready" like a product before it's a service.** Year 1 is service delivery. Productize year 2.

### Risks that are LOWER than initially feared

After the Tiddwell research run (April 29, 2026), two risks turned out to be smaller than they looked:

- **"A well-funded competitor will own this category before you launch."** Tiddwell tried the generalist version and stalled. Xero and Intuit shipped MCP servers that don't include the tax-readiness layer. Claude Cowork is positioned as a general AI coworker, not a vertical service. **The window is open.** Use it deliberately, don't rush.
- **"The technology will be commoditized fast."** It is being commoditized — but that's a feature, not a bug. The tech (MCP + Claude + QBO API) is now table stakes. The differentiator shifts to vertical expertise and distribution, both of which Cameron has. Commoditized infrastructure means a faster build, not a smaller business.

### A risk that is HIGHER than initially considered

- **Underpricing because "AI does the work."** It's tempting to discount because the marginal labor per client is low. Don't. Insurance agency owners pay $2K–$5K/year to a CPA for messy books. Books Ready offers year-round tax-readiness. Price like a service business with high judgment value, not a tooling business with low marginal cost.
