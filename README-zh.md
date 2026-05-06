<div align="center">
  <h1>Aperture</h1>
  <p><b>一个 Markdown-first 的 Wiki 与生活系统，将你的笔记转化为可导航的知识图谱。</b></p>
  <a href="https://github.com/ZepPellN/Aperture/stargazers"><img src="https://img.shields.io/github/stars/ZepPellN/Aperture?style=flat-square" alt="Stars"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="License"></a>
  <a href="https://x.com/plutozeppln"><img src="https://img.shields.io/badge/follow-@plutozeppln-black?style=flat-square&logo=X" alt="X"></a>
</div>

## 你能得到什么

Aperture 是一个 Next.js 查看器，从文件系统读取纯 Markdown 文件，并将其渲染为结构化的知识系统。它不是笔记应用，而是一副透镜：你像往常一样写 Markdown，Aperture 将其编译为你和你的 Agent 可以探索的东西。

### 首页

打开 `/`，你会看到一个仪表盘，呈现当下最重要的内容：

- **搜索** — 跨所有文章的关键词搜索，支持语义扩展模式，即使词汇不匹配也能找到相关想法。
- **分类导航** — 侧边栏（桌面端）或药丸栏（移动端）列出 Wiki 中的每个分类。点击分类打开浮层，展示该分类下的所有文章。
- **最近更新时间线** — 按时间分组的文章：今天、本周、本月、更早。一眼就能看出你最近在思考什么。
- **统计栏** — 总文章数、总链接数、孤儿文章数、分类数。
- **分类卡片** — 每个分类展示其最新文章的预览。

首页是一个跳板：搜索特定内容、浏览分类，或者沿着时间线继续之前的工作。

### Wiki 文章

每篇 `/wiki/<slug>` 文章都是一个自包含的页面，远不止渲染后的 Markdown：

- **面包屑与元数据** — 分类、最后修改日期、阅读时间、字数。
- **正文渲染** — GitHub Flavored Markdown，带语法高亮、wikilink 解析（`[[slug|label]]`）、来源链接展开。
- **来源出处** — 每篇文章列出其来源及贡献度等级（高 / 中 / 低 / 未知）。来源从正文链接、吸收日志、frontmatter 和手动贡献中提取。你始终知道一个想法来自哪里。
- **演化时间线** — 按时间顺序列出事件（创建、吸收、合并、拆分、重命名、精炼、链接），让你看到某个想法如何随时间变化。
- **语义路径** — "探索未发现的路径"展示这篇文章的 top 语义邻居及匹配分数，让你在相关概念间漫游。
- **反向链接** — 底部列出所有链接到本文的文章。
- **浮动迷你图** — 可开关的 SVG 浮层，展示当前文章的 1 度邻居，附带链接可在完整图浏览器中打开。

### 图谱探索

Aperture 内置四种截然不同的图谱可视化。它们读取同一套底层数据（文章为节点，wikilink 为边），但回答不同的问题：

| 视图 | 技术 | 展示内容 |
|---|---|---|
| **Network** | Sigma.js + WebGL | 力导向图，节点大小按链接数计算，分类着色，聚焦模式（隔离邻居），集群高亮，相机动画过渡。无 WebGL 环境自动降级为 SVG。 |
| **Topo Map** | Canvas + D3-contour | 地形密度图。文章为点，等高线带展示知识密度，分类色晕揭示集群领地，质心标签命名每个分类。悬浮显示链接统计。 |
| **Semantic Map** | Canvas + D3-contour | 与 Topo Map 相同的视觉语言，但使用 UMAP 语义坐标而非力导向布局。语义相似的文章聚集在一起，无论是否有直接链接。 |
| **Nest** | React Three Fiber + Three.js | 3D 有机集群可视化。分类环形排列，每篇文章是一个由线段爆发构成的"种子"形状。边为动画生长弧线。轨道控制：左键拖动平移，右键拖动旋转。点击节点聚焦相机并打开详情卡片。 |

通过标签页切换视图。图谱浏览器可从任意文章通过 "View in Graph" 进入，或直接访问 `/graph`。

### 语义聚类

`/clusters` 在 UMAP 降维后的嵌入上运行 DBSCAN，发现知识岛屿 —— 即使没有直接链接也在语义上相近的文章群组。每个聚类展示成员数量、质心文章和内容预览。在这里你会发现意想不到的联系。

### 随机漫步

`/walk` 从随机文章开始，展示其语义邻居。选择一个，你就漫步其中。当你不知道在寻找什么时，这是一个刻意设计的偶然发现机制。

### 生活仪表盘

`/life` 读取另一组 Markdown 文件（每日日记、每周意图、习惯追踪、目标列表），并将其编译为统一的个人仪表盘：

- **每周统计栏** — 当前周数、待办任务、已完成任务、捕获的想法数。
- **每周意图卡片** — 四个固定分类：STOP（停止做什么）、START（开始做什么）、FORGIVE（放下什么）、SELF-CARE（为自己做什么）。
- **下一步行动** — 从近期日记条目中提取，以网格形式展示。
- **心情时间线** — 柱状图，展示过去两周每天的主导情绪和能量水平。
- **习惯热力图** — 运动、饮食、睡眠质量、补剂。列为天，行为为行，颜色深浅表示完成度。
- **任务速度** — 堆叠柱状图，展示每周待办 vs 已完成的任务数。
- **最近日记** — 可展开的近几天条目。
- **生活领域** — 可折叠区域，展示每个生活领域的目标数量和关联文档。
- **2026 目标** — 按领域分组的目标，可展开计划和目标详情。
- **周回顾** — 可折叠的历史回顾，含构建天数统计和想法生成数。

生活仪表盘与 Wiki 共享相同的 Markdown-first 哲学。没有数据库，没有同步服务，只有文件。

### Agent 接口

Aperture 为人类和 Agent 同等构建：

- **`/api/wiki/<slug>`** — 任意文章的 JSON API。返回 slug、标题、分类、原始 Markdown、编译后的 HTML、来源、反向链接、语义邻居、阅读时间和字数。
- **`/llms.txt`** — 面向 Agent 的系统介绍文件。
- **`/llms-full.txt`** — 完整的 Agent 可读索引。
- **捆绑 Skills** — 可安装的 Claude Code skills，用于 Wiki 维护（`wiki-absorb`、`wiki-health`、`wiki-query` 等），位于 `.agents/skills/`。

## 页面与路由

| 路由 | 用途 |
|---|---|
| `/` | 首页：搜索、分类、最近更新、统计 |
| `/wiki/<slug>` | 文章页，含来源、演化、反向链接、迷你图 |
| `/graph` | 全屏图谱浏览器，4 种视图模式 |
| `/clusters` | 语义聚类浏览器 |
| `/walk` | 语义邻居随机漫步 |
| `/life` | 个人生活仪表盘 |
| `/api/wiki/<slug>` | 文章数据的 JSON API |

## 设计

三条约束指导每个决策：

| 约束 | 规则 |
|---|---|
| **Markdown-first** | 源文件是带 YAML frontmatter 的纯 Markdown。无锁定，无专有格式。 |
| **File-over-app** | 数据存于文件系统，而非数据库。应用只是查看器。 |
| **Agent-native** | 每个功能都设计为 AI Agent 可以编程式地读取、写入和维护。 |

视觉设计：OKLCH 暖大地色调色板，标题用 Newsreader 衬线字体，正文用 Geist 无衬线字体，微妙的噪点纹理叠加，light/dark 模式切换并持久化到 localStorage。

## 自动化

Aperture 包含一套操作 Markdown 文件的 CLI 脚本：

```bash
# 从每日日记和每周意图中提取任务
npm run tasks

# 从每日日记生成周回顾 Markdown
npm run weekly-review

# 运行完整的 Wiki 健康审计（断链、薄弱页面、孤儿、陈旧页面）
npm run wiki:health

# 分析实体提及并建议新的 wikilink
npm run wiki:entities

# 为某个主题或聚类生成研究提案
npm run graph:proposal -- --focus <slug>
npm run graph:proposal -- --cluster <id>

# 从自然语言问题生成洞察报告
npm run insight

# 将整个 Wiki 导出为带时间戳的 ZIP
npm run export:wiki

# 重建语义嵌入、UMAP 布局和聚类
npm run build:semantic

# 重新生成 llms.txt 文件
npm run generate:llms-txt
```

## 快速开始

面向 Agent：

```text
Read AGENT_SETUP.md and set up Aperture for my vault.
```

面向人类：

```bash
git clone https://github.com/ZepPellN/Aperture.git
cd Aperture
npm install
cp .env.example .env.local
# 设置 WIKI_ROOT=/absolute/path/to/your/vault
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

## 环境变量

| 变量 | 说明 |
|---|---|
| `WIKI_ROOT` | 仓库目录的绝对路径 |
| `QMD_INDEX` | 语义功能的可选 qmd 索引路径 |

## 构建

```bash
npm run build
```

这会运行完整流水线：语义重建、任务提取、周回顾生成、llms.txt 生成、Next.js 静态导出。

## 致谢

灵感来自 [Andrej Karpathy 的 LLM Knowledge Bases](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)、[Farza 的 Farzapedia](https://gist.github.com/farzaa/c35ac0cfbeb957788650e36aabea836d) 和 [Steph Ango 的 File Over App](https://stephango.com/file-over-app)。

## 许可证

MIT
