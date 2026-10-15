# actions API

Every action returns a step object `(target: Locator, ...args)`. `target` is a [locator](/en/concepts/locator).

## List

| API | Args | Role |
| --- | --- | --- |
| `actions.click(target)` | — | `userEvent.click` |
| `actions.dblclick(target)` | — | `userEvent.dblClick` |
| `actions.fill(target, text)` | `text: string` | Clear, then type |
| `actions.type(target, text)` | `text: string` | Type without clearing |
| `actions.tab(target)` | — | Assert focus, then Tab |
| `actions.upload(target, file)` | `file: File` | Upload a file |
| `actions.hover(target)` | — | `userEvent.hover` |
| `actions.dragAndDrop(source, target)` | `target: Locator` | Drag and drop source onto target |

## Examples

```tsx
actions.click(query.button("Sign up"))
actions.fill(query.textbox(/password/i), "secret123456")
actions.upload(query.button("Choose file"), file)
actions.dragAndDrop(query.listitem("Design"), query.listitem("Done"))
```

## Real input (Vitest browser mode)

The default `user` is `@testing-library/user-event`, which dispatches synthetic events (`isTrusted: false`). If a component that detects outside interaction (e.g. Ark UI / zag) does not react, inject `userEvent` from `vitest/browser` (real Playwright input).

```tsx
import { userEvent } from "vitest/browser";
import { actions, assertions, createReactSiheom, given, query } from "@siheom/react";

const { runSiheom } = createReactSiheom({ user: userEvent });

await runSiheom(
  given.render(<PopoverExample />),
  actions.click(query.button("Open popover")),
  actions.click(query.button("Outside")),
  assertions.not.visible(query.dialog("Popover title")),
);
```

Inside `withFakeTimers`, the fake-timer user-event is still used.

## Custom actions

```ts
extendSiheom(base, {
  actions: {
    selectAccount: async (target, account: string) => {
      // implementation
    },
  },
});
```

New keys via `extendSiheom`; replace existing keys with `overrideSiheom`. See [Factory](/en/concepts/factory).

## Next steps

- [actions concept](/en/concepts/actions)
- [assertions API](/en/configuration/assertions)
