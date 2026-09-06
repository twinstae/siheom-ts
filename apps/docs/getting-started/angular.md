# Angular 빠른 시작

실제 브라우저에서 첫 시험을 작성하고, 실패 리포트를 읽고, provider로 컴포넌트를 감싸는 방법까지 이 페이지에서 다룹니다.

이 페이지에서 배우는 것:

- vitest browser mode로 실제 브라우저에서 시험을 실행하는 방법
- 첫 시험을 작성하는 방법
- 액션과 assertion 스텝을 쓰는 방법
- 시험이 실패했을 때 리포트를 읽는 방법
- provider로 컴포넌트를 감싸는 방법

## 설정

siheom은 **vitest browser mode**(Playwright provider)에서 실제 Chromium 등으로 UI를 렌더하는 것을 권장합니다. jsdom이나 happy-dom은 권장하지 않습니다.

필요한 dev dependency:

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

Angular는 `TestBed`를 JIT 컴파일 환경으로 초기화해야 합니다. `test/setupTests.ts`:

```ts
import "@testing-library/jest-dom/vitest";
import "@angular/compiler";
import { TestBed } from "@angular/core/testing";
import { BrowserTestingModule, platformBrowserTesting } from "@angular/platform-browser/testing";

TestBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting());
```

실행:

```bash
yarn vitest
```

## 첫 시험

`runSiheom`에 스텝을 순서대로 넘깁니다. 시험 본문에는 `await`를 쓰지 않고, `return runSiheom(...)`으로 인터프리터에 실행을 맡깁니다.

```ts
import { describe, it } from "vitest";
import { actions, assertions, given, query, runSiheom } from "@siheom/angular";
import { CounterComponent } from "./counter.component";

describe("CounterComponent", () => {
  it("값을 증가시킬 수 있다", () => {
    return runSiheom(
      given.render(CounterComponent),
      actions.click(query.button("0")),
      actions.click(query.button("1")),
      assertions.visible(query.button("2")),
    );
  });
});
```

- `given.render`가 `CounterComponent`를 `@testing-library/angular`의 `render`로 실제 브라우저에 마운트합니다.
- `actions.click`이 현재 값을 표시하는 버튼을 두 번 누릅니다.
- `assertions.visible`이 값 `2`인 버튼이 보이는지 확인합니다.
- `query.button("0")`은 role `button`과 accessible name `"0"`으로 요소를 찾습니다.

## 실패하면 어떻게 보이나

잘못된 assertion으로 실패하면, siheom은 실행 로그·원본 에러·접근성 스냅샷을 한 `Error` 메시지에 담습니다.

```ts
return runSiheom(
  given.render(CounterComponent),
  actions.click(query.button("0")),
  actions.click(query.button("1")),
  // 실제 값은 2인데 3을 기대하면 실패합니다
  assertions.visible(query.button("3")),
);
```

실패 시 리포트 예시:

```text
[Logs]

click!      : button "0"
click!      : button "1"

[Original Error Message]

Unable to find an accessible element with the role "button" and name "3"

[A11y Snapshot]

- button "2"
```

어느 스텝까지 성공했는지(`[Logs]`), 무엇이 기대와 달랐는지(`[Original Error Message]`), 화면에 무엇이 있는지(`[A11y Snapshot]`)를 한곳에서 볼 수 있습니다.

## provider로 감싸기

DI 토큰이나 서비스를 주입해야 하면 `given.render`를 확장합니다. `@testing-library/angular`의 `render`는 두 번째 인자로 `providers`를 받습니다.

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

이 바인딩을 테스트 헬퍼 모듈로 export해 suite 전체에서 재사용합니다. 자세한 내용은 [given](/concepts/given)을 참고하세요.

## 다음 단계

- [개념 개요](/concepts) — given / action / assert와 locator
- [actions API](/configuration/actions) — click, fill, type 등
- [assertions API](/configuration/assertions) — visible, a11ySnapshot 등
- [비교](/comparisons) — Testing Library·Playwright와의 관계
