# @siheom/snapshot

DOM에서 접근성 snapshot, 구조화된 접근성 트리, 테이블 Markdown을 생성합니다. `@siheom/core`, Vitest, React에 대한 런타임 의존성 없이 사용할 수 있습니다. ESM과 CommonJS 및 각각의 TypeScript 선언을 제공합니다.

```sh
yarn add @siheom/snapshot
```

## 접근성 snapshot

```ts
import { getA11ySnapshot } from "@siheom/snapshot";

const snapshot = getA11ySnapshot(document.body);
const diagnosticSnapshot = getA11ySnapshot(document.body, {
  mode: "verbose",
  includeHidden: true,
});
```

`getA11ySnapshot(element: HTMLElement, options?: A11ySnapshotOptions): string`은 접근성 트리를 텍스트로 직렬화합니다. 루트가 제외되거나 트리가 비어 있으면 빈 문자열을 반환합니다. 함수 호출 시 DOM 환경이 필요합니다.

공통 트리 옵션은 다음과 같습니다.

| 옵션 | 기본값 | 의미 |
| --- | --- | --- |
| `mode` | `"compact"` | `"verbose"`에서는 진단용 속성과 일반 컨테이너 노드를 더 자세히 수집합니다. |
| `includeHidden` | `false` | 숨겨진 노드도 포함하고 `states.hidden`으로 표시합니다. |
| `computeOther` | 없음 | 각 HTML 요소에 문자열, 숫자, 불리언, `null`로 구성된 추가 메타데이터를 부여하는 콜백입니다. |

`serialize.mode`로 텍스트 출력 모드를 별도로 지정할 수 있습니다. 생략하면 `mode`를 따릅니다. 트리 수집 모드를 변경하지는 않으므로 전체 진단 정보를 출력하려면 `mode: "verbose"`를 사용합니다. 텍스트 형식은 [직렬화 스펙](../../spec/001-a11y-snapshot.md)을 따릅니다.

## 구조화된 트리

```ts
import { getA11yTree, type A11yNode } from "@siheom/snapshot";

const tree: A11yNode | null = getA11yTree(document.body, { mode: "verbose" });
```

`getA11yTree(element: HTMLElement, options?: BuildA11yTreeOptions): A11yNode | null`과 `A11yNode`는 공개 API입니다. 위의 공통 트리 옵션을 사용하며, 루트가 제외되거나 트리가 비어 있으면 `null`을 반환합니다.

- 모든 노드는 `role: string`, `name: string`, `children: A11yNode[]`를 갖습니다. 텍스트 노드와 compact 모드의 일부 컨테이너는 `role`이 빈 문자열일 수 있습니다.
- `description`, `value` 및 `states`, `interaction`, `properties`, `relations`, `liveRegion`, `dragDrop`, `attributes`, `other` 그룹은 선택적입니다. 접근 전에 존재 여부를 확인해야 합니다.
- 각 그룹의 타입과 `BuildA11yTreeOptions`, `SerializeOptions`, `A11ySnapshotOptions`도 패키지 루트에서 내보냅니다.
- 트리는 DOM에서 계산한 결과이며 브라우저의 네이티브 접근성 트리를 그대로 반환하지 않습니다. `iframe`과 SVG 서브트리는 제외합니다.

## 테이블 Markdown

```ts
import { tableToMarkdown } from "@siheom/snapshot";

const table = document.querySelector<HTMLTableElement>("table");
if (table) console.log(tableToMarkdown(table));
```

`tableToMarkdown(tableElement: HTMLTableElement): string`은 `thead`/`tbody`의 행을 읽어 첫 행을 헤더로 사용하는 Markdown을 반환합니다. 셀 안의 `input`과 `progress`는 현재 값을 사용합니다. 읽을 행이 없으면 오류를 던집니다.

## ARIA 역할

```ts
import {
  concreteRoles,
  isCheckableRole,
  isNameFromContentRole,
  type ConcreteAriaRole,
} from "@siheom/snapshot/aria-roles";
```

이 하위 경로는 DOM 없이 사용할 수 있으며, 추상 역할을 제외한 역할 목록과 역할 판별 함수를 제공합니다.

기존 `@siheom/core`의 `getA11ySnapshot`, `tableToMarkdown`, `A11ySnapshotOptions` 가져오기는 호환성을 유지합니다. 새 독립 사용처는 `@siheom/snapshot`에서 직접 가져올 수 있습니다.
