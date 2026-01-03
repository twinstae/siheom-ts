/**
 * Ported from @testing-library/dom's helpers.js
 * @see https://github.com/testing-library/dom-testing-library/blob/e395d5b8ecd4ec95cc02540ddcf16571ecd33e0f/src/helpers.ts
 */
export function isSubtreeInaccessible(el: Element): boolean {
	if ((el as HTMLElement).hidden) {
		return true;
	}

	if (el.getAttribute("aria-hidden") === "true") {
		return true;
	}

	const win = el.ownerDocument.defaultView;
	if (win) {
		const style = win.getComputedStyle(el);
		if (style.display === "none") {
			return true;
		}
	}

	return false;
}

export function isInaccessible(el: Element): boolean {
	const win = el.ownerDocument.defaultView;
	if (win) {
		const style = win.getComputedStyle(el);
		// visibility is inherited - early exit
		if (style.visibility === "hidden") {
			return true;
		}
	}

	// Walk up for aria-hidden inheritance
	let current: Element | null = el;
	while (current) {
		if (isSubtreeInaccessible(current)) {
			return true;
		}
		current = current.parentElement;
	}

	return false;
}
