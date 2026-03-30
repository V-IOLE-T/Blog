import remarkMath from "remark-math";
import rehypeSlug from "rehype-slug";
import rehypeKatex from "rehype-katex";
import remarkDirective from "remark-directive";
import { remarkNote, addClassNames } from "../plugins/markdown.custom.js";

export const markdownConfig = {
  remarkPlugins: [remarkMath, remarkDirective, remarkNote],
  rehypePlugins: [[rehypeKatex, { output: "mathml", trust: true, strict: false }], rehypeSlug, addClassNames],
  syntaxHighlight: "shiki",
  shikiConfig: { theme: "github-light" },
};
