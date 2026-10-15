---
"@siheom/core": minor
"@siheom/react": minor
---

- `assertions.not.visible`이 화면에 보이는 요소에서는 실패합니다 (요소가 없거나, 접근성 트리에서 숨겨졌거나, 보이지 않을 때만 통과).
- `assertions.count(target, 0)`으로 요소가 없음을 확인할 수 있습니다.
- `assertions.textContents(container, expected)`, `assertions.names(container, expected)`: 목록 항목의 글/접근성 이름을 순서대로, 빠짐없이 비교합니다.
- `createDefaultActions({ user })`가 `vitest/browser`의 `userEvent`를 받습니다 (`SiheomUser` 타입).
- `@siheom/react`: `createReactSiheom({ user })`로 실제 입력(`vitest/browser` `userEvent`)을 쓰는 `runSiheom`을 만들 수 있습니다.
