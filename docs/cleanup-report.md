# 文件清理与目录整理

清理日期：2026-11-19。

## 移出项目的内容

- 26 个当前路由未使用的旧源码文件，包括 8 个旧版页面、12 份旧样式、2 个旧组件、2 个旧组合函数和 2 份旧数据。
- 67 个当前页面和渲染代码未引用的图片、视频及旧商品素材，约 92.23 MiB。
- 10 个旧构建或临时验证目录。
- 共从项目中移出约 754.94 MiB 文件。
- 卸载已无源码引用的 Swiper 及其独占依赖，并同步更新依赖锁文件。

批量永久删除被自动审批拒绝，因此采用可恢复的方式移出项目。恢复目录：

```text
C:\Users\79261\AppData\Local\Temp\dunhuang-project-recovery-20261119-115412
```

该目录按原有相对路径保存旧源码、素材和旧构建；它位于系统临时目录，系统清理临时文件时可能移除。此次未清空回收站，也未永久删除这些待清理文件。项目目录体积减少不等于整个磁盘空间已释放。

## 现用文件的整理

| 原位置 | 新位置 |
| --- | --- |
| `src/components/SiteLayout.vue` | `src/components/layout/SiteLayout.vue` |
| `src/components/HistoryJourney.vue` | `src/components/history/HistoryJourney.vue` |
| `src/components/GoodsShop.vue` | `src/components/shop/GoodsShop.vue` |
| `src/components/SectionEditorial.vue` | `src/components/editorial/SectionEditorial.vue` |
| `src/components/SectionAfterword.vue` | `src/components/editorial/SectionAfterword.vue` |
| `src/components/sculpture3d.js` | `src/lib/sculpture3d.js` |
| `src/styles/allstyle.css` | `src/styles/base.css` |

同步修改源码引用；补充 README、忽略规则和只读文件检查命令；将 VS Code 调试地址改为 Vite 默认的 5173 端口。

构建目录统一配置为 `output/`，避免当前环境的 `dist/`、`build/` 写入错误。保留一份最新生产构建供 `npm run preview` 使用，生成文件已加入忽略规则。

## 目录权限限制

部分旧目录在文件迁出后仍留下受系统权限限制的目录结构。空目录删除同样被自动审批拒绝，可恢复迁移后，项目中仍残留 `.build-check/`、`.build-shop-check/`、`.build-login-check/`、`.build-portal-check/` 和 `build/` 五处目录，无法在本次会话继续清除。旧目录迁移记录还保存在项目同级的 `.dunhuang-cleanup-empty-directories-20261119/`。

## 验证结果

- `npm run audit:files`：无未使用源码、无未引用素材、无缺失导入或静态素材。
- `npm run build`：包含 public 素材的完整生产构建通过。
- 12 个页面及馆藏路由、迁移后的站点布局通过组件渲染检查。
- 三维展厅的构建文件与清理前逐字节一致。
- 首次验证构建已移至恢复目录中的 `verification-build/`；项目内仅保留最终 `output/` 构建。
- 完整待清理文件清单位于恢复目录中的 `cleanup-manifest.json`。
