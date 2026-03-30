export type BlogFolder = {
  slug: string;
  name: string;
  description: string;
  order: number;
};

const BLOG_FOLDERS: BlogFolder[] = [
  {
    slug: "frontend",
    name: "前端工程",
    description: "记录 Astro、主题开发、迁移实践与前端工程相关的经验总结。",
    order: 1,
  },
  {
    slug: "cloud",
    name: "云服务与边缘部署",
    description: "聚焦 Cloudflare、边缘节点、托管服务与面向全球访问的部署方案。",
    order: 2,
  },
  {
    slug: "tools",
    name: "开源工具",
    description: "收集和实践值得长期使用的开源工具、小项目与在线应用。",
    order: 3,
  },
  {
    slug: "ai",
    name: "AI 应用",
    description: "围绕大模型、自动化分析与 AI 驱动工作流的探索和实践。",
    order: 4,
  },
  {
    slug: "notes",
    name: "随记",
    description: "记录实验性的更新、过程笔记和站点维护中的零散内容。",
    order: 5,
  },
];

export default BLOG_FOLDERS;
