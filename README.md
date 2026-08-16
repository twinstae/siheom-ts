## siheom-ts

시험은 사용자의 행동과 기대를 **데이터**로 표현한 것입니다. 인터프리터(`runSiheom`)가 실제 브라우저에서 이 데이터를 순서대로 실행합니다.

```tsx
return runSiheom(
  given.render(<SignUpForm />),
  actions.fill(query.textbox(/이메일/), "test@test.com"),
  actions.click(query.button("가입하기")),
  assertions.visible(query.heading("가입을 환영합니다")),
);
```

문서는 `apps/docs`에 있습니다. `yarn docs`로 로컬에서 볼 수 있습니다.

### 패키지

| 패키지 | 역할 |
| --- | --- |
| [`@siheom/snapshot`](packages/snapshot) | 접근성 트리 및 테이블 snapshot 유틸리티 |
| [`@siheom/core`](packages/core) | 인터프리터, factory, 기본 actions/assertions |
| [`@siheom/react`](packages/react) | React `given.render` |
| [`@siheom/vue`](packages/vue) | Vue `given.render` |
| [`@siheom/svelte`](packages/svelte) | Svelte `given.render` |
| [`@siheom/solid`](packages/solid) | Solid `given.render` |
| [`@siheom/angular`](packages/angular) | Angular `given.render` |
| [`@siheom/qwik`](packages/qwik) | Qwik `given.render` |
| [`@siheom/react-native`](packages/react-native) | React Native Testing Library 기반 `given.render` |
| [`@siheom/ime`](packages/ime) | 한글 IME 조합 에뮬레이션 (실험적) |
| [`@siheom/vitest-browser-react`](packages/vitest-browser-react) | `vitest-browser-react` 기반 React 러너 (실험적) |

이 레포는 [Yarn 4](https://yarnpkg.com/) Plug'n'Play workspace 모노레포입니다. `corepack enable`과 `yarn install` 후 `yarn ci`로 빌드/린트/타입체크/테스트를 한 번에 실행합니다. 자세한 개발 명령은 [AGENTS.md](AGENTS.md)를 참고하세요.

### License

MIT
