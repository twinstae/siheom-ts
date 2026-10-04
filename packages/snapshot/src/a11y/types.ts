export interface A11yStates {
  hidden?: boolean | null;
  disabled?: boolean | null;

  /**
   * @deprecated Retained for compatibility with manually constructed trees.
   * Generated trees should use `interaction.focusable` instead.
   */
  focusable?: boolean | null;

  /**
   * @deprecated Retained for compatibility with manually constructed trees.
   * Generated trees should use `interaction.focused` instead.
   */
  focused?: boolean | null;
  modal?: boolean | null;

  expanded?: boolean | null;
  pressed?: boolean | "mixed" | null;
  checked?: boolean | "mixed" | null;
  selected?: boolean | null;
  current?: string | boolean | null;

  invalid?: boolean | "grammar" | "spelling" | null;
  required?: boolean | null;
  readonly?: boolean | null;
}

export interface A11yInteraction {
  focusable: boolean;
  tabbable: boolean;
  focused: boolean;
  keyshortcuts?: string;
  accesskey?: string;
}

export interface A11yAttributes {
  [key: string]: string;
}

export type A11yOtherValue = string | number | boolean | null;
export type A11yOther = Record<string, A11yOtherValue>;

export interface A11yProperties {
  level?: number | null;
  haspopup?: string | boolean | null;
  orientation?: "horizontal" | "vertical" | null;
  multiselectable?: boolean | null;
  autocomplete?: string | null;

  valuemin?: number | null;
  valuemax?: number | null;
  valuenow?: number | null;
  valuetext?: string | null;

  posinset?: number | null;
  setsize?: number | null;

  colcount?: number | null;
  colindex?: number | null;
  colspan?: number | null;
  rowcount?: number | null;
  rowindex?: number | null;
  rowspan?: number | null;
  sort?: "ascending" | "descending" | "none" | "other" | null;
}

export interface A11yRelation {
  id: string;
  name: string;
}

export interface A11yRelationOrNull {
  id: string;
  name: string | null;
}

export interface A11yRelations {
  activedescendant?: A11yRelation | A11yRelationOrNull | null;
  controls?: A11yRelation[] | A11yRelationOrNull[] | null;
  describedby?: A11yRelation[] | A11yRelationOrNull[] | null;
  details?: A11yRelation | A11yRelationOrNull | null;
  errormessage?: A11yRelation | A11yRelationOrNull | null;
  flowto?: A11yRelation[] | A11yRelationOrNull[] | null;
  labelledby?: A11yRelation[] | A11yRelationOrNull[] | null;
  owns?: A11yRelation[] | A11yRelationOrNull[] | null;
}

export interface A11yLiveRegion {
  live?: "off" | "polite" | "assertive" | null;
  atomic?: boolean | null;
  relevant?: string | null;
  busy?: boolean | null;
}

export interface A11yDragDrop {
  grabbed?: boolean | null;
  dropeffect?: string | null;
}

export interface A11yNode {
  role: string;
  name: string;
  description?: string | null;
  value?: string | null;

  states?: A11yStates;
  properties?: A11yProperties;
  relations?: A11yRelations;
  liveRegion?: A11yLiveRegion;
  dragDrop?: A11yDragDrop;
  interaction?: A11yInteraction;
  attributes?: A11yAttributes;
  other?: A11yOther;

  children: A11yNode[];
}

export interface BuildA11yTreeOptions {
  mode?: "compact" | "verbose";
  computeOther?: (el: HTMLElement) => A11yOther | undefined;
  includeHidden?: boolean;
}

export interface SerializeOptions {
  mode?: "compact" | "verbose";
}
