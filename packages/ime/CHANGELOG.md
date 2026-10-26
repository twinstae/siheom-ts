# @siheom/ime

## 0.3.2

### Patch Changes

- Resolve `yarn npm audit` findings in dev tooling (vite, vitest, storybook, framework test deps, and transitive packages). Runtime dependencies are unchanged.
- Updated dependencies
  - @siheom/core@0.4.1

## 0.3.1

### Patch Changes

- Updated dependencies [2f39518]
- Updated dependencies [9cac7eb]
  - @siheom/core@0.4.0

## 0.3.0

### Minor Changes

- 한글 IME 합성을 흉내 내는 `composeHangul`과, `overrideSiheom`으로 `fill`·`type` 액션을 한글 입력으로 바꿔 끼우는 `createImeActions`를 처음 npm에 공개합니다. Linux Chrome + ibus 환경에서 캡처한 실제 IME 이벤트 트레이스를 기준으로 조합 순서를 맞췄습니다.

### Patch Changes

- Updated dependencies
  - @siheom/core@0.3.0
