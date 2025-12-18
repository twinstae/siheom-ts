import { useId, useState } from "react";
import * as v from "valibot";

const newMemberSchema = v.object({
	email: v.pipe(
		v.string(),
		v.email("올바른 이메일 형식이 아닙니다"),
	),
	password: v.pipe(
		v.string(),
		v.minLength(10, "비밀번호를 10자 이상 입력해주세요"),
	),
});

type NewMember = v.InferOutput<typeof newMemberSchema>;

export function SignUpForm({
	signUpMember,
}: { signUpMember: (newMember: NewMember) => Promise<void> }) {
	const [error, setError] = useState({
		email: undefined,
		password: undefined,
	} as { email: string | undefined; password: string | undefined });
	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();

				const data = new FormData(event.currentTarget);

				const result = v.safeParse(newMemberSchema, {
					email: data.get("email"),
					password: data.get("password"),
				});

				if (result.success) {
					signUpMember(result.output);
					return;
				}

				setError(
					Object.fromEntries(
						result.issues.map((issue) => [issue.path?.map(item => item.key).join("."), issue.message]),
					),
				);
			}}
		>
			
			<SimpleTextInput
				name="email"
				type="email"
				label="이메일"
				error={error}
			/>

			<SimpleTextInput
				name="password"
				type="password"
				label="비밀번호"
				error={error}
			/>

			<button type="submit">가입하기</button>
		</form>
	);
}

function SimpleTextInput({ name, type, label, error }: {
	name: string,
	type: "text" | "email" | "password",
	label: string,
	error: Record<string, string | undefined>,
}) {
	const inputId = useId();
	const errorId = useId();
	return (
		<>
			<label htmlFor={inputId}>{label}</label>
			<input
				id={inputId}
				role="textbox"
				type={type}
				name={name}
				aria-invalid={error[name] ? "true" : undefined}
				aria-describedby={error[name] ? errorId : ""}
				aria-errormessage={error[name] ? errorId : ""}
			/>
			<SimpleErrorMessage error={error} name={name} errorId={errorId} />
		</>
	)
}

function SimpleErrorMessage({ error, name, errorId }: {
	name: string,
	error: Record<string, string | undefined>,
	errorId: string
}) {
	return error[name] && (
		<div
			id={errorId}
			role="alert"
			aria-live="assertive"
			aria-label={error[name]}
		>
			{error[name]}
		</div>
	);
}

