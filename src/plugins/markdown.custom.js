import { visit } from "unist-util-visit";
import getReadingTime from "reading-time";
import { toString } from "mdast-util-to-string";

const remarkNote = () => {
  return (tree, file) => {
    visit(tree, (node) => {
      const { type, name, attributes = {} } = node;
      if (type !== "textDirective" && type !== "leafDirective" && type !== "containerDirective") {
        return;
      }

      const data = node.data || (node.data = {});
      const hProperties = data.hProperties || (data.hProperties = {});
      data.hName = name === "btn" ? "a" : "section";

      if (attributes.link) {
        hProperties.href = attributes.link;
      }

      if (name === "picture") {
        node.children = node.children.flatMap((child) => (child.type === "paragraph" ? child.children : child));
      }

      if (name.startsWith("vh")) {
        Object.keys(node.attributes || {}).forEach((key) => {
          hProperties[`data-${key}`] = node.attributes[key];
        });
      }

      hProperties.class = `vh-node vh-${name}${attributes.type ? ` ${name}-${attributes.type}` : ""}`;

      const astroFrontmatter = file?.data?.astro?.frontmatter;
      if (astroFrontmatter) {
        const textOnPage = toString(tree);
        const readingTime = getReadingTime(textOnPage);
        astroFrontmatter.reading_time = readingTime.minutes;
        astroFrontmatter.article_word_count = readingTime.words;
      }
    });
  };
};

const addClassNames = () => {
  return (tree) => {
    visit(tree, (node, index, parent) => {
      if (node.tagName === "a") {
        node.properties.target = "_blank";
        node.properties.rel = "noopener nofollow";
        node.children = [{ type: "element", tagName: "span", children: node.children || [] }];
        return;
      }

      if (node.tagName === "pre") {
        const wrapperNode = {
          type: "element",
          tagName: "section",
          properties: { class: "vh-code-box" },
          children: [
            { type: "element", tagName: "span", properties: { class: "vh-code-copy" } },
            node,
          ],
        };
        if (parent && index !== null) {
          parent.children.splice(index, 1, wrapperNode);
        }
        return;
      }

      if (node.tagName === "img") {
        node.properties.class = "vh-article-img";
        node.properties["data-vh-lz-src"] = node.properties.src;
        node.properties.src = "/assets/images/lazy-loading.webp";
        return;
      }

      if (
        node.tagName === "section" &&
        node.properties.class &&
        node.properties.class.includes("vh-vhVideo")
      ) {
        node.children = [
          {
            type: "element",
            tagName: "section",
            properties: { class: "vh-space-loading" },
            children: [
              { type: "element", tagName: "span" },
              { type: "element", tagName: "span" },
              { type: "element", tagName: "span" },
            ],
          },
        ];
      }
    });
  };
};

export { remarkNote, addClassNames };
