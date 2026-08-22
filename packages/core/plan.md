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

## Snapshot compatibility

- [x] The core entry point keeps accessibility and table snapshot utilities available.
