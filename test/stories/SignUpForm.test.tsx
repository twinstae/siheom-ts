import "../index.css"
import { describe, expect, it } from "vitest";
import { assertions, query, runSiheom } from "../../src";
import { actions } from "../../src/siheom/action";
import { given } from "../../src/siheom/given";
import { SignUpForm } from "./SignUpForm";

const MEMBER = {
	email: "test@test.com",
	password: "test123456",
	agreement: true,
	privacy: true,
};

const noop = async () => {};

describe("SignUpForm", () => {
	it("모든 값을 입력하면 가입할 수 있다", async () => {
		let result: unknown = null;
		await runSiheom(
			given.render(
				<SignUpForm
					signUpMember={async (newMember) => {
						result = newMember;
					}}
				/>,
			),

			actions.click(query.button("가입하기")),

			assertions.errormessage(
				query.textbox(/이메일/),
				"올바른 이메일 형식이 아닙니다",
			),
			assertions.errormessage(
				query.textbox(/비밀번호/),
				"비밀번호를 10자 이상 입력해주세요",
			),

			assertions.errormessage(
				query.checkbox("약관 동의"),
				"약관 동의에 동의해야 합니다",
			),
			assertions.errormessage(
				query.checkbox("개인정보 수집 동의"),
				"개인정보 수집 동의에 동의해야 합니다",
			),

			actions.fill(query.textbox(/이메일/), MEMBER.email),
			actions.fill(query.textbox(/비밀번호/), MEMBER.password),

			// 약관 동의 체크박스를 클릭한다
			actions.click(query.checkbox("약관 동의")),
			actions.click(query.checkbox("개인정보 수집 동의")),
			
			actions.click(query.button("가입하기")),
		);

		expect(result).toEqual(MEMBER);
	});

	it("초기 상태의 폼 접근성 스냅샷을 확인한다", () => {
		return runSiheom(
			given.render(
				<section aria-label="signup-form">
					<SignUpForm signUpMember={noop} />
				</section>
			),
			assertions.a11ySnapshot(query.region("signup-form"), "signup-form-initial.snap")
		);
	});

	it("에러 상태의 폼 접근성 스냅샷을 확인한다", async () => {
		await runSiheom(
			given.render(
				<section aria-label="signup-form">
					<SignUpForm signUpMember={noop} />
				</section>
			),
			actions.click(query.button("가입하기")),
			assertions.a11ySnapshot(query.region("signup-form"), "signup-form-with-errors.snap")
		);
	});

	it("입력 완료 상태의 폼 접근성 스냅샷을 확인한다", async () => {
		await runSiheom(
			given.render(
				<section aria-label="signup-form">
					<SignUpForm signUpMember={noop} />
				</section>
			),
			actions.fill(query.textbox(/이메일/), MEMBER.email),
			actions.fill(query.textbox(/비밀번호/), MEMBER.password),
			actions.click(query.checkbox("약관 동의")),
			actions.click(query.checkbox("개인정보 수집 동의")),
			assertions.a11ySnapshot(query.region("signup-form"), "signup-form-filled.snap")
		);
	});
});
