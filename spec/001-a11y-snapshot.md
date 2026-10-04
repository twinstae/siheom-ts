# A11y Element 직렬화 출력

## 1. 목적

본 문서는 A11y Element(접근성 노드) 를 사람이 읽기 쉬운 형태로 직렬화(serialize) 출력할 때, 속성의 그룹핑(grouping)과 표시 순서(ordering) 를 일관되게 정의하기 위한 규격이다.

본 스펙의 목표는 다음과 같다.
1. 동일한 A11y Element는 언제 출력해도 항상 동일한 구조/순서로 표시된다.
2. 사용자는 출력만 보고도 무엇(role) / 무엇의 이름(name) / 현재 상태(state) / 값(value) / 관계(relationship) 를 빠르게 파악할 수 있다.
3. 간편한 디버깅을 위해 간결하게 표현하나, 명시적으로 표현할 수 있는 출력모드도 제공한다.

## 2. 의도

전반적인 순서는 Firefox의 [Accessibility Inspector](https://firefox-source-docs.mozilla.org/devtools-user/accessibility_inspector/index.html)로부터 영향을 받았습니다.

### 2.1 1차 의도: 사람 기준의 "즉시 이해"

사용자는 한 줄만 보고도 해당 노드의 핵심을 파악해야 한다.
따라서 핵심 식별 정보인 role + name을 최우선 배치하고, name/description/value 같은 [Core 정보](https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html)를 헤더 1줄에 농축한다.

### 2.2 2차 의도: 디버깅 친화(문제의 원인에 가까운 순서)

A11y 결함은 대체로 다음 순서에서 발견된다.

1. 역할(role)이 맞는가
2. 이름(name)이 맞는가
3. 현재 상태(state)가 맞는가(disabled/expanded/checked 등)
4. 관계(relation)가 끊겼는가(labelledby/controls 등)
5. 라이브 리전 정책이 의도대로인가(aria-live 등)

따라서 출력 순서는 "정적 설명"보다 "현상/상태 → 연결 관계 → 알림 정책"을 우선으로 둔다.

### 2.3 3차 의도: 비교(diff) 안정성 및 결정적 출력

동일한 입력은 언제나 동일한 텍스트를 생성해야 한다.
속성 출력은 반드시 결정적 정렬(deterministic ordering) 을 보장한다.

### 2.4 4차 의도: 노이즈 억제

순수 텍스트 노드는 사람이 읽을 때 가장 큰 노이즈 원인이므로, 최소 표현 "name"만 허용한다.
레거시/디프리케이트 속성은 "정보는 남기되" 기본 가독성을 해치지 않도록 후순위로 밀어낸다.

compact mode를 기본으로 하여 불필요한 depth 노드나 null 값을 가진 aria 정보들은 표시하지 않는다.

## 3. 범위

본 스펙은 다음을 다룬다.
1. A11y Element 헤더 1줄 표현 규칙(ROLE/NAME 및 Core 정보 통합)
2. 속성 그룹 정의 및 그룹 간 출력 순서 (신설된 interaction 및 attributes 그룹 포함)
3. 그룹 내부 정렬 규칙(결정적 정렬)
4. 관계(relationship) 속성의 참조 표현
5. 라이브 리전(live region), 드래그 앤 드롭(drag-and-drop), 상호작용 속성(interaction), 원본 속성 목록(attributes)의 정의 및 취급 규칙
6. 텍스트 기반 직렬화 포맷 정의 및 숨겨진 노드 포함 옵션(includeHidden) 세맨틱스
7. compact/verbose 출력 모드 정의 및 자식 수(childCount) 추출 방식

본 스펙은 텍스트 직렬화 형식을 규정한다. `@siheom/snapshot`에서 공개하는 `getA11yTree`와 `A11yNode`의 구조화 트리 인터페이스는 [패키지 문서](../packages/snapshot/README.md#구조화된-트리)에서 별도로 정의한다.

본 스펙은 다음을 다루지 않는다.
1. Accessible Name/Description 계산 알고리즘의 구현 상세
2. 브라우저/플랫폼 접근성 API와의 완전한 매핑 표준 및 브라우저 프로토콜 데이터 연동
3. UI 렌더링(색상/아이콘/접기-펼치기) 상세 가이드
4. 이벤트 리스너 감지 및 키다운 핸들러 추론(handler inference), 탭 키 탐색의 시퀀스 정수 순서(tab ordinal) 분석
5. 브라우저 특화의 synthetic actions, actionable, exposed, tabindex-order 속성 정의

## 4. 규범 용어(준수 수준)

- MUST: 반드시 구현해야 함
- SHOULD: 권장(합리적 이유로 예외 가능)
- MAY: 선택 구현


## 5. 출력 타입 및 모드

본 스펙은 텍스트 기반 직렬화를 규정한다.

- Compact 모드: 값이 비어있는 항목/그룹은 생략한다. (MUST) 이름이 없는 비단말 노드는 `group:`처럼 빈 이름을 생략하지만, 이름 누락 자체가 결함 신호인 단말 노드는 `button: ""`처럼 빈 이름을 명시한다. (MUST) 단, 새로 도입된 interaction 그룹의 불리언 값 중 `false`에 해당하는 항목들([focusable=false], [tabbable=false], [focused=false])도 생략 대상에 포함한다. (MUST) 반면, 기존 ARIA 상태 정보인 `[expanded=false]`, `[checked=false]` 등 명시적으로 설정된 상태값은 Compact 모드에서도 절대로 생략되지 않고 반드시 출력되어야 한다. (MUST) 이 false 생략 규칙은 오직 새로 추가된 interaction 불리언 속성(focusable, tabbable, focused)에만 적용된다. (MUST)
- Verbose 모드: 디버깅을 위해 비어있는 항목 및 `false` 상태 of 모든 불리언 값(interaction 그룹 포함)을 명시한다. (SHOULD)

단, 순수 텍스트 노드는 모드와 무관하게 "name"만 출력한다. (MUST)

## 6. 최상단 표현 규칙(헤더)

### 6.1 비-텍스트 노드 헤더 포맷 (MUST)

비-텍스트 A11y Element는 반드시 다음 1줄을 출력한다.

형식:

```
<role>: "<name>" [ <core-suffix>...]
```

Compact 모드에서 name이 비어 있는 비단말 노드는 `<role>:`만 출력한다. name이 비어 있는 단말 노드와 모든 Verbose 노드는 `<role>: ""`를 출력한다. (MUST)

의도:

사람이 접근성 노드를 판단할 때 가장 먼저 보는 것은 role과 name이며,
Core 정보(description/value)는 "있으면 중요"하나 별도 섹션으로 분리하면 스캔 비용이 커지므로 헤더에 통합한다.

### 6.2 Core Suffix(헤더 내 Core 확장) (MUST/SHOULD)

헤더에는 name 외에 다음 Core 정보를 “한 줄 안에서” 추가할 수 있다.

`[value=<value>]` (value가 있을 때 SHOULD 출력)
`[desciption="<description>"]` (description이 있을 때 SHOULD 출력)

권장 표기(가독성/파싱 용이)
suffix들은 공백으로 구분하고, `[키=값]` 형태를 유지한다.


예:

```
button: "저장" [desciption="설정을 저장합니다"]
slider: "볼륨" [value=75]
textbox: "검색" [value="aria spec"]
```

Compact 규칙
- value/desciption이 없으면 suffix는 생략한다. (MUST)

Verbose 규칙
- 구현체가 필요하다고 판단하면 desc/value가 비어있을 때도 desc=null, value=null로 표기할 수 있다. (MAY)
- 단, 헤더는 반드시 1줄이어야 한다. (MUST)

### 6.4 Verbose 모드 자식 노드 수 표시 (childCount) (MUST)

- Verbose 모드에서는 비-텍스트 노드 헤더 행의 맨 마지막(value/description suffix 뒤)에 최종 직렬화에 포함된 자식 접근성 노드의 수 `[childCount=N]`를 반드시 표시해야 한다. (MUST)
- `N`은 트리 필터링, 호이스팅(hoisting), 텍스트 결합, 그리고 콘텐츠로부터의 이름 계산(name-from-content) 과정에서 자식 생략 처리가 완료된 후 실제로 직렬화 출력 대상이 된 하위 자식 노드의 개수이다. (MUST)
- 단말 노드(leaf node)처럼 최종 하위 자식 노드가 없는 경우에는 `[childCount=0]`을 반드시 출력한다. (MUST)
- Compact 모드에서는 어떠한 경우에도 `childCount` 정보를 헤더에 포함하지 않는다. (MUST)
- 이 값은 직렬화 시점에 즉석에서 동적으로 계산되는 값(derived value)이며, `A11yNode` 데이터 구조 자체에 유지 보관되어서는 안 된다. (MUST)

예시 (Verbose):
```
button: "Save" [value="ok"] [childCount=0]
```

## 7. 순수 텍스트 노드 규칙
### 7.1 표현 (MUST)

순수 텍스트 노드는 반드시 다음 형태로만 출력한다.

```
"<name>"
```

예:

```
"로그인"
"필수 항목입니다."
```

### 7.2 순수 텍스트 노드 판정 기준 (MUST)

다음 조건을 모두 만족하면 "순수 텍스트 노드"로 간주한다.

1. 구현 모델에서 DOM `Text` 노드로 식별된다. (MUST)
2. 상태(states), 상호작용(interaction), 관계(relations), 라이브리전(live-region), 드래그 앤 드롭(drag-and-drop), 원본 속성(attributes) 등 추가적인 의미 있는 속성 그룹이 모두 비어있다. (MUST)
3. 출력해야 할 핵심 정보가 name(텍스트) 외에 없다. (MUST)

의도:
텍스트 노드는 접근성 트리에서 수가 많고, role/속성을 붙이면 노이즈가 급증한다.
사람이 UI 문맥을 읽는 데 필요한 것은 텍스트 자체이므로 "name"만 남겨 가독성을 극대화한다.

### 7.3 예외: 텍스트처럼 보이지만 의미가 있는 노드 (SHOULD)

다음 중 하나라도 해당하면 순수 텍스트 노드로 처리하지 말고 일반 노드 규칙(헤더 role: "name" + 그룹)을 적용한다. (SHOULD)

1. live region 정책을 가진다
2. 관계 속성(labelledby/controls 등)을 가진다
3. 상태(disabled/selected 등)를 가진다
4. 상호작용(interaction) 또는 접근성 원본 속성(attributes) 정보를 가진다

트리 생성기는 의미 그룹을 가진 role-less 노드를 만들지 않고 `generic`으로 승격해야 한다. 수동으로 구성된 기존 노드가 이 불변식을 위반하면 직렬화기가 `generic`으로 정규화하여 의미 그룹을 보존한다. (MUST)

의도:
"텍스트처럼 보이지만 사실상 의미/상태/관계를 가진 노드"는 디버깅 포인트가 될 수 있어 정보를 숨기면 안 된다.

예:

```
generic: "업데이트 알림"
  - live-region: [live="polite"] [atomic=true]
```

## 8. 상세 섹션(그룹) 출력 규칙
### 8.1 그룹 출력의 기본 구조 (MUST)

헤더 다음 줄부터 필요한 경우에만 그룹을 출력한다.
그룹은 2가지 형태를 허용한다.

그룹 구조:

```
  - <GroupName>: [<key>=<value>] ... 
```

```
  - <GroupName>:
    <key>: <value>
    <key>: <value>
```

- 상세블록은 `- <block>:` 형태로 구분한다 (MUST)
- 들여쓰기:
    - 그룹 헤더는 2칸, 항목은 인라인 (MUST)
    - 그룹 헤더는 2칸, 항목은 4칸 (MUST)
- 값 표기: 불리언/수치/문자열/배열을 명확히 구분 (MUST)


### 8.2 그룹 출력 순서 (MUST)

그룹은 반드시 아래 순서대로 출력해야 한다. (MUST)

1. `states`: 현재의 사용자 경험 상태를 즉시 결정한다. (포커스/탭 상태를 제외한 disabled, expanded, checked 등)
2. `interaction`: 포커스 획득 여부, 순차 탐색 포함 여부, 단축키 정보 등 키보드 상호작용 능력을 기술한다. (focusable, tabbable, focused, keyshortcuts, accesskey)
3. `properties`: 지켜야 할 지속적 위젯 파라미터를 보강한다. (haspopup, orientation 등)
4. `relations`: name/description이 어떻게 유도되었는지, 어떤 컨트롤과 연결되었는지를 나타내는 핵심 근거가 된다. (labelledby, controls 등)
5. `live-region`: 동적 컴포넌트의 가상적인 AT 알림 정책을 설정한다. (live, atomic, relevant 등)
6. `drag-and-drop`: 레거시 혹은 쓰임새가 극히 희소한 속성을 후순위로 관리한다. (grabbed, dropeffect)
7. `attributes`: 디버깅 전용 원본 접근성 DOM 속성 목록을 나열한다. (Verbose 전용)
8. `other`: 엔진/플랫폼 덤프에서 수집한 기타 특화 정보를 최하단에 배치한다. (기존 others에서 other로 명칭 통일)

의도:

states는 "현재 상태" 성격의 속성들을 표현한다. (예: disabled, expanded, checked 등)
ARIA는 state와 property를 구분하되, state는 사용자 상호작용으로 더 자주 바뀌는 경향이 있다는 점을 명시한다. 
따라서 직렬화에서도 state는 "변화/디버깅 빈도"가 높으니 앞쪽에 두었다.

그 다음이 property(특성)입니다(예: haspopup, orientation, multiselectable, range 속성 등).
state/property 경계가 절대적 규칙은 아니지만, "디버그 시점에서 상태보다 덜 휘발적인 정보"가 여기로 모이면 읽기  편하다.
라벨/설명 참조, 컨트롤 관계 등은 보통 문제의 원인(이름이 이상함, 읽는 순서가 이상함, 컨트롤-패널 매핑이 끊김)에 직결되므로 states/properties 다음으로 고정한다.

aria-live, aria-atomic, aria-relevant, aria-busy는 알림/발화에 영향을 주는 정책이라 별도 그룹이 유리하다. WAI‑ARIA taxonomy도 Live Region Attributes를 독립 범주로 둔다.
Drage-And-Drop도 동일.

### 8.3 모드와 그룹 표기

- Compact 모드에서는 비어있는 그룹은 출력하지 않는다. (MUST)
- Verbose 모드에서는 필요 시 비어있는 그룹을 출력할 수 있다. (MAY)
  단, 과도한 노이즈를 방지하기 위해 기본값은 “비어있으면 생략”을 권장한다. (SHOULD)

### 8.4 숨겨진 노드 포함 옵션 (includeHidden) (MUST)

- 기본 동작(Default): 보조 기술에 노출되지 않고 접근이 비활성화된(inaccessible) 노드들은 접근성 트리 구성 단계에서 사전에 걸러져 완전히 배제된다. (기존 동일, MUST)
- `includeHidden: true` 옵션: 디버깅 목적으로 접근 불가능한 숨김 노드들을 포함하고 싶을 때 이 옵션을 지정하면, 숨겨진 요소도 트리에 포함되며 직렬화될 때 명시적으로 `[hidden=true]` 상태를 부여받아 출력된다. (MUST)
- 해당 대상 유형: 자체 `hidden` 속성을 가졌거나, 부모/조상 중 하나가 `aria-hidden="true"`를 가졌거나, `display: none` 처리되었거나, 인라인 또는 CSS 상속에 의해 `visibility: hidden`이 적용된 요소들이 포함된다. (MUST)
- 숨김 요소가 포함되더라도 본연의 트리의 계층적 레이아웃 구조는 온전히 반영되어야 하며, 해당 숨겨진 노드의 하위 자식 접근성 노드들도 정상적으로 탐색하여 트리에 참가할 수 있다. (MUST)
- `includeHidden`은 트리 빌더가 지원하지 않는 `iframe` 및 SVG 서브트리의 제외 규칙을 변경하지 않는다. (MUST)

## 9. 그룹별 키/값 및 정렬 규칙

### 9.1 States 그룹

의도: "지금 어떤 상태인가"는 접근성 버그의 1차 원인이므로 상위에 배치한다.
생성된 트리에서 기존 `focusable`과 `focused`는 신설된 `interaction` 그룹으로 완전히 이관되었다. (MUST)
수동으로 구성된 기존 `A11yNode`와의 호환을 위해 States의 레거시 필드를 직렬화할 수 있지만, 새 트리 생성기는 해당 필드를 채워서는 안 된다. (MUST)
`modal` 상태는 상호작용 성격보다는 대화상자의 핵심 상태적 장벽에 가까우므로 계속 States 그룹에 유지한다. (MUST)

권장 state 우선순위(존재하는 경우 이 순서로 출력) (SHOULD)

1. visibility/availability:: hidden, disabled
2. interaction:: modal
3. toggle/selection: expanded, pressed, checked, selected, current
4. validation: invalid, required, readonly

현재 생성기가 지원하는 state는 위 목록이 전부다. 새 state를 추가하면서 우선순위를 지정하지 않은 경우에는 사전식 정렬로 뒤에 출력한다. (MUST)

형태는 `[레이블=값]`인 한 줄로 처리하며, 값은 boolean/enum을 사용한다. (SHOULD)
collapsed 상태는 별개의 독립 속성 필드나 별칭(alias)을 두지 않고, 오직 `expanded=false` 로만 일관되게 표현한다. (MUST)

### 9.2 Interaction 그룹 (MUST)

의도: 키보드 포커스 획득 여부, 순차 탭 이동 포함 여부, 시스템 등록 단축키 선언 등 포커스 및 물리적/논리적 키보드 상호작용 인터페이스 상태를 집중 표현한다.

출력 필드 및 의미 (순서 엄수): (MUST)
1. `focusable` (boolean): DOM API나 사용자의 마우스/키보드 상호작용으로 포커스를 받을 수 있는 상태인지 여부.
2. `tabbable` (boolean): Tab 키를 눌러 순차적으로 이동하는 키보드 탐색 대상군(sequential keyboard tab candidate set)에 속해있는지 여부. (단, 이 속성은 이진 소속 정보만을 표현하므로 탭 오더의 상대적인 순서를 의미하는 tabindex 속성의 정수 크기 등은 표현하지 않는다.)
3. `focused` (boolean): 현재 해당 노드가 실질적인 포커스(document.activeElement)를 지니고 있는지 여부.
4. `keyshortcuts` (string): `aria-keyshortcuts` 속성에 선언된 텍스트. (이 필드는 브라우저 환경에서 단순 명시된 문자열 선언 정보일 뿐이며, 실제로 키다운 이벤트 핸들러가 설치되어 동작 중인지에 대한 동적 검증 증거는 아니다.)
5. `accesskey` (string): HTML `accesskey` 속성에 명시된 시스템 단축키 텍스트. 이 또한 단순 정적 선언 정보이다.

출력 모드에 따른 생략 규칙: (MUST)
- Compact 모드: 불리언 값이 `true`로 수립된 항목과 비어있지 않은 문자열 선언만 출력하며, `false` 상태의 불리언 속성은 지운다. interaction에 매핑할 수 있는 값이 없거나 모두 false이면 interaction 그룹 자체를 생략한다.
- Verbose 모드: `focusable`, `tabbable`, `focused` 세 속성이 모두 `false`인 경우를 가리지 않고 노출하며, 지정된 단축키 문자열 선언이 존재하면 함께 일관되게 출력한다.

예시:
- Compact 모드 (focusable, tabbable이 참이고 keyshortcuts 선언이 있을 때):
  `  - interaction: [focusable=true] [tabbable=true] [keyshortcuts="Alt+S"]`
- Verbose 모드 (focusable, tabbable이 참이고 focused는 거짓이며 keyshortcuts 선언이 있을 때):
  `  - interaction: [focusable=true] [tabbable=true] [focused=false] [keyshortcuts="Alt+S"]`
- Compact 모드 (모든 속성이 거짓이고 선언이 없을 때):
  (interaction 그룹 전체 행이 출력되지 않음)

### 9.3 Properties 그룹

의도: 위젯의 구성 파라미터(예: 범위, 방향, 팝업 유무)를 확인한다.
예: haspopup, orientation, multiselectable, valuemin/valuemax/valuenow, autocomplete 등

정렬: 사전식 정렬 (MUST)

구현체는 위젯별 중요 키를 상단에 고정하는 "프로파일"을 둘 수 있다. (MAY)

형태는 한줄로 처리하고, state와 같이 `[레이블=값]` 형태 (SHOULD)

### 9.4 Relations (Relationships) 그룹

의도: name/description of 근거, 컨트롤-대상 연결, 탐색 흐름을 분석한다.

표현 규칙
- 관계 값은 여러줄로 출력한다. (MUST)
- 출력 값은 가능하다면 resolved된 형태를 사용하며 참조 키를 `(<참조>)`로 표시한다. (SHOULD)

예:
```
button:
  - relations:
    controls: "Settings Panel" (#panel)
```

정렬:
키: 사전식 정렬 (MUST)

### 9.5 Live Region 그룹

의도: 동적 업데이트가 AT에 어떻게 공지되는지(또는 억제되는지)를 파악한다.

권장 키:

1. live ("off" | "polite" | "assertive")
2. atomic (boolean)
3. relevant (string 또는 배열)
4. busy (boolean)

정렬:

권장 우선순위: live → atomic → relevant → busy (SHOULD)

그 외는 사전식 정렬 (MUST)

### 9.6 Drag-and-Drop 그룹

의도: 레거시/희소 속성은 제공하되 기본 가독성을 해치지 않게 후순위에 둔다.

권장 키:

1. grabbed
2. dropeffect


Deprecated 표기 (SHOULD)
구현 환경에서 deprecated로 판단되면 각 항목 또는 그룹에 deprecated 표기를 포함해야 한다.


예:
```
button: "드래그 앤 드롭 버튼"
  - drag-and-drop:
    grabbed: null (deprecated)
```

정렬:
- 사전식 정렬 (MUST)

### 9.7 Attributes 그룹 (Verbose 전용) (MUST)

의도: 디버깅 및 명확한 원본 접근성 속성 상태를 검증하기 위해 원본 DOM 속성 중 접근성 관련 중요 속성들을 수집하여 일목요연하게 노출한다.

규칙:
- 이 그룹은 오직 **Verbose 모드에서만** 출력되며, Compact 모드에서는 출력하지 않는다. (MUST)
- **허용 속성 목록 (Case-Insensitive Allowlist)**: (MUST)
  `role`, 모든 `aria-*` 속성(예: aria-label, aria-describedby 등), `accesskey`, `tabindex`, `hidden`, `disabled`, `readonly`, `required`, `contenteditable`, `inert`
- **제외 대상**: (MUST)
  `id`, `class`, `style`, 모든 `data-*` 속성, 온클릭(`onclick`) 등의 이벤트 핸들러 속성, 계산된 스타일(computed styles) 등은 절대로 이 속성 그룹에 포함되어서는 안 된다.
- **값 표기**: DOM에 설정된 문자열 그대로를 출력하되, 값이 존재하지 않는 불리언 속성(예: `disabled` 등)은 빈 문자열 `""`로 캡처하여 표시한다. (MUST)
- **정렬**: 속성 이름 기준 **사전식(lexicographic) 오름차순**으로 반드시 정렬해야 한다. (MUST)
- **중복 허용**: `aria-keyshortcuts` 등 일부 속성은 `interaction` 그룹에서 파싱된 형태로 보임과 동시에 `attributes` 그룹에서도 원본 형태 그대로 노출될 수 있으며, 이는 의도된 일관적 진단 중복이다.

예시:
`  - attributes: [aria-label="Save"] [disabled=""] [role="button"] [tabindex="0"]`

### 9.8 Other 그룹

의도: 엔진/플랫폼 특화 메타정보를 덤프하되, 핵심 분석 흐름을 방해하지 않도록 마지막에 둔다.
기존 명칭 `others`는 코드 구조 및 필드와의 일관성을 확립하기 위해 `other` 그룹으로 출력한다. (다만, 이전 하위 직렬화기 구조와의 상용 호환을 허용할 수 있다.)
값은 문자열, 숫자, 불리언 또는 null인 직렬화 가능한 스칼라로 제한한다. (MUST)

예:
```
button: "메타데이터 버튼"
  - other:
    domNode: "button#save"
    backendNodeId: 12345
    computedRole: "button"
```

정렬:
- 사전식 정렬 (MUST)

## 11. 전체 출력 예시

### 11.1 Compact 모드 버튼 예시 (상호작용 포함)

```
button: "Save"
  - interaction: [focusable=true] [tabbable=true]
```

### 11.2 Verbose 모드 버튼 예시 (모든 상호작용 및 원본 속성 포함)

```
button: "Save" [childCount=0]
  - interaction: [focusable=true] [tabbable=true] [focused=false]
  - attributes: [role="button"] [tabindex="0"]
  - other:
    domNode: "button#save"
```

### 11.3 includeHidden: true 적용 시 숨김 노드 예시

```
generic: "Hidden content" [childCount=0]
  - states: [hidden=true]
```

### 11.4 Compact 모드에서 expanded=false 가 유지되는 예시

```
button: "메뉴"
  - states: [expanded=false]
```

### 11.5 라이브 리전 포함 노드 (Compact 모드)

```
status: "업데이트 알림" [description="백그라운드 작업 진행"]
  - live-region: [live="polite"] [atomic=true] [relevant="text"] [busy=true]
```

### 11.6 순수 텍스트 노드

```
"필수 입력 항목입니다."
```

### 11.7 텍스트처럼 보이지만 의미가 있는 노드(순수 텍스트로 처리 금지 예)

```
generic: "오류" [description="검증 실패"]
  - live-region: [live="assertive"]
```

## 12. 적합성(Conformance)

구현체는 아래 조건을 모두 만족해야 본 스펙 준수로 간주한다.

1. 비-텍스트 노드의 헤더는 1줄로 출력하며, Compact 비단말 노드의 빈 name만 생략하고 단말 또는 Verbose 노드의 빈 name은 `""`로 명시한다. (섹션 6)
2. description/value는 존재 시 헤더 1줄 내 suffix로 통합한다. (섹션 6.2)
3. Verbose 모드에서만 실제 하위 노드 수인 `[childCount=N]`을 헤더 마지막에 추가하고 Compact 모드에서는 생략한다. (섹션 6.4)
4. 순수 텍스트 노드는 반드시 "name" 단독 형태로만 출력한다. (섹션 7)
5. 그룹이 출력되는 경우, 스펙에 규정된 그룹 순서(states → interaction → properties → relations → live-region → drag-and-drop → attributes → other)를 온전히 준수한다. (섹션 8.2)
6. `includeHidden` 옵션을 주었을 때만 숨김 속성을 가진 요소가 트리에 포함되며, `[hidden=true]` 상태를 가져야 한다. (섹션 8.4)
7. `interaction` 그룹은 지정된 필드 정렬 순서(focusable → tabbable → focused → keyshortcuts → accesskey)를 정확히 지킨다. (섹션 9.2)
8. `interaction` 그룹의 불리언 중 `false`인 값들은 오직 Verbose 모드에서만 출력되며 Compact 모드에서는 완전히 지워야 한다. 단, 기존 ARIA 상태(states)의 false는 Compact 모드에서도 지우지 않는다. (섹션 5, 섹션 9.2)
9. Verbose 모드 전용 `attributes` 그룹은 사전에 정의된 허용 목록만 포함하고 반드시 사전식 오름차순으로 정렬해야 하며, Compact 모드에서는 생략한다. (섹션 9.7)
10. 속성 그룹별 키/값 정렬은 결정적이어야 하며, 최소 스펙이 정한 사전식 정렬 규칙을 준수한다. (섹션 9)
