# Accessibility

ClosePilot should stay keyboard-readable, screen-reader friendly, and usable without color-only cues.

## Requirements

- Use semantic headings in order.
- Keep labels for form fields.
- Use `aria-label` for compact/icon-like controls.
- Keep focus visible on links, buttons, inputs, tabs, and drawer controls.
- Ensure drawer/menu state updates `aria-expanded`.
- Escape should close dismissible drawers where implemented.
- Status messages should use existing `role="status"` regions where present.
- Do not expose stack traces or raw provider errors.
- Do not use color alone for status. Keep text labels such as Locked, Demo, Live, Failed, Sent, or Simulated.
- Honor `prefers-reduced-motion`.

## Current Improvements

- Sidebar links include `aria-label` for compact mode.
- Mobile navigation has a real button with `aria-expanded` and `aria-controls`.
- Page header descriptions give screen-reader users quick context.
- Existing status messages remain text-based.
- Reduced-motion CSS continues to disable long transitions.

## Future Checks

- Add focused keyboard tests for lead modal, mobile drawer, and communications composer.
- Add dialog focus trapping for any newly introduced modal/drawer component.
- Add automated contrast checks before a large theme change.
