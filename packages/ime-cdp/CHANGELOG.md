# @siheom/ime-cdp

## 0.3.2

### Patch Changes

- Resolve `yarn npm audit` findings in dev tooling (vite, vitest, storybook, framework test deps, and transitive packages). Runtime dependencies are unchanged.
- Updated dependencies
  - @siheom/core@0.4.1
  - @siheom/ime@0.3.2

## 0.3.1

### Patch Changes

- Updated dependencies [2f39518]
- Updated dependencies [9cac7eb]
  - @siheom/core@0.4.0
  - @siheom/ime@0.3.1

## 0.3.0

### Minor Changes

- Chromium CDP Hangul composition backend for Vitest browser mode (`composeHangulCdp`, `createCdpImeActions`). Uses `Input.imeSetComposition` / `Input.insertText` for engine-backed ATDD and golden capture alongside `@siheom/ime` synthetic emulation.
