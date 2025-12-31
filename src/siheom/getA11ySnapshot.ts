import { getAccessibleName } from 'accname';

const textNameElementsTagNameList = [
    "button",
    "cell",
    "checkbox",
    "columnheader",
    "gridcell",
    "heading",
    "link",
    "menuitem",
    "menuitemcheckbox",
    "menuitemradio",
    "option",
    "radio",
    "row",
    "rowheader",
    "switch",
    "tab",
    "tooltip",
]

/**
 * @param {HTMLElement} element
 * @returns {string}
 */
export function getA11ySnapshot(element: HTMLElement) {
    /**
     * @param {HTMLElement} el
     * @returns {string}
     */
    function getAriaRole(el: HTMLElement) {
        if (el.getAttribute("role") === "presentation") {
            return "";
        }

        return (
            el.getAttribute("role") ||
            {
                h1: "heading",
                h2: "heading",
                h3: "heading",
                h4: "heading",
                h5: "heading",
                h6: "heading",
                ul: "list",
                ol: "list",
                li: "listitem",
                a: "link",
                button: "button",
                form: "form",
                input: el.getAttribute("type") === "file" ? "input" : el.getAttribute("type") === "checkbox" ? "checkbox" : el.getAttribute("type") === "radio" ? "radio" : "textbox",
                textarea: "textbox",
                header: "banner",
                img: "img",
                table: "table",
                thead: "rowgroup",
                tbody: "rowgroup",
                section: "region",
                progress: "progressbar",
                p: "paragraph",
                tr: "row",
                th: "columnheader",
                td: "cell",
            }[el.tagName.toLowerCase()] ||
            ""
        );
    }

    /**
     * @param {HTMLElement} el
     * @param {number} [depth=0]
     * @returns {string}
     */
    function processElement(el: HTMLElement, depth = 0) {
        if (el === null || el === undefined || el.ariaHidden === 'true' || el.hidden || el.tagName === "IFRAME") return "";
        const role = getAriaRole(el);

        const name = getAccessibleName(el) || el.ariaLabel;

        let result = role
            ? `${"  ".repeat(depth) + role + (name ? `: "${name}"` : "")} ${el.hasAttribute("disabled") ? ":disabled" : ""}${el.role === "combobox" && el.tagName === "BUTTON" ? `[text="${el.textContent}"]` : ""}${(el.tagName === "INPUT" || el.tagName === "PROGRESS") ?
                ["checkbox", "radio"].includes(role) ? `[checked=${(el as HTMLInputElement).checked}]` : `[value=${(el as HTMLInputElement).value}]` : (role === "tab" || role === "option")
                    && el.ariaSelected === "true" ? "[aria-selected=true]"
                    : role === "progressbar" ? `[aria-valuenow=${el.getAttribute("aria-valuenow")}]`
                        : el.hasAttribute("aria-current") ? `[aria-current=${el.getAttribute("aria-current")}]`
                            : el.hasAttribute("aria-expanded") ? `[aria-expanded=${el.getAttribute("aria-expanded")}]`
                                : ""}${el.getAttribute("aria-description") ? `[aria-description="${el.getAttribute("aria-description")}"]` : ""}\n`
            : "";

        const childNodes = Array.from(el.childNodes).filter(child => !(child instanceof SVGElement));

        if (childNodes.every(child => child instanceof Text) && childNodes.map(child => child.textContent).join("").trim() === name) {
            return result;
        }

        if (childNodes.every(child => child instanceof Text) && childNodes.map(child => child.textContent).join("").trim() === "") {
            return result;
        }

        if (childNodes.every(child => child instanceof Text)) {
            return `${result}${"  ".repeat(depth + 1)}"${childNodes.map(child => child.textContent).join("").trim()}"\n`;
        }

        for (const child of childNodes) {
            if (child instanceof Text && child.textContent.trim() !== "") {
                result += `${"  ".repeat(depth + 1)}"${child.textContent}"\n`;
            } else if (child instanceof HTMLElement) {
                result += processElement(child, depth + (role ? 1 : 0));
            }
        }

        if (childNodes.length === 0 && !textNameElementsTagNameList.includes(role) && el.textContent !== "") {
            result += `${"  ".repeat(depth + 1)}"${el.textContent}"\n`;
        }
        return result;

    }

    return processElement(element).trim();
}