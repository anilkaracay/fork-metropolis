# Design System

## Design intent

FORK should feel like a premium social product with financial credibility. It must not look like a generic crypto dashboard or an AI-generated hackathon template.

Keywords:

- editorial
- precise
- calm
- social
- high-signal
- tactile interaction
- financial trust without terminal density

## Theme

Ship polished accessible dark mode in P0. Full light mode and theme switching are P1; do not spend Day 1/2 implementing both.

Do not use large neon gradients, rainbow glows, excessive blur, pseudo-3D coins, or generic grid backgrounds.

### Dark tokens

```text
bg.canvas      #0B0D10
bg.surface     #111419
bg.elevated    #171B21
border.subtle  #252B33
text.primary   #F4F6F8
text.secondary #9CA6B2
text.muted     #6E7884
accent         #8BE28B
positive       #57C78B
negative       #F06D78
warning        #E8B55B
link           #8AB4FF
```

### Light tokens (P1 reference only)

```text
bg.canvas      #F6F7F8
bg.surface     #FFFFFF
bg.elevated    #F1F3F5
border.subtle  #DFE3E8
text.primary   #111418
text.secondary #59636F
text.muted     #7A8591
accent         #176B3A
positive       #147A4A
negative       #C43E4A
warning        #996A13
link           #245EC7
```

Exact CSS variables may move slightly after visual QA, but semantic roles must stay stable.

## Typography

Use one high-quality sans family with strong numerals. Prefer Inter, Geist, or a similarly neutral UI face available through the app framework.

Hierarchy:

- Display: 40/44, semibold, landing only
- H1: 28/34, semibold
- H2: 20/26, semibold
- H3: 16/22, semibold
- Body: 15/22, regular
- Small: 13/18
- Micro/meta: 12/16
- Numeric market data: tabular numerals

Avoid uppercase everywhere. Reserve uppercase for LONG/SHORT and tiny status tags.

## Layout

Desktop:

- max content width 1280px
- left nav 216px
- feed column 640-700px
- optional context rail 280-320px
- 24px main gutters

Mobile:

- full-width cards
- 16px page padding
- bottom navigation
- sticky primary fork/execute action where appropriate

## Spacing

Use 4px base scale:

4, 8, 12, 16, 20, 24, 32, 40, 48, 64.

Do not invent arbitrary spacing values unless required for alignment.

## Radius

- small control: 8px
- standard card: 12px
- modal/drawer: 16px
- pill: 999px

Avoid excessively rounded 24-32px cards.

## Thesis card

The card is the most important component in the product.

Required visual order:

1. author + context badges + time
2. market and direction
3. thesis text
4. risk parameters
5. social proof row
6. actions

`Fork` is the emphasized action. `Execute` is not shown as the dominant feed action.

## Direction treatment

LONG and SHORT use subtle semantic color, never full-card red/green backgrounds.

- LONG: positive text/icon and faint chip background
- SHORT: negative text/icon and faint chip background

## Fork change visualization

When composing a fork, changed fields show:

- old value, muted and struck or ghosted
- arrow
- new value, emphasized

Example:

```text
Target   4,350 -> 4,500
Leverage 3x    -> 2x
```

## Idea Tree visual language

The tree is a product signature.

Rules:

- root at left/top depending viewport
- clean 1px branch connectors
- selected path emphasized, unrelated branches de-emphasized
- P0 node color communicates direction/selection; no PnL color or profit claim
- execution state shown by small verified mark
- challenge branch gets an opposing-direction glyph, not a separate tree type
- zoom/pan only if library is stable; otherwise use deterministic nested layout for MVP

Recommended implementation for 3 days: React Flow only if it can be integrated in under 2 hours with accessibility preserved. Otherwise build a simple vertical lineage tree with CSS and recursive components.

## Motion

Motion should explain state, not decorate.

- 120-180ms for hover/focus
- 180-240ms for drawers and modals
- tree node insertion can animate opacity/translate once
- respect `prefers-reduced-motion`

## Loading states

Use skeletons only for actual asynchronous content. Prefer preserving layout over spinners.

Critical states:

- posting transaction
- waiting for Envio indexing
- Perpl enrollment
- order pending/fill
- Nansen enrichment

Each state gets plain-language copy and a retry path where possible.

## Accessibility

- WCAG AA contrast minimum
- all controls keyboard reachable
- visible focus ring
- buttons have descriptive accessible names
- directional color is always paired with text/icon
- charts/tree nodes have text alternatives
- modals trap focus and restore focus on close

## Copy voice

Short, confident, non-crypto-jargon-heavy.

Good:

- `Fork thesis`
- `Trade your version`
- `Verified on Perpl`
- `Forked from @anil`
- `3 traders improved this branch`

Avoid:

- `Revolutionizing social alpha`
- `Web3-powered`
- `AI-enhanced decentralized trading social graph`

## Visual QA checklist

Before submission, inspect at:

- 1440x900 desktop
- 1280x800 laptop
- 390x844 mobile
- 375x667 small mobile
- dark mode
- light mode only if P1 is explicitly implemented
- long thesis text
- empty state
- error state
- 20+ node tree
