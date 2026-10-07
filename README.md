# dailen-portfolio

个人展示网站 —— 一个可探索的互动 3D 作品展馆，用于自我介绍、实习与求职，最终部署到 [dailen.top](https://dailen.top)。

## 项目用途

- 自我介绍（关于我）、项目作品展示、经历与实验、联系方式。
- 网站本身作为体现开发能力的作品，视觉目标为酷炫、精细、有探索感。

## 技术方向

- React + TypeScript + Vite
- Three.js / React Three Fiber + drei
- GSAP（镜头与交互动画）
- npm 管理依赖

第一版按静态前端设计，项目内容集中在 `src/content/`，方便后续增加作品。

## 当前状态

已实现「展馆交互初版」（用于验证镜头与交互，非最终视觉设计）：

- 入口页显示 Dailen、个人定位（待填写）与「进入展馆」按钮。
- 简单几何搭建入口、短走廊、标注「作品」的门，统一深色配色。
- 点击进入展馆，镜头平滑移动到门前。
- 点击门，门绕侧边铰链打开，镜头平滑进入作品区。
- 作品区显示「双语电子书生成系统」项目面板。
- 支持返回入口，可反复进入、退出。
- 保留「简洁模式」与直接查看作品的 HTML 入口，WebGL 不可用时自动降级为 HTML 内容。
- 尊重 `prefers-reduced-motion`，减少或跳过大幅镜头动画。

## 开发

依赖环境要求：Node `^20.19.0 || >=22.12.0`（用于 Vite 7）。

```bash
npm install
npm run dev        # 本地开发
npm run build      # 类型检查 + 生产构建
npm run preview    # 本地预览生产构建
npm run lint       # ESLint 检查
```

## 目录结构

```
src/
  content/        # 个人与项目内容配置（类型 + 数据）
  experience/     # R3F 场景、镜头、门、纹理
  state/          # 展馆交互状态机
  ui/             # 覆盖层、项目面板、降级内容
```

## 参考

- 站点：<https://itomdev.com/>
- 实现文章：<https://tympanus.net/codrops/2026/06/11/sketching-the-impossible-a-3d-portfolio-built-without-a-single-3d-model/>
- 源码：<https://github.com/ITomPoland/portfolio-itom>（代码 MIT，个人资产版权归原作者，未经许可不得复用）

## 文档

- [docs/project-brief.md](docs/project-brief.md) —— 目标、内容结构、参考方式、第一阶段范围。
- [docs/development-plan.md](docs/development-plan.md) —— 分阶段任务与验收标准。
