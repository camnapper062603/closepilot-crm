# Responsive Layouts

ClosePilot targets usable layouts at 320, 375, 390, 430, 768, 1024, 1280, and 1440 pixel widths.

## Mobile Principles

- No horizontal page scrolling.
- Primary action stays reachable.
- Navigation is a drawer, not a long horizontal list.
- Tap targets should be at least 40px high, preferably 44px.
- Tables and dense lists should stack or use priority rows.
- Forms should remain usable with the mobile keyboard.
- Modals and drawers must remain dismissible.

## Desktop Principles

- Sidebar remains persistent.
- Main content uses constrained panels and clear section order.
- Subpage navigation wraps or scrolls only when necessary.
- Do not create horizontal scrolling on desktop.

## Dense Screens

- Contacts: list first, profile as subpage/detail.
- Pipeline: essential card fields only.
- Communications: three-pane layout where space permits.
- Command centers: recommendation/priorities first, secondary evidence below.
- Settings/Admin: subpages split long forms.

## Testing

Use Playwright assertions for scroll width, active route, drawer behavior, and interaction. Screenshot-only validation is not enough.
