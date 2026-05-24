# 家忆 Home Memory Design Context

## Design Register

Product UI. The interface serves repeated household inventory tasks, so clarity, touch comfort, and trust matter more than novelty.

## Scene

A family member uses the app on an iPhone while standing near a cabinet, refrigerator, drawer, or shelf. Lighting may be uneven, the user may be holding the phone with one hand, and the session should move quickly from photo to confirmation.

## Color Strategy

Restrained warm neutral system with one clay accent for primary actions and active selections.

- Background: warm off-white, slightly tinted, never pure white.
- Surface: subtle layered warm neutrals for panels, cards, and controls.
- Accent: clay/coral for primary actions, active tabs, focus, and key confirmation states only.
- Dark surface: used for photo/candidate review areas where image contrast matters.
- Semantic colors: success, warning, danger, and info should be tokenized and used consistently.

## Tokens

Current CSS tokens live in `styles.css` under `:root`.

- `--bg`, `--surface`, `--surface-2`, `--surface-card`, `--surface-strong`
- `--surface-dark`, `--surface-dark-2`, `--surface-dark-3`
- `--ink`, `--body`, `--muted`, `--muted-soft`, `--ink-inverse`, `--muted-inverse`
- `--accent`, `--accent-strong`, `--accent-hover`, `--text-on-accent`
- `--success`, `--warning`, `--danger`, `--info`
- `--line`, `--line-strong`, `--line-inverse`
- `--focus`, `--focus-ring`
- `--radius`, `--radius-lg`
- `--motion-fast`, `--motion-medium`

New color values should become semantic tokens before use if they will appear in more than one place.

## Typography

Use the platform sans stack for all product UI, including headings:

`-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", Arial, sans-serif`

Avoid display serif fonts in labels, buttons, cards, and dense task surfaces. Hierarchy should come from size, weight, spacing, and placement.

## Layout

- iPhone-first: primary controls need to work at 390px wide and smaller.
- Use bottom navigation for the three main app modes.
- Space tabs may wrap on mobile; do not hide essential navigation behind undiscoverable horizontal scroll.
- Avoid nested card stacks. Use panels for major task areas and cards for repeated records or candidate reviews.
- Photo and candidate stages should preserve stable aspect ratios and avoid layout jumps.

## Interaction

- Touch targets for primary controls should be at least 44x44px.
- Keyboard focus must remain visible for browser and simulator accessibility testing.
- Dialogs need focus entry, Escape close, Tab containment, and focus restoration.
- Motion should communicate state only. Respect `prefers-reduced-motion`.

## Component Vocabulary

- Primary button: only for confirm/search/main action.
- Secondary button: upload, camera, restore, navigation-adjacent actions.
- Ghost/icon button: tertiary edits, delete, reset, close.
- Pills: counts, status, confidence, due state.
- Candidate frame: direct manipulation target for object boxes; must also support keyboard adjustment.
- Bottom tabs: global mode switch, always visible in the iOS-style shell.

## Bans

- No gradient text.
- No decorative glassmorphism.
- No side-stripe status bars on cards.
- No pure `#000` or `#fff` for UI color.
- No disabled zoom on mobile.
- No hover-only affordance for touch workflows.
