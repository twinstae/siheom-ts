# assertions API

Assertions return step objects `(target: Locator, ...args)`. `assertions.not.*` negates the same assertion.

## State assertions

| API | Role |
| --- | --- |
| `assertions.visible(target)` | Visible |
| `assertions.checked(target)` | Checked |
| `assertions.expanded(target)` | `aria-expanded=true` |
| `assertions.selected(target)` | `aria-selected=true` |
| `assertions.disabled(target)` | Disabled |
| `assertions.focused(target)` | Focused |
| `assertions.current(target, value)` | `aria-current` |
| `assertions.count(target, n)` | Match count (`0` asserts absence) |
| `assertions.value(target, string)` | Form value |
| `assertions.textContent(target, string)` | Element text content |
| `assertions.href(target, string)` | Link `href` |
| `assertions.description(target, string)` | Accessible description |
| `assertions.errormessage(target, string)` | Accessible error message |

## List assertions

Pick the container's **direct items** by its role and compare them in order, all of them. Items of nested containers with the same role are skipped.

| Container | Items |
| --- | --- |
| `list` | `listitem` |
| `listbox` | `option` |
| `menu` | `menuitem` |
| `tablist` | `tab` |
| `radiogroup` | `radio` |
| `table`, `rowgroup` | `row` |

| API | Role |
| --- | --- |
| `assertions.textContents(container, expected)` | Item text (whitespace-normalized) — strings match exactly, RegExps match |
| `assertions.names(container, expected)` | Item accessible names — strings match exactly, RegExps match |

```tsx
// "only these" + order
assertions.textContents(query.listbox("Speaker"), ["GM", "Player", "Guard"])
assertions.textContents(query.list("Session log"), [/^GMThe door opens/, /^It is dark/])
assertions.names(query.list("Session log"), ["Master GM", "Player Player"])
// count within a scope
assertions.count(query.within(query.list("Active characters"), query.listitem(/./)), 10)
```

`assertions.not.visible` passes only when the element is missing, hidden from the accessibility tree, or not visible.

Negated: `assertions.not.visible`, `not.checked`, `not.expanded`, `not.selected`, `not.disabled`, `not.focused`, `not.current`, `not.count`, `not.value`, `not.textContent`, `not.href`, `not.errormessage`.

## Snapshot assertions

| API | Role |
| --- | --- |
| `assertions.a11ySnapshot(target, path)` | A11y tree → `__snapshots__/${path}` |
| `assertions.tableSnapshot(target, path)` | `<table>` → markdown → `__snapshots__/${path}` |

`tableSnapshot` requires `HTMLTableElement` as the target.

## Examples

```tsx
assertions.visible(query.button("2"))
assertions.href(query.link("First post"), "/articles/1")
assertions.errormessage(query.textbox(/email/i), "Invalid email format")
assertions.a11ySnapshot(query.region("signup-form"), "signup-form-initial.snap")
assertions.not.visible(query.button("Delete"))
```

## Custom assertions

```ts
extendSiheom(base, {
  assertions: {
    hasToast: async (target, message: string) => { /* ... */ },
  },
});
```

## Next steps

- [assertions concept](/en/concepts/assertions)
- [Accessibility snapshot](/en/concepts/a11y-snapshot)
- [Message map](/en/configuration/messages)
