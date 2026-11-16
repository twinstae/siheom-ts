import "../../../index.css";
import { describe, it } from "vitest";
import { actions, assertions, given, query, runSiheom } from "../runSiheom";
import { DocumentActions } from "./DocumentActions.tsx";

describe("DocumentActions", () => {
  it("초기 접근성 스냅샷", async () => {
    await runSiheom(
      given.render(<DocumentActions />),
      assertions.a11ySnapshot(query.region("문서 목록"), "document-actions-initial.snap"),
    );
  });

  it("더보기 메뉴에서 문서를 복사할 수 있다", async () => {
    await runSiheom(
      given.render(<DocumentActions />),
      actions.click(query.button("기획서 더보기")),
      assertions.visible(query.menu("문서 동작")),
      actions.click(query.within(query.menu("문서 동작"), query.menuitem("복사"))),
      assertions.textContent(query.status("복사 결과"), "기획서 복사됨"),
    );
  });

  it("우클릭 메뉴에서 문서를 삭제할 수 있다", async () => {
    await runSiheom(
      given.render(<DocumentActions />),
      actions.contextClick(query.article("기획서")),
      assertions.visible(query.menu("문서 동작")),
      actions.click(query.within(query.menu("문서 동작"), query.menuitem("삭제"))),
      assertions.not.visible(query.article("기획서")),
    );
  });
});
