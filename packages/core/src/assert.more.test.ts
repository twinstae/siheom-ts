import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { defaultAssertions } from "./assert.ts";
import { query } from "./query.ts";

describe("assertions.visible", () => {
  it("passes when the element is in the document and not aria-hidden", async () => {
    document.body.innerHTML = `<button type="button">저장</button>`;

    await defaultAssertions.visible(query.button("저장"), true);
  });

  it("passes when the element is missing", async () => {
    document.body.innerHTML = ``;

    await defaultAssertions.visible(query.button("저장"), false);
  });

  it("passes when the element is aria-hidden", async () => {
    document.body.innerHTML = `<button type="button" aria-hidden="true">저장</button>`;

    await defaultAssertions.visible(query.button("저장"), false);
  });

  it("fails not.visible when the element is present and visible", async () => {
    document.body.innerHTML = `<button type="button">저장</button>`;

    await expect(defaultAssertions.visible(query.button("저장"), false)).rejects.toThrow();
  });
});

describe("assertions.selected", () => {
  it("passes for aria-selected true and false", async () => {
    document.body.innerHTML = `<div role="option" aria-label="옵션" aria-selected="true"></div>`;
    await defaultAssertions.selected(query.option("옵션"), true);

    document.body.innerHTML = `<div role="option" aria-label="옵션" aria-selected="false"></div>`;
    await defaultAssertions.selected(query.option("옵션"), false);
  });
});

describe("assertions.disabled", () => {
  it("passes for a native disabled button", async () => {
    document.body.innerHTML = `<button type="button" disabled>저장</button>`;

    await defaultAssertions.disabled(query.button("저장"), true);
  });

  it("passes for aria-disabled", async () => {
    document.body.innerHTML = `<button type="button" aria-disabled="true">저장</button>`;

    await defaultAssertions.disabled(query.button("저장"), true);
  });

  it("passes when aria-disabled is false", async () => {
    document.body.innerHTML = `<button type="button" aria-disabled="false">저장</button>`;

    await defaultAssertions.disabled(query.button("저장"), false);
  });
});

describe("assertions.current", () => {
  it("passes when aria-current matches", async () => {
    document.body.innerHTML = `<a href="/" aria-current="page">홈</a>`;

    await defaultAssertions.current(query.link("홈"), "page", true);
  });

  it("passes when aria-current does not match", async () => {
    document.body.innerHTML = `<a href="/about">소개</a>`;

    await defaultAssertions.current(query.link("소개"), "page", false);
  });
});

describe("assertions.count", () => {
  it("passes when the number of matches equals expected", async () => {
    document.body.innerHTML = `
      <button type="button">삭제</button>
      <button type="button">삭제</button>
    `;

    await defaultAssertions.count(query.button("삭제"), 2, true);
  });

  it("passes when the number of matches differs", async () => {
    document.body.innerHTML = `<button type="button">삭제</button>`;

    await defaultAssertions.count(query.button("삭제"), 2, false);
  });

  it("passes count 0 when nothing matches", async () => {
    document.body.innerHTML = `<button type="button">저장</button>`;

    await defaultAssertions.count(query.button("삭제"), 0, true);
  });
});

describe("assertions.value href errormessage description expanded", () => {
  it("passes for input value", async () => {
    document.body.innerHTML = `<label>이름<input value="김태희" /></label>`;

    await defaultAssertions.value(query.textbox("이름"), "김태희", true);
    await defaultAssertions.value(query.textbox("이름"), "다른값", false);
  });

  it("passes for link href", async () => {
    document.body.innerHTML = `<a href="/docs">문서</a>`;

    await defaultAssertions.href(query.link("문서"), "/docs", true);
    await defaultAssertions.href(query.link("문서"), "/other", false);
  });

  it("passes for accessible error message", async () => {
    document.body.innerHTML = `
      <label>이메일<input aria-invalid="true" aria-errormessage="email-error" /></label>
      <div id="email-error">이메일이 필요합니다</div>
    `;

    await defaultAssertions.errormessage(query.textbox("이메일"), "이메일이 필요합니다", true);
    await defaultAssertions.errormessage(query.textbox("이메일"), "다른 오류", false);
  });

  it("passes for accessible description", async () => {
    document.body.innerHTML = `
      <label>이메일<input aria-describedby="email-hint" /></label>
      <div id="email-hint">회사 메일을 입력하세요</div>
    `;

    await defaultAssertions.description(query.textbox("이메일"), "회사 메일을 입력하세요");
  });

  it("passes for aria-expanded", async () => {
    document.body.innerHTML = `<button type="button" aria-expanded="true">메뉴</button>`;
    await defaultAssertions.expanded(query.button("메뉴"), true);

    document.body.innerHTML = `<button type="button" aria-expanded="false">메뉴</button>`;
    await defaultAssertions.expanded(query.button("메뉴"), false);
  });
});

describe("assertions.checked radio", () => {
  it("passes for a checked radio input", async () => {
    document.body.innerHTML = `
      <label><input type="radio" name="size" checked />크게</label>
    `;

    await defaultAssertions.checked(query.radio("크게"), true);
  });
});
