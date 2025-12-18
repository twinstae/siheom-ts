import { createContext, useContext, useId, useState } from "react";
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
	agreement: v.boolean("약관 동의에 동의해야 합니다"),
	privacy: v.boolean("개인정보 수집 동의에 동의해야 합니다"),
});

type NewMember = v.InferOutput<typeof newMemberSchema>;

export function SignUpForm({
	signUpMember,
}: { signUpMember: (newMember: NewMember) => Promise<void> }) {

	return (
		<SimpleForm
			onSubmit={async (data) => {
				const result = v.safeParse(newMemberSchema, {
					email: data.get("email") as string,
					password: data.get("password") as string,
					agreement: data.has("agreement"),
					privacy: data.has("privacy"),
				});

				if (result.success) {
					signUpMember(result.output);
					return result;
				}
				return result;
			}}
		>
			<SimpleTextInput
				name="email"
				type="email"
				label="이메일"
			/>

			<SimpleTextInput
				name="password"
				type="password"
				label="비밀번호"
			/>

			<SimpleCheckbox
				name="agreement"
				label="약관 동의"
			/>

			<SimpleCheckbox
				name="privacy"
				label="개인정보 수집 동의"
			/>

			<button type="submit">
				가입하기
			</button>
		</SimpleForm>
	);
}

const ErrorContext = createContext<Record<string, string | undefined>>({});

function SimpleForm({ children, onSubmit }: {
	children: React.ReactNode,
	onSubmit: (data: FormData) => Promise<{
		success: true,
		output: any,
	} | {
		success: false,
		issues: {
			path?: ({
				key: string | number | undefined | unknown,
			} | undefined)[],
			message: string,
		}[],
	}>
}) {
	const [error, setError] = useState({} as Record<string, string | undefined>);
	return (
		<ErrorContext.Provider value={error}>
			<form onSubmit={async (event) => {
				event.preventDefault();

				const data = new FormData(event.currentTarget);

				const result = await onSubmit(data)

				if (result.success === false) {
					setError(
						Object.fromEntries(
							result.issues.map((issue) => [issue.path?.map(item => item?.key).join("."), issue.message]),
						),
					);
				}
			}}>
				{children}
			</form>
		</ErrorContext.Provider>
	)
}

function SimpleTextInput({ name, type, label }: {
	name: string,
	type: "text" | "email" | "password",
	label: string,
}) {
	const inputId = useId();
	const errorId = useId();
	const error = useContext(ErrorContext);
	return (
		<>
			<label htmlFor={inputId}>{label}</label>
			<input
				id={inputId}
				role="textbox"
				type={type}
				name={name}
				{...getInputErrorProps(error, name, errorId)}
			/>
			<SimpleErrorMessage error={error} name={name} errorId={errorId} />
		</>
	)
}

function SimpleCheckbox({ name, label }: {
	name: string,
	label: string,
}) {
	const inputId = useId();
	const errorId = useId();
	const error = useContext(ErrorContext);
	return (
		<>
			<label htmlFor={inputId}>{label}</label>
			<input
				id={inputId}
				type="checkbox"
				name={name}
				{...getInputErrorProps(error, name, errorId)}
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

function getInputErrorProps(error: Record<string, string | undefined>, name: string, errorId: string): {
	"aria-invalid": "true" | undefined,
	"aria-describedby": string,
	"aria-errormessage": string,
} {
	return {
		"aria-invalid": error[name] ? "true" : undefined,
		"aria-describedby": error[name] ? errorId : "",
		"aria-errormessage": error[name] ? errorId : "",
	};
}
