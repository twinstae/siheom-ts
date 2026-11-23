---
"@siheom/react": patch
---

assertion이 기다리는 동안 끝난 비동기 상태 변경(`fetch`, `file.text()`, 타이머 뒤의 `setState`)을 화면에 그립니다. 전에는 assertion과 그 `waitFor`를 `act` 하나로 감싸, 그 사이의 React 갱신이 `act`가 끝날 때까지 큐에 묶였습니다. 그래서 갱신이 기다리는 도중에 끝나면 assertion이 시간을 다 쓰고 실패했습니다. 이제 assertion은 `act` 밖에서, `@testing-library/react`처럼 act 환경을 끈 채 기다립니다.
