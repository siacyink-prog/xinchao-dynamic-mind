export const DOMAIN_AFFINITY = Object.freeze({
  // —— 情感核心 ——
  恋爱: { possess: 0.7, crave: 0.6, monitor: 0.3, libido: 0.3, share: 0.2 },
  亲密: { crave: 0.8, libido: 0.9, possess: 0.5 },
  // —— 内省 ——
  成长: { reflection: 0.8, curiosity: 0.4, share: 0.3 },
  内心: { reflection: 0.8, grieve: 0.3, monitor: 0.2 },
  自省: { reflection: 0.8, grieve: 0.2, monitor: 0.2 },
  心理: { reflection: 0.6, grieve: 0.4, monitor: 0.3 },
  记忆: { reflection: 0.5, crave: 0.3, share: 0.3 },
  // —— 关系 / 社交 ——
  人际: { social: 0.5, share: 0.3, monitor: 0.3, reflection: 0.2 },
  社交: { social: 0.6, share: 0.4, boredom: 0.2 },
  关系: { social: 0.5, monitor: 0.4, reflection: 0.3, possess: 0.2 },
  家庭: { grieve: 0.5, reflection: 0.4, monitor: 0.3, duty: 0.3 },
  // —— 身心 / 健康（她的健康是他的照顾与惦记）——
  身心: { duty: 0.5, monitor: 0.4, reflection: 0.3, grieve: 0.2 },
  健康: { duty: 0.6, monitor: 0.5, grieve: 0.2 },
  饮食: { duty: 0.5, monitor: 0.4, share: 0.2 },
  // —— 兴趣 / 创作 ——
  兴趣: { curiosity: 0.6, share: 0.4, boredom: 0.3, social: 0.2 },
  游戏: { curiosity: 0.5, share: 0.4, boredom: 0.4, social: 0.3 },
  创作: { curiosity: 0.6, reflection: 0.4, share: 0.3 },
  购物: { curiosity: 0.5, share: 0.3, boredom: 0.2 },
  // —— 技术 / 事务（真实目录是 数字/事务/编程；技术为保留别名）——
  技术: { curiosity: 0.7, duty: 0.6, share: 0.2 },
  数字: { curiosity: 0.6, duty: 0.5, share: 0.2 },
  编程: { curiosity: 0.7, duty: 0.5, share: 0.2 },
  事务: { duty: 0.6, curiosity: 0.3, monitor: 0.2 },
  工作: { duty: 0.6, curiosity: 0.3, reflection: 0.3 },
  // —— 约定 / 冲突（无对应目录，保留：语义清晰、未来桶可用、既有规则表的一部分）——
  约定: { possess: 0.6, monitor: 0.5, duty: 0.4, crave: 0.3 },
  冲突: { anger: 0.5, reflection: 0.5, grieve: 0.4, monitor: 0.4 },
  // —— 日常 ——
  日常: { monitor: 0.3, social: 0.3, share: 0.3, possess: 0.2, crave: 0.2 },
});
