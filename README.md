# 寻梦敦煌

基于 Vue 3、Vue Router、Vite 和 Three.js 的敦煌文化主题课程项目。

## 本地运行

需要 Node.js 18 或以上版本。

```sh
npm install
npm run dev
```

打开终端中显示的本地地址，默认是 `http://localhost:5173`。

```sh
npm run build       # 生成 release/，包含完整的静态素材
npm run preview     # 预览构建结果
npm run audit:files # 只读检查源码引用、未使用素材和缺失文件
```

`/app` 提供移动端 App 风格界面，`/admin` 提供商品、订单和资讯管理演示。后台直接使用当前浏览器的本地数据，没有连接服务端 API 或数据库。

构建输出统一使用 `release/`。

## 目录结构

```text
src/
  views/                   首页、栏目页、移动 App、管理后台、登录页与三维展馆
  components/
    layout/                全站导航与页脚
    history/               历史时间线
    shop/                  购物车与模拟订单
    editorial/             栏目导览、问答与延伸阅读
  composables/             用户状态与登录逻辑
  data/                    栏目、历史、文创与馆藏数据
  lib/                     全景渲染、三维展厅、模型和粒子动效
  styles/                  全局样式与页面样式
  assets/                  由 Vite 处理的首页飞天图片
  router/                  路由配置
public/images/
  editorial/               栏目配图及 sources.json 来源记录
  products/                当前文创商品图片
scripts/
  audit-project.mjs        只读文件引用检查
  download-media.py        栏目配图维护脚本
docs/
  cleanup-report.md        本次清理与迁移记录
```

`src/data/pages.js` 维护全站导航栏目；栏目主内容位于 `src/data/explore.js`，导览和问答位于 `src/data/sectionEditorials.js`。商品演示价格和库存位于 `src/data/shop.js`。

## 功能说明

- 首页提供飞天动效与洞窟全景，数字展馆支持三维漫游。
- 文创结算与体验报名为课程模拟，不涉及真实支付、配送或预约。
- 购物车、模拟订单、路线收藏、行前清单、后台商品与资讯和演示登录信息保存在当前浏览器，不跨设备同步。
- 后台管理为前端演示界面，项目没有连接 API 或服务器数据库。清除浏览器数据后，后台修改不会保留。
- 图片来源见 `public/images/editorial/sources.json`。配图的用途和原文出处以页面说明为准。

`download-media.py` 仅在需要重新获取栏目素材时手动运行，需另行安装 Python 的 Pillow；日常开发与构建不依赖 Python。

## 文件维护

`node_modules/` 是本机运行依赖，`package-lock.json` 用于锁定版本。构建目录和依赖目录已加入 `.gitignore`。

文件检查会从 `src/main.js` 追踪静态与动态导入，也会检查数据中拼接使用的图片文件名。检查脚本只输出报告，不自动删除文件；新增动态命名规则时仍需人工核对。
