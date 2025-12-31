import { Button } from "@test/components/base/buttons/button";
import { Checkbox } from "@test/components/base/checkbox/checkbox";
import { Input } from "@test/components/base/input/input";
import { parseFormDatatoJsObject } from "@test/utils/parseFormDatatoJsObject";
import React, { createContext, useContext, useState } from "react";
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
	agreement: v.literal(true, "약관 동의에 동의해야 합니다"),
	privacy: v.literal(true, "개인정보 수집 동의에 동의해야 합니다"),
});

type NewMember = v.InferOutput<typeof newMemberSchema>;

export function SignUpForm({
	signUpMember,
}: { signUpMember: (newMember: NewMember) => Promise<void> }) {

	return (
		<SimpleForm
			className="flex flex-col gap-4 max-w-md mx-auto rounded-lg p-4 shadow-md"
			schema={newMemberSchema}
			onSubmit={signUpMember}
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

			<Button type="submit" color="primary">
				가입하기
			</Button>
		</SimpleForm>
	);
}

const ErrorContext = createContext<Record<string, string | undefined>>({});


function SimpleForm<T extends object>({ schema, children, onSubmit, ...formProps }: {
	schema: v.BaseSchema<T, T, v.BaseIssue<unknown>>,
	children: React.ReactNode,
	onSubmit: (data: T) => Promise<void>
} & Omit<React.FormHTMLAttributes<HTMLFormElement>, "onSubmit" | "children">) {
	const [error, setError] = useState({} as Record<string, string | undefined>);
	return (
		<ErrorContext.Provider value={error}>
			<form onSubmit={async (event) => {
				event.preventDefault();

				const formData = new FormData(event.currentTarget);

				const rawData = parseFormDatatoJsObject(formData, schema);
				const result = v.safeParse(schema, rawData);

				if (result.success === false) {
					const errors = Object.fromEntries(
						result.issues.map((issue) => [issue.path?.map(item => item?.key).join("."), issue.message]),
					);

					setError(errors);
					return;
				}

				setError({});
				return onSubmit(result.output);
			}} {...formProps}>
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
	const error = useContext(ErrorContext);
	return (
		<Input
			label={label}
			type={type}
			name={name}
			isInvalid={error[name] ? true : undefined}
			hint={error[name]}
		/>
	)
}

function SimpleCheckbox({ name, label, initChecked = false }: {
	name: string,
	label: string,
	initChecked?: boolean,
	onChange?: (checked: boolean) => void,
}) {
	const error = useContext(ErrorContext);
	const [checked, setChecked] = useState(initChecked);
	return (
		<Checkbox
			name={name}
			label={label}
			checked={checked}
			onChange={(event) => {
				setChecked(event.currentTarget.checked);
			}}
			isInvalid={error[name] ? true : undefined}
			hint={error[name]}
		/>
	)
}