export interface A11yNodeStates {
	checked?: boolean;
	expanded?: boolean;
	selected?: boolean;
	disabled?: boolean;
	pressed?: boolean;
	current?: string | boolean;
	valueNow?: number;
	valueMin?: number;
	valueMax?: number;
	valueText?: string;
}

export interface A11yNode {
	role: string;
	name: string;
	level?: number;
	states: A11yNodeStates;
	description?: string;
	value?: string;
	children: A11yNode[];
}
