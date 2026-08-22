/**
 * Diverse HTML table fixtures for tableToMarkdown regression coverage.
 */

export const tableFixtures = {
  "korean-padded": `
    <table>
      <thead><tr><th>이름</th><th>상태</th></tr></thead>
      <tbody><tr><td>청소</td><td>완료</td></tr></tbody>
    </table>
  `,

  "input-cell": `
    <table>
      <thead><tr><th>수량</th></tr></thead>
      <tbody><tr><td><input value="3" /></td></tr></tbody>
    </table>
  `,

  "progress-cell": `
    <table>
      <thead><tr><th>작업</th><th>진행</th></tr></thead>
      <tbody>
        <tr>
          <td>업로드</td>
          <td><progress value="0.4" max="1"></progress></td>
        </tr>
      </tbody>
    </table>
  `,

  "mixed-widths": `
    <table>
      <thead><tr><th>ID</th><th>설명</th><th>메모</th></tr></thead>
      <tbody>
        <tr><td>1</td><td>짧은</td><td>아주 긴 한글 설명입니다</td></tr>
        <tr><td>22</td><td>중간길이텍스트</td><td>짧음</td></tr>
      </tbody>
    </table>
  `,

  "aria-table-roles": `
    <div role="table" aria-label="점수">
      <div role="rowgroup" aria-roledescription="tableheader">
        <div role="row">
          <div role="columnheader">과목</div>
          <div role="columnheader">점수</div>
        </div>
      </div>
      <div role="rowgroup" aria-roledescription="tablebody">
        <div role="row">
          <div role="cell">수학</div>
          <div role="cell">95</div>
        </div>
      </div>
    </div>
  `,
} as const;

export type TableFixtureName = keyof typeof tableFixtures;
