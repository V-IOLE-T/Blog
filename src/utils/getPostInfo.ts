import { getCollection } from "astro:content";
const posts = (await getCollection("blog"))
  .filter((post) => !post.data.hide)
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

// 获取统计数据
const getCountInfo = () => {
  return {
    ArticleCount: posts.length,
    FolderCount: new Set(posts.map((post) => post.data.folder)).size,
    TagCount: getTags().length,
  }
}

// 获取文章标签
const getTags = () => {
  const tagList = posts.reduce((acc: any, i: any) => {
    (i.data.tags || []).forEach((tag: string) => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {});
  return Object.entries(tagList).sort((a: any, b: any) => b[1] - a[1]);
}

// 获取推荐文章 (给文章添加 recommend: true 字段)
const getRecommendArticles = () => {
  const recommendList = posts.filter(i => i.data.recommend);
  return (recommendList.length ? recommendList : posts.slice(0, 6)).map(i => ({ title: i.data.title, date: i.data.date, id: i.data.id }))
};

// 获取上一篇下一篇文章
const getPrevNextPosts = (id: string) => {
  const noHidePosts = posts.filter(i => !i.data.hide);
  const index = noHidePosts.findIndex(i => i.data.id === id);
  const none = { title: '没有啦~', id: '#' };
  return { prev: noHidePosts[index - 1] ? noHidePosts[index - 1].data : none, next: noHidePosts[index + 1] ? noHidePosts[index + 1].data : none }
}


export { getTags, getRecommendArticles, getCountInfo, getPrevNextPosts };
