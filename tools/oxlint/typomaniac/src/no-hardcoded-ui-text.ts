import { defineRule } from "@oxlint/plugins";

import type { ESTree } from "@oxlint/plugins";

// Words that read the same in every Locale: the product, the OAuth providers and the units.
const properNames: ReadonlySet<string> = new Set([
  "typomaniac",
  "GitHub",
  "Google",
  "Discord",
  "TP",
  "wpm",
]);

// The attributes a screen reader or a browser shows to the User.
const textAttributes: ReadonlySet<string> = new Set([
  "aria-label",
  "aria-valuetext",
  "title",
  "alt",
  "placeholder",
]);

const words = /[\p{L}\p{M}]+/gu;

// Text is UI text as soon as one of its words is not a proper name: punctuation, numbers and
// symbols alone say nothing a Locale would change.
const isUiText = (text: string) =>
  text.match(words)?.some((word) => !properNames.has(word)) ?? false;

type TextLiteral = ESTree.StringLiteral | ESTree.TemplateLiteral;

// Of every Literal, only a string one is written between quotes.
const isStringLiteral = (node: ESTree.JSXExpression): node is ESTree.StringLiteral =>
  node.type === "Literal" && /^["']/u.test(node.raw ?? "");

// The literals an expression may render: itself, or the branches of a condition.
const textLiterals = (node: ESTree.JSXExpression): TextLiteral[] => {
  if (isStringLiteral(node) || node.type === "TemplateLiteral") return [node];

  if (node.type === "ConditionalExpression") {
    return [...textLiterals(node.consequent), ...textLiterals(node.alternate)];
  }

  if (node.type === "LogicalExpression") {
    return [...textLiterals(node.left), ...textLiterals(node.right)];
  }

  return [];
};

const literalText = (node: TextLiteral) =>
  node.type === "Literal" ? node.value : node.quasis.map((quasi) => quasi.value.cooked).join(" ");

const attributeLiterals = (value: ESTree.JSXAttributeValue | null): TextLiteral[] => {
  if (value === null) return [];

  if (value.type === "Literal") return [value];

  if (value.type === "JSXExpressionContainer") return textLiterals(value.expression);

  return [];
};

const uiTextLiterals = (literals: TextLiteral[]) =>
  literals.filter((literal) => isUiText(literalText(literal)));

/** Ban UI text written in the JSX: every word the User reads comes from the messages. */
export const noHardcodedUiTextRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow hardcoded UI text in JSX and in its text attributes; read it from the messages.",
    },
    messages: {
      hardcoded: "Hardcoded {{what}}: read it from the messages (`m.<key>({}, { locale })`).",
    },
  },
  createOnce(context) {
    return {
      JSXText(node) {
        if (isUiText(node.value)) {
          context.report({ node, messageId: "hardcoded", data: { what: "UI text" } });
        }
      },
      JSXExpressionContainer(node) {
        if (node.parent.type !== "JSXElement" && node.parent.type !== "JSXFragment") return;

        for (const literal of uiTextLiterals(textLiterals(node.expression))) {
          context.report({ node: literal, messageId: "hardcoded", data: { what: "UI text" } });
        }
      },
      JSXAttribute(node) {
        if (node.name.type !== "JSXIdentifier" || !textAttributes.has(node.name.name)) return;

        const what = `\`${node.name.name}\``;

        for (const literal of uiTextLiterals(attributeLiterals(node.value))) {
          context.report({ node: literal, messageId: "hardcoded", data: { what } });
        }
      },
    };
  },
});
