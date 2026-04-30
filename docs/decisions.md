# Decisions

Strategic decision log for PermitCheck. Each entry is durable framing for future scope decisions, not a commitment to immediate scope.

---

## D29 — Investor product is the wedge, carrier dynamic-risk-pricing is the company

**Thesis.** The MVP is sold to real estate investors at $29 because that's the audience that pays for analysis directly with a short sales cycle. The long-term product is dynamic risk pricing for insurance carriers based on attested-system-age data derived from permits. This is structurally a better risk model than carriers' current static-data approach (year built, roof age, ZIP), and Cameron's domain expertise + agency distribution makes him uniquely positioned to build it.

**Implication for build decisions.** The analysis layer should structure permit data in ways that support both products. Tag permits by system (roof / electrical / plumbing / HVAC / structural) and outcome (finaled / expired / never-inspected) even though the investor report doesn't surface this explicitly. Don't optimize the data model for the $29 product if doing so blocks the $500K/year product.

**What this is not.** A commitment to ship the carrier product before the investor product proves out. The MVP roadmap (PR1–PR16+) is unchanged. This is a frame for resolving future scope decisions, not a new scope.

---

## D30 — Agent channel as middle-of-funnel scaling, not MVP

**Thesis.** Buyer's agents (especially investor-focused agents, listing agents pre-clearing listings, and agents in litigation-prone markets) are a high-leverage distribution channel for PermitCheck. The agent SKU is post-MVP and ships as a monthly subscription with white-label options, not per-report pricing. The agent channel is a stepping stone to the carrier product (D29) — agent volume creates the dataset that makes the carrier product valuable.

**What this is not.** A commitment to ship the agent SKU before the investor MVP proves out. The MVP roadmap (PR1–PR16+) is unchanged. The investor product's analytical engine is what the agent SKU repackages; getting the engine right for investors makes everything downstream easier.

**Implication for build decisions.** When designing report-generation prompts (PR10+), structure the prompt so the analytical findings are audience-agnostic and the framing (investor vs. agent vs. carrier) is a separate prompt-engineering layer. Don't bake "this is an investor report" assumptions into the analysis layer.
