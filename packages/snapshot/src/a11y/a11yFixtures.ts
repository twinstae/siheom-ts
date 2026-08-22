/**
 * Diverse HTML fixtures for getA11ySnapshot regression coverage.
 * Each fixture targets a distinct accessible-semantics cluster.
 */

export const a11yFixtures = {
  "form-states": `
    <form aria-label="가입">
      <label>이름<input name="name" required value="김" /></label>
      <label>메모<textarea readonly>읽기전용</textarea></label>
      <label><input type="checkbox" checked />동의</label>
      <div role="checkbox" aria-checked="mixed" aria-label="부분선택"></div>
      <button type="submit" disabled>제출</button>
    </form>
  `,

  "dialog-modal": `
    <div role="dialog" aria-modal="true" aria-labelledby="dlg-title" aria-describedby="dlg-desc">
      <h2 id="dlg-title">삭제 확인</h2>
      <p id="dlg-desc">이 항목을 삭제할까요?</p>
      <button type="button">취소</button>
      <button type="button">삭제</button>
    </div>
  `,

  "navigation-current": `
    <nav aria-label="주 메뉴">
      <a href="/" aria-current="page">홈</a>
      <a href="/docs">문서</a>
      <a href="/about" aria-current="false">소개</a>
    </nav>
  `,

  "listbox-options": `
    <div role="listbox" aria-label="크기" aria-multiselectable="true" aria-orientation="vertical">
      <div role="option" aria-selected="true" aria-posinset="1" aria-setsize="3">작게</div>
      <div role="option" aria-selected="false" aria-posinset="2" aria-setsize="3">보통</div>
      <div role="option" aria-selected="false" aria-posinset="3" aria-setsize="3" aria-disabled="true">크게</div>
    </div>
  `,

  "slider-progress": `
    <div>
      <div role="slider" aria-label="음량" aria-valuemin="0" aria-valuemax="100" aria-valuenow="40" aria-valuetext="40퍼센트" aria-orientation="horizontal"></div>
      <div role="progressbar" aria-label="업로드" aria-valuemin="0" aria-valuemax="100" aria-valuenow="75"></div>
      <meter aria-label="점수" min="0" max="100" value="80"></meter>
    </div>
  `,

  "tabs-selected": `
    <div>
      <div role="tablist" aria-label="설정 탭" aria-orientation="horizontal">
        <button type="button" role="tab" aria-selected="true" aria-controls="panel-general" id="tab-general">일반</button>
        <button type="button" role="tab" aria-selected="false" aria-controls="panel-security" id="tab-security">보안</button>
      </div>
      <div role="tabpanel" id="panel-general" aria-labelledby="tab-general">일반 내용</div>
      <div role="tabpanel" id="panel-security" aria-labelledby="tab-security" hidden>보안 내용</div>
    </div>
  `,

  "toggle-pressed": `
    <button type="button" aria-pressed="true">굵게</button>
    <button type="button" aria-pressed="mixed">정렬</button>
    <button type="button" aria-pressed="false">기울임</button>
  `,

  "combobox-relations": `
    <label id="city-label">도시</label>
    <div
      role="combobox"
      aria-labelledby="city-label"
      aria-controls="city-list"
      aria-expanded="true"
      aria-autocomplete="list"
      aria-activedescendant="city-seoul"
      aria-haspopup="listbox"
    >서울</div>
    <ul role="listbox" id="city-list" aria-label="도시 목록">
      <li role="option" id="city-seoul" aria-selected="true">서울</li>
      <li role="option" id="city-busan" aria-selected="false">부산</li>
    </ul>
  `,

  "tree-expanded": `
    <ul role="tree" aria-label="폴더">
      <li role="treeitem" aria-expanded="true" aria-level="1">
        문서
        <ul role="group">
          <li role="treeitem" aria-level="2" aria-selected="true">계획.md</li>
          <li role="treeitem" aria-level="2">메모.md</li>
        </ul>
      </li>
      <li role="treeitem" aria-expanded="false" aria-level="1">사진</li>
    </ul>
  `,

  "table-grid-properties": `
    <table role="grid" aria-label="일정" aria-colcount="3" aria-rowcount="2">
      <thead>
        <tr role="row" aria-rowindex="1">
          <th role="columnheader" aria-sort="ascending" aria-colindex="1">날짜</th>
          <th role="columnheader" aria-colindex="2" aria-colspan="2">내용</th>
        </tr>
      </thead>
      <tbody>
        <tr role="row" aria-rowindex="2">
          <td role="gridcell" aria-colindex="1">월</td>
          <td role="gridcell" aria-colindex="2" aria-rowspan="1">회의</td>
          <td role="gridcell" aria-colindex="3">오전</td>
        </tr>
      </tbody>
    </table>
  `,

  "live-regions": `
    <div>
      <div role="status" aria-live="polite" aria-atomic="true">저장됨</div>
      <div role="alert" aria-live="assertive" aria-relevant="additions text">오류 발생</div>
      <div aria-live="off" aria-busy="true">동기화 중</div>
    </div>
  `,

  "drag-drop-deprecated": `
    <div role="list" aria-label="할 일">
      <div role="listitem" aria-grabbed="true">드래그 중</div>
      <div role="listitem" aria-dropeffect="move">놓기 영역</div>
    </div>
  `,

  "heading-levels": `
    <h1>제목 1</h1>
    <div role="heading" aria-level="3">제목 3 (ARIA)</div>
    <h6>제목 6</h6>
  `,

  "menu-haspopup": `
    <button type="button" aria-haspopup="true" aria-expanded="false">열기</button>
    <button type="button" aria-haspopup="menu" aria-expanded="true">메뉴</button>
    <ul role="menu" aria-label="동작">
      <li role="menuitem">복사</li>
      <li role="menuitemcheckbox" aria-checked="true">줄바꿈</li>
      <li role="menuitemradio" aria-checked="false">왼쪽</li>
    </ul>
  `,

  "skip-iframe-svg-presentation": `
    <div>
      <p>보이는 문단</p>
      <iframe title="광고" src="about:blank"></iframe>
      <svg aria-hidden="true"><circle cx="1" cy="1" r="1"></circle></svg>
      <div role="presentation"><span>장식</span></div>
      <div role="none"><button type="button">보이면 안 됨?</button></div>
    </div>
  `,

  "rich-relations": `
    <section aria-labelledby="sec-title" aria-owns="owned-note">
      <h2 id="sec-title">섹션</h2>
      <button type="button" aria-controls="panel" aria-details="more" aria-flowto="next">열기</button>
      <div id="panel">패널</div>
      <div id="more" role="region" aria-label="추가 정보">자세한 설명</div>
      <div id="next">다음 영역</div>
      <div id="owned-note">소유된 노트</div>
    </section>
  `,

  "invalid-grammar-spelling": `
    <label>본문<textarea aria-invalid="grammar">문장이 이상함</textarea></label>
    <label>검색<input aria-invalid="spelling" value="serach" /></label>
  `,

  "select-options": `
    <label>
      과일
      <select>
        <option>사과</option>
        <option selected>배</option>
        <option disabled>포도</option>
      </select>
    </label>
  `,
} as const;

export type A11yFixtureName = keyof typeof a11yFixtures;
