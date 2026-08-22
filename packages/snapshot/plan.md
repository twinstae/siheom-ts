# @siheom/snapshot — extraction behaviors

- [x] Root interface exports accessibility and table snapshot utilities.
- [x] `./aria-roles` remains independently importable.

## Accessibility tree

- [x] Snapshot includes role, name, and checked state.
- [x] Snapshot includes heading level and haspopup properties.
- [x] Snapshot includes aria-describedby and aria-errormessage relations.
- [x] Accessible names with quotes and newlines are escaped.
- [x] Diverse fixtures cover forms, dialogs, navigation, listboxes, sliders, tabs, trees, grids, live regions, drag-and-drop, menus, relations, invalid states, selects, hidden content, and computeOther.

## Table markdown

- [x] Renders thead/tbody cells as padded markdown.
- [x] Empty tables throw.
- [x] Diverse fixtures cover Korean padding, input and progress cells, mixed widths, and ARIA table roles.
