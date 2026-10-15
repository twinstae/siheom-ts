# actions API

모든 action은 `(target: Locator, ...args)` 형태의 스텝 객체를 반환합니다. `target`은 [locator](/concepts/locator)입니다.

## 목록

| API | 인자 | 설명 |
| --- | --- | --- |
| `actions.click(target)` | — | `userEvent.click` |
| `actions.dblclick(target)` | — | `userEvent.dblClick` |
| `actions.fill(target, text)` | `text: string` | clear 후 입력 |
| `actions.type(target, text)` | `text: string` | clear 없이 입력 |
| `actions.tab(target)` | — | 포커스 확인 후 Tab |
| `actions.upload(target, file)` | `file: File` | 파일 업로드 |
| `actions.hover(target)` | — | `userEvent.hover` |
| `actions.dragAndDrop(source, target)` | `target: Locator` | source에서 target으로 드래그 앤 드롭 |

## 예시

```tsx
actions.click(query.button("가입하기"))
actions.fill(query.textbox(/비밀번호/), "secret123456")
actions.upload(query.button("파일 선택"), file)
actions.dragAndDrop(query.listitem("디자인"), query.listitem("완료"))
```

## 실제 입력으로 실행하기 (Vitest browser 모드)

기본 `user`는 `@testing-library/user-event`의 합성 이벤트(`isTrusted: false`)입니다. Ark UI(zag)처럼 바깥 상호작용을 감지하는 컴포넌트가 반응하지 않으면, `vitest/browser`의 `userEvent`(Playwright 실제 입력)를 주입하세요.

```tsx
import { userEvent } from "vitest/browser";
import { actions, assertions, createReactSiheom, given, query } from "@siheom/react";

const { runSiheom } = createReactSiheom({ user: userEvent });

await runSiheom(
  given.render(<PopoverExample />),
  actions.click(query.button("팝오버 열기")),
  actions.click(query.button("바깥 버튼")),
  assertions.not.visible(query.dialog("팝오버 제목")),
);
```

`withFakeTimers` 안에서는 가짜 타이머용 user-event를 그대로 씁니다.

## 커스텀 action

```ts
extendSiheom(base, {
  actions: {
    selectAccount: async (target, account: string) => {
      // 구현
    },
  },
});
```

새 키는 `extendSiheom`, 기존 키 교체는 `overrideSiheom`입니다. [Factory](/concepts/factory)를 참고하세요.

## 다음 단계

- [action 개념](/concepts/actions)
- [assertions API](/configuration/assertions)
