# @siheom/core — coverage behaviors

Intentional gaps (not line fillers). Target: statements ≥ 90%.
Prefer exercising public APIs through `runSiheom` / `defaultActions` / `defaultAssertions`.

## Runner

- [x] Assert steps dispatch through `runSiheom` (success)
- [x] Failed assertion includes logs and a non-empty a11y snapshot section
- [x] Invalid step throws `"Invalid step"`

## Actions (user-event behavior)

- [x] `fill` clears then types into a textbox
- [x] `type` appends into a focused textbox
- [x] `dblclick` fires on a button
- [x] `hover` moves pointer over a target (observable via mouseenter handler)
- [x] `tab` moves focus from the currently focused control
- [x] `upload` puts a File into a file input
- [x] sync `resolveElement` tab path

## Assertions

- [x] `visible` / `not.visible` (present vs missing vs aria-hidden)
- [x] `selected` / `not.selected` via aria-selected
- [x] `disabled` for native `disabled` and `aria-disabled`
- [x] `current` / `not.current` via aria-current
- [x] `count` / `not.count` for multiple matches
- [x] `value` / `href` / `errormessage` / `description`
- [x] `expanded` true/false
- [x] `checked` for radio inputs
- [x] `a11ySnapshot` matches a compact accessible tree
- [x] `tableSnapshot` matches markdown for a simple table
- [x] sync `resolveElement` assertion path
- [x] effect.elapsed / effect.runAllTimers through runner

## Query

- [x] `query.label` resolves by accessible label text
- [x] Invisible query path used by `visible(false)`

## A11y failure formatting (via getA11ySnapshot / failing assert)

- [x] Snapshot includes role, name, and checked state
- [x] Snapshot includes heading level / haspopup properties
- [x] Snapshot includes aria-describedby / aria-errormessage relations
- [x] Accessible names with quotes/newlines are escaped
- [x] Diverse fixtures: form states, dialog, nav current, listbox, slider/progress, tabs, toggle, combobox, tree, grid, live regions, drag-drop, menu, skip iframe/svg/presentation, rich relations, invalid grammar/spelling, select, verbose missing controls, computeOther

## tableToMarkdown

- [x] Renders thead/tbody cells as padded markdown
- [x] Empty table throws
- [x] Diverse fixtures: Korean padding, input cell, progress cell, mixed widths, ARIA table roles

## Absence and lists (siheom-issue, siheom-issue-2)

- [x] `not.visible` fails when the element is present and visible
- [ ] `count(target, 0)` passes when nothing matches
- [ ] `textContents` passes when list items' normalized text equals expected in order
- [ ] `textContents` fails when an extra item is present
- [ ] `textContents` accepts RegExp entries
- [ ] `textContents` ignores items of nested lists
- [ ] `textContents` picks child roles by container role (listbox → option, table → row, ...)
- [ ] `names` compares items' accessible names in order
- [ ] `createDefaultActions` accepts any user with the user-event method subset (e.g. `vitest/browser` `userEvent`)
