import { describe, it } from "vitest";
import { assertions, query, runSiheom } from "../../src";
import { actions } from "../../src/siheom/action";
import { given } from "../../src/siheom/given";
import { Counter } from "./Counter";

describe("Counter", () => {
  it("값을 증가시킬 수 있다", () => {
    return runSiheom(
        given.render(<Counter />),
        actions.click(query.button("0")),
        actions.click(query.button("1")),
        assertions.visible(query.button("2"))
    )
  })

  it("초기 상태의 접근성 스냅샷을 확인한다", () => {
    return runSiheom(
        given.render(<Counter />),
        assertions.a11ySnapshot(query.button("0"), "counter-initial.snap")
    )
  })

  it("클릭 후 접근성 스냅샷을 확인한다", () => {
    return runSiheom(
        given.render(<Counter />),
        actions.click(query.button("0")),
        actions.click(query.button("1")),
        assertions.a11ySnapshot(query.button("2"), "counter-after-clicks.snap")
    )
  })
})
