# assertions API

assertion은 `(target: Locator, ...args)` 형태의 스텝 객체를 반환합니다. `assertions.not.*`는 같은 assertion의 부정입니다.

## 상태 assertion

| API | 설명 |
| --- | --- |
| `assertions.visible(target)` | 보임 (`not.visible`은 요소가 없거나, 접근성 트리에서 숨겨졌거나, 화면에 보이지 않을 때만 통과) |
| `assertions.checked(target)` | 체크됨 |
| `assertions.expanded(target)` | `aria-expanded=true` |
| `assertions.selected(target)` | `aria-selected=true` |
| `assertions.disabled(target)` | 비활성 |
| `assertions.focused(target)` | 포커스됨 |
| `assertions.current(target, value)` | `aria-current` |
| `assertions.count(target, n)` | 매칭 개수 (`0`이면 요소가 없음을 확인) |
| `assertions.value(target, string)` | 폼 value |
| `assertions.textContent(target, string)` | 요소 text content |
| `assertions.href(target, string)` | 링크 `href` |
| `assertions.description(target, string)` | accessible description |
| `assertions.errormessage(target, string)` | accessible error message |

## 목록 assertion

컨테이너 역할에 따라 **직접 속한 항목**을 골라 순서대로, 빠짐없이 비교합니다. 중첩된 같은 역할 컨테이너의 항목은 제외합니다.

| 컨테이너 | 항목 |
| --- | --- |
| `list` | `listitem` |
| `listbox` | `option` |
| `menu` | `menuitem` |
| `tablist` | `tab` |
| `radiogroup` | `radio` |
| `table`, `rowgroup` | `row` |

| API | 설명 |
| --- | --- |
| `assertions.textContents(container, expected)` | 항목 text (공백 정규화) — 문자열은 전체 일치, 정규식은 매칭 |
| `assertions.names(container, expected)` | 항목 accessible name — 문자열은 전체 일치, 정규식은 매칭 |

```tsx
// "이것만 있다" + 순서
assertions.textContents(query.listbox("마스터 화자"), ["GM", "Player", "경비병"])
assertions.textContents(query.list("세션 로그"), [/^GM문이 열린다/, /^안은 어둡다/])
assertions.names(query.list("세션 로그"), ["마스터 GM", "플레이어 Player"])
// 범위를 좁혀 세기
assertions.count(query.within(query.list("활성 캐릭터"), query.listitem(/./)), 10)
```

부정: `assertions.not.visible`, `not.checked`, `not.expanded`, `not.selected`, `not.disabled`, `not.focused`, `not.current`, `not.count`, `not.value`, `not.textContent`, `not.href`, `not.errormessage`.

## 스냅샷 assertion

| API | 설명 |
| --- | --- |
| `assertions.a11ySnapshot(target, path)` | 접근성 트리 → `__snapshots__/${path}` |
| `assertions.tableSnapshot(target, path)` | `<table>` → 마크다운 → `__snapshots__/${path}` |

`tableSnapshot`은 target이 `HTMLTableElement`여야 합니다.

## 예시

```tsx
assertions.visible(query.button("2"))
assertions.href(query.link("첫 번째 글"), "/articles/1")
assertions.errormessage(query.textbox(/이메일/), "올바른 이메일 형식이 아닙니다")
assertions.a11ySnapshot(query.region("signup-form"), "signup-form-initial.snap")
assertions.not.visible(query.button("삭제"))
```

## 커스텀 assertion

```ts
extendSiheom(base, {
  assertions: {
    hasToast: async (target, message: string) => { /* ... */ },
  },
});
```

## 다음 단계

- [assertion 개념](/concepts/assertions)
- [접근성 스냅샷](/concepts/a11y-snapshot)
- [메시지 맵](/configuration/messages)
