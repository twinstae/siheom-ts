import "../../index.css";
import { describe, it } from "vitest";
import { userEvent } from "vitest/browser";
import { actions, assertions, createReactSiheom, given, query } from "@siheom/react";
import { ArkPopover } from "./ArkPopover";

const { runSiheom } = createReactSiheom({ user: userEvent });

describe("ArkPopover", () => {
  it("바깥을 누르면 닫힌다 (vitest/browser userEvent로 실제 입력)", async () => {
    await runSiheom(
      given.render(<ArkPopover />),
      actions.click(query.button("팝오버 열기")),
      assertions.visible(query.dialog("팝오버 제목")),
      actions.click(query.button("바깥 버튼")),
      assertions.not.visible(query.dialog("팝오버 제목")),
    );
  });
});
