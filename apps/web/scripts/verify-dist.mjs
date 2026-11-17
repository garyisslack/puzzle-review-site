import fs from 'node:fs'
import path from 'node:path'

const dist = path.resolve(import.meta.dirname, '../dist')
const read = (rel) => fs.readFileSync(path.join(dist, rel), 'utf8')
const assert = (condition, message) => { if (!condition) throw new Error(message) }
const home = read('index.html')
assert(!home.includes('prism-pocket-sort') && !home.includes('We play every game ourselves'), '首页包含演示或实测误导')
assert(home.includes('Browse game research'), '首页缺少研究内容入口')
const review = read('reviews/meowdoku-ios-6761760135/index.html')
assert(review.includes('SoftwareApplication') && !review.includes('ratingValue') && !review.includes('aggregateRating'), '研究页评分结构化数据错误')
assert(review.includes('Unscored') && !review.includes('FULL REVIEW'), '资料分析冒充评分评测')
for (const img of review.match(/<img\b[^>]*>/g) ?? []) {
  assert(/\swidth=/.test(img) && /\sheight=/.test(img), `图片缺少尺寸: ${img}`)
}
assert(!fs.existsSync(path.join(dist, 'reviews/prism-pocket-sort/index.html')), '演示评测被发布')
assert(!fs.existsSync(path.join(dist, 'guides/prism-pocket-sort/index.html')), '演示攻略被发布')
assert(!fs.existsSync(path.join(dist, 'rankings/reviewed-ios/index.html')), '默认分榜单被发布')
const directory = read('reviews/index.html')
assert((directory.match(/class="review-row"/g) ?? []).length === 25, '目录第一页未分页')
assert(directory.includes('/reviews/page/2/'), '分页缺少可抓取链接')
const page2 = read('reviews/page/2/index.html')
assert(page2.includes('rel="canonical" href="https://puzzlereviewlab.com/reviews/page/2/"'), '分页 canonical 错误')
assert(read('reviews/page/20/index.html').includes('Page 20 of 20'), '最后一页缺失')
assert(read('reviews/search/index.html').includes('name="robots" content="noindex,follow"'), '搜索页未禁止索引')
assert(read('guides/submit/index.html').includes('noindex,follow'), '投稿页未禁止索引')
const sitemap = read('sitemap-reviews.xml')
assert((sitemap.match(/<url>/g) ?? []).length === 500, '研究 sitemap 数量错误')
assert(!sitemap.includes('prism-pocket-sort') && !read('sitemap-pages.xml').includes('/compare/'), 'sitemap 泄漏演示内容')
assert(!read('sitemap.xml').includes('sitemap-rankings.xml'), '空榜单仍提交至 sitemap 索引')
assert(read('seo-redirects.caddy').includes('/reviews/page/1/ /reviews/ 301'), 'Caddy 缺少分页规范化')
console.log('正式内容、分页与 SEO 构建检查通过')
