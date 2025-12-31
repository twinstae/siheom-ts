"use client";

import { useId, type HTMLAttributes, type ReactNode, type Ref } from "react";
import { Checkbox as AriaCheckbox, type CheckboxProps as AriaCheckboxProps } from "react-aria-components";
import { cx } from "@test/utils/cx";

export interface CheckboxBaseProps {
    size?: "sm" | "md";
    className?: string;
    isSelected?: boolean;
    isDisabled?: boolean;
    isIndeterminate?: boolean;
}

export const CheckboxBase = ({ className, isDisabled, isIndeterminate, size = "sm" }: CheckboxBaseProps) => {
    return (
        <div
            className={cx(
                "relative flex size-4 shrink-0 cursor-pointer appearance-none items-center justify-center rounded bg-primary ring-1 ring-primary ring-inset",
                size === "md" && "size-5 rounded-md",
                "group-has-[:checked]:bg-brand-solid group-has-[:checked]:ring-bg-brand-solid",
                isIndeterminate && "bg-brand-solid ring-bg-brand-solid",
                isDisabled && "cursor-not-allowed bg-disabled_subtle ring-disabled",
                "aria-focus-visible:outline-2 aria-focus-visible:outline-offset-2 aria-focus-visible:outline-focus-ring",
                className,
            )}
        >
            <svg
                aria-hidden="true"
                viewBox="0 0 14 14"
                fill="none"
                className={cx(
                    "pointer-events-none absolute h-3 w-2.5 text-fg-white opacity-0 transition-inherit-all",
                    size === "md" && "size-3.5",
                    isIndeterminate && "opacity-100",
                    isDisabled && "text-fg-disabled_subtle",
                )}
            >
                <path d="M2.91675 7H11.0834" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

            <svg
                aria-hidden="true"
                viewBox="0 0 14 14"
                fill="none"
                className={cx(
                    "pointer-events-none absolute size-3 text-fg-white opacity-0 transition-inherit-all",
                    size === "md" && "size-3.5",
                    "group-has-[:checked]:opacity-100",
                    isIndeterminate && "opacity-0",
                    isDisabled && "text-fg-disabled_subtle",
                )}
            >
                <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </div>
    );
};
CheckboxBase.displayName = "CheckboxBase";

interface CheckboxProps extends Omit<React.ComponentProps<"input">, "ref" | "size"> {
    ref?: Ref<HTMLLabelElement>;
    size?: "sm" | "md";
    label?: ReactNode;
    hint?: ReactNode;
    isInvalid?: boolean;
}

export const Checkbox = ({ ref, label, hint, size = "sm", className, checked, onChange, isInvalid, ...ariaCheckboxProps }: CheckboxProps) => {
    const sizes = {
        sm: {
            root: "gap-2",
            textWrapper: "",
            label: "text-sm font-medium",
            hint: "text-sm",
        },
        md: {
            root: "gap-3",
            textWrapper: "gap-0.5",
            label: "text-md font-medium",
            hint: "text-md",
        },
    };

    const labelId = useId();
    const errorId = useId();
    return (
        <label
            ref={ref}
            className={cx(
                "group flex items-start",
                "aria-disabled:cursor-not-allowed",
                sizes[size].root,
                className
            )}
        >
            <input type="checkbox"
                className="sr-only"
                checked={checked}
                onChange={onChange}
                {...ariaCheckboxProps}
                aria-labelledby={labelId}
                aria-invalid={isInvalid ? "true" : undefined}
                aria-describedby={hint ? errorId : undefined}
                aria-errormessage={isInvalid ? errorId : undefined}
            />
            <CheckboxBase
                size={size}
                isDisabled={ariaCheckboxProps['aria-disabled'] === "true"}
                className={label || hint ? "mt-0.5" : ""}
            />
            {(label || hint) && (
                <div className={cx("inline-flex flex-col", sizes[size].textWrapper)}>
                    {label && <div id={labelId} className={cx("text-secondary select-none", sizes[size].label)}>{label}</div>}
                    {hint && (
                        <span id={errorId} role={isInvalid ? "alert" : undefined} className={cx("text-tertiary", sizes[size].hint)} onClick={(event) => event.stopPropagation()}>
                            {hint}
                        </span>
                    )}
                </div>
            )}
        </label>
    );
};
Checkbox.displayName = "Checkbox";
