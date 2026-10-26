# @siheom/core

## 0.4.1

### Patch Changes

- Resolve `yarn npm audit` findings in dev tooling (vite, vitest, storybook, framework test deps, and transitive packages). Runtime dependencies are unchanged.

## 0.4.0

### Minor Changes

- 2f39518: Add interaction metadata, opt-in hidden diagnostics, and assertion options to accessibility snapshots.
- 9cac7eb: - `assertions.not.visible`이 화면에 보이는 요소에서는 실패합니다 (요소가 없거나, 접근성 트리에서 숨겨졌거나, 보이지 않을 때만 통과).
  - `assertions.count(target, 0)`으로 요소가 없음을 확인할 수 있습니다.
  - `assertions.textContents(container, expected)`, `assertions.names(container, expected)`: 목록 항목의 글/접근성 이름을 순서대로, 빠짐없이 비교합니다.
  - `createDefaultActions({ user })`가 `vitest/browser`의 `userEvent`를 받습니다 (`SiheomUser` 타입).
  - `@siheom/react`: `createReactSiheom({ user })`로 실제 입력(`vitest/browser` `userEvent`)을 쓰는 `runSiheom`을 만들 수 있습니다.

## 0.3.0

### Minor Changes

- effect 스텝과 `withFakeTimers`, `hover`·`dragAndDrop` 액션, `textContent`·`focused` assertion을 추가했습니다. 체크박스 checked 상태는 DOM 속성으로 확인하도록 고쳤고, `overrideSiheom`의 액션 바인딩 타입이 항상 필요하도록 고정했습니다.

## 0.2.0

### Minor Changes

- 164aa51: 모노레포 의존성 이슈 해결

## 0.1.3

### Patch Changes

- 5ff9d56: monorepo deps 처리

## 0.1.2

### Patch Changes

- 873d10e: Fix workspace dependency rewriting on publish so consumers can install outside the monorepo.
