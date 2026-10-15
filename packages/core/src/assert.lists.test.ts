import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { assertions, defaultAssertions } from "./assert.ts";
import { runSiheom } from "./index.ts";
import { query } from "./query.ts";

describe("assertions.textContents", () => {
  it("passes when list items' normalized text equals expected in order", async () => {
    document.body.innerHTML = `
      <ul aria-label="캐릭터">
        <li>  GM </li>
        <li>Player
          1</li>
      </ul>
    `;

    await defaultAssertions.textContents(query.list("캐릭터"), ["GM", "Player 1"]);
  });

  it("fails when an extra item is present", async () => {
    document.body.innerHTML = `
      <ul aria-label="캐릭터">
        <li>GM</li>
        <li>Player</li>
        <li>상인</li>
      </ul>
    `;

    await expect(
      defaultAssertions.textContents(query.list("캐릭터"), ["GM", "Player"]),
    ).rejects.toThrow();
  });

  it("accepts RegExp entries", async () => {
    document.body.innerHTML = `
      <ol aria-label="세션 로그">
        <li>GM문이 열린다 <time>10:00</time></li>
        <li>안은 어둡다 <time>10:01</time></li>
      </ol>
    `;

    await defaultAssertions.textContents(query.list("세션 로그"), [
      /^GM문이 열린다/,
      /^안은 어둡다/,
    ]);
  });

  it("ignores items of nested lists", async () => {
    document.body.innerHTML = `
      <ul aria-label="목차">
        <li>시작</li>
        <li>규칙
          <ul aria-label="규칙 목차">
            <li>판정</li>
            <li>전투</li>
          </ul>
        </li>
      </ul>
    `;

    await defaultAssertions.textContents(query.list("목차"), ["시작", "규칙 판정 전투"]);
  });

  it.each([
    {
      container: query.listbox("화자"),
      html: `<div role="listbox" aria-label="화자">
        <div role="option" aria-selected="false">GM</div>
        <div role="option" aria-selected="false">Player</div>
      </div>`,
    },
    {
      container: query.menu("동작"),
      html: `<div role="menu" aria-label="동작">
        <div role="menuitem">GM</div>
        <div role="menuitem">Player</div>
      </div>`,
    },
    {
      container: query.tablist("탭"),
      html: `<div role="tablist" aria-label="탭">
        <button role="tab">GM</button>
        <button role="tab">Player</button>
      </div>`,
    },
    {
      container: query.radiogroup("편"),
      html: `<div role="radiogroup" aria-label="편">
        <div role="radio" aria-checked="false">GM</div>
        <div role="radio" aria-checked="false">Player</div>
      </div>`,
    },
    {
      container: query.table("캐릭터"),
      html: `<table aria-label="캐릭터"><tbody>
        <tr><td>GM</td></tr>
        <tr><td>Player</td></tr>
      </tbody></table>`,
    },
    {
      container: query.rowgroup("본문"),
      html: `<table><tbody aria-label="본문">
        <tr><td>GM</td></tr>
        <tr><td>Player</td></tr>
      </tbody></table>`,
    },
  ])("picks items by the role of $container.role", async ({ container, html }) => {
    document.body.innerHTML = html;

    await defaultAssertions.textContents(container, ["GM", "Player"]);
  });

  it("runs as a step and shows the expected/actual diff on failure", async () => {
    document.body.innerHTML = `
      <ul aria-label="캐릭터">
        <li>GM</li>
        <li>상인</li>
      </ul>
    `;

    await runSiheom(assertions.textContents(query.list("캐릭터"), ["GM", "상인"]));
    await expect(
      runSiheom(assertions.textContents(query.list("캐릭터"), ["GM", "Player"])),
    ).rejects.toThrow("expected [ 'GM', '상인' ] to deeply equal [ 'GM', 'Player' ]");
  });
});

describe("assertions.names", () => {
  it("compares items' accessible names in order", async () => {
    document.body.innerHTML = `
      <ol aria-label="세션 로그">
        <li aria-label="마스터 GM">문이 열린다</li>
        <li aria-label="플레이어 Player">들어간다</li>
      </ol>
      <div role="radiogroup" aria-label="편">
        <label><input type="radio" name="side" />마스터</label>
        <label><input type="radio" name="side" />플레이어</label>
      </div>
    `;

    await runSiheom(
      assertions.names(query.list("세션 로그"), ["마스터 GM", /^플레이어/]),
      assertions.names(query.radiogroup("편"), ["마스터", "플레이어"]),
    );
  });
});
