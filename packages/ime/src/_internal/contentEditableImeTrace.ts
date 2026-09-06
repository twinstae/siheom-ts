import type { ComposedEventRecord } from "./types.js";
import { dispatch, type KeyEventFields } from "./events.js";
import { readEditableText } from "./editableElement.js";
import type { ImeTraceEmitter, InputEventFields } from "./imeTrace.js";

/** IME trace for contenteditable targets — events only, no session/value writeback. */
export class ContentEditableImeTrace implements ImeTraceEmitter {
  readonly records: ComposedEventRecord[] = [];
  private lastValue = "";

  constructor(readonly element: HTMLElement) {}

  keydown(init: KeyEventFields): void {
    this.emitKey("keydown", init, { cancelable: init.cancelable ?? true });
  }

  keyup(init: KeyEventFields): void {
    this.emitKey("keyup", init);
  }

  compositionStart(data: string = "", value?: string): void {
    this.emitComposition("compositionstart", data, value);
  }

  compositionUpdate(data: string, value?: string): void {
    this.emitComposition("compositionupdate", data, value, { cancelable: true });
  }

  compositionEnd(data: string, value?: string): void {
    this.emitComposition("compositionend", data, value);
  }

  beforeInput(fields: InputEventFields): void {
    this.emitInput("beforeinput", fields, { cancelable: fields.cancelable ?? true });
  }

  input(fields: InputEventFields): void {
    this.emitInput("input", fields);
  }

  private emitKey(
    type: "keydown" | "keyup",
    init: KeyEventFields,
    options: { cancelable?: boolean } = {},
  ): void {
    const { recordValue, cancelable, ...keyboardInit } = init;
    const fields = {
      key: keyboardInit.key,
      code: keyboardInit.code,
      keyCode: keyboardInit.keyCode,
      isComposing: keyboardInit.isComposing,
      ...(recordValue !== undefined ? { value: recordValue } : {}),
    };
    this.emit(
      type,
      {
        bubbles: true,
        ...options,
        ...(cancelable !== undefined ? { cancelable } : {}),
        ...keyboardInit,
      },
      fields,
    );
  }

  private emitComposition(
    type: "compositionstart" | "compositionupdate" | "compositionend",
    data: string,
    value?: string,
    options: { cancelable?: boolean } = {},
  ): void {
    this.emit(
      type,
      { bubbles: true, data, ...options },
      value === undefined ? { data } : { data, value },
    );
  }

  private emitInput(
    type: "beforeinput" | "input",
    fields: InputEventFields,
    options: { cancelable?: boolean } = {},
  ): void {
    const { inputType, data, isComposing, value } = fields;
    const composing =
      isComposing !== undefined ? ({ isComposing } as { isComposing: boolean }) : {};
    this.emit(
      type,
      { bubbles: true, inputType, data, ...composing, ...options },
      { inputType, data, ...composing, ...(value !== undefined ? { value } : {}) },
    );
  }

  private emit(
    type: keyof HTMLElementEventMap,
    init: EventInit & Record<string, unknown>,
    partial: Partial<ComposedEventRecord>,
  ): void {
    dispatch(this.element, type, init);
    const value =
      partial.value ?? (this.lastValue !== "" ? this.lastValue : readEditableText(this.element));
    if (partial.value !== undefined) {
      this.lastValue = partial.value;
    }
    this.records.push({
      type,
      key: partial.key ?? null,
      code: partial.code ?? null,
      keyCode: partial.keyCode ?? null,
      isComposing: partial.isComposing ?? null,
      inputType: partial.inputType ?? null,
      data: partial.data ?? null,
      value,
    });
  }
}
