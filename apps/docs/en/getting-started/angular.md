# Angular quick start

This page covers running tests in a real browser, writing your first test, reading failure reports, and wrapping components with providers.

What you will learn:

- How to run tests in a real browser with vitest browser mode
- How to write your first test
- How to use action and assertion steps
- How to read the report when a test fails
- How to wrap components with providers

## Setup

siheom recommends **vitest browser mode** (Playwright provider) so UI renders in real Chromium (or another browser). jsdom and happy-dom are not recommended.

Dev dependencies:

```bash
yarn add -D vitest @vitest/browser playwright
yarn playwright install chromium
yarn add @siheom/angular @angular/core @angular/common @angular/compiler @angular/platform-browser
yarn add @testing-library/angular @testing-library/jest-dom @testing-library/user-event
```

`vitest.config.ts`:

```ts
/// <reference types="vitest" />
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: "./test/setupTests.ts",
    include: ["test/**/*.test.ts"],
    browser: {
      enabled: true,
      headless: true,
      provider: "playwright",
      instances: [{ browser: "chromium" }],
    },
  },
});
```

Angular needs `TestBed` initialized for JIT compilation. `test/setupTests.ts`:

```ts
import "@testing-library/jest-dom/vitest";
import "@angular/compiler";
import { TestBed } from "@angular/core/testing";
import { BrowserTestingModule, platformBrowserTesting } from "@angular/platform-browser/testing";

TestBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting());
```

Run:

```bash
yarn vitest
```

## Your first test

Pass steps to `runSiheom` in order. Do not use `await` in the test body — return `runSiheom(...)` and let the interpreter run.

```ts
import { describe, it } from "vitest";
import { actions, assertions, given, query, runSiheom } from "@siheom/angular";
import { CounterComponent } from "./counter.component";

describe("CounterComponent", () => {
  it("increments the counter", () => {
    return runSiheom(
      given.render(CounterComponent),
      actions.click(query.button("0")),
      actions.click(query.button("1")),
      assertions.visible(query.button("2")),
    );
  });
});
```

- `given.render` mounts `CounterComponent` in a real browser via `@testing-library/angular`'s `render`.
- `actions.click` presses the button that shows the current value, twice.
- `assertions.visible` checks that a button labeled `2` is on screen.
- `query.button("0")` finds the element by role `button` and accessible name `"0"`.

## What a failure looks like

When an assertion fails, siheom puts execution logs, the original error, and an accessibility snapshot into one `Error` message.

```ts
return runSiheom(
  given.render(CounterComponent),
  actions.click(query.button("0")),
  actions.click(query.button("1")),
  // Fails: the value is 2, not 3
  assertions.visible(query.button("3")),
);
```

Example report:

```text
[Logs]

click!      : button "0"
click!      : button "1"

[Original Error Message]

Unable to find an accessible element with the role "button" and name "3"

[A11y Snapshot]

- button "2"
```

You can see how far the test got (`[Logs]`), what went wrong (`[Original Error Message]`), and what is on screen (`[A11y Snapshot]`) in one place.

## Wrapping with providers

If a component depends on a DI token or service, extend `given.render`. `@testing-library/angular`'s `render` accepts `providers` as its second argument.

```ts
import { extendSiheom, defaultActions, defaultAssertions } from "@siheom/core";
import { render } from "@testing-library/angular";
import { ThemeService } from "./theme.service";

const { runSiheom, given, actions, assertions, query } = extendSiheom(
  {
    actions: defaultActions,
    assertions: defaultAssertions,
    givens: {
      render: async (component) => {
        await render(component, { providers: [ThemeService] });
      },
    },
  },
  {},
);
```

Export these bindings from a test helper module and reuse them across the suite. See [given](/en/concepts/given) for details.

## Next steps

- [Concepts overview](/en/concepts) — given / action / assert and locators
- [actions API](/en/configuration/actions) — click, fill, type, …
- [assertions API](/en/configuration/assertions) — visible, a11ySnapshot, …
- [Comparisons](/en/comparisons) — Testing Library and Playwright
