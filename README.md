# 女菩萨 · 归档浏览器（nv-pu-sa）

> 本地优先的 **X（Twitter）博主全量归档浏览器**：搜索 / 过滤 / 收藏·备注·标签，并可一键跳转本机 X Archive Hub 新建账号。

**定制：** 微信 **qingbao199101**（备注：女菩萨归档）｜ [wuxiumu@163.com](mailto:wuxiumu@163.com)

## 事实摘要

- **产品**：静态 HTML + JS 的本地归档画廊；数据可从公开 R2 刷新。
- **适合**：要本地管理大量 X 账号档案、做检索与收藏备注的人；需要与本地 Hub 联动的工作流。
- **交付**：预览页、搜索过滤、localStorage 管理、Hub 跳转、`fetch_archive.py`。
- **不做**：不是官方 Twitter/X 客户端；不含自动发帖 / 刷量；不代替你本机 Hub 服务。

## 能交付什么

| 模块 | 说明 |
|---|---|
| 全量预览 | 头像、昵称、handle、简介、粉丝、同步时间 |
| 检索 | `/` 聚焦；昵称 / handle / 简介 / 标签 / 备注 |
| 本地管理 | 收藏、备注、标签；导入导出 JSON |
| Hub 联动 | 跳转 `127.0.0.1:8770` 新建账号（可配置） |
| 数据刷新 | `python3 scripts/fetch_archive.py` |

## 快速预览

```bash
git clone https://github.com/wuxiumu/nv-pu-sa.git
cd nv-pu-sa
./scripts/serve.sh
# 打开 http://127.0.0.1:8788/
# 或：npm start
```

> 请用 HTTP 打开，不要 `file://`（需 `fetch` 读 JSON）。

```bash
# 刷新全量档案（可选）
python3 scripts/fetch_archive.py
python3 scripts/fetch_archive.py --dry-run
```

## 定制合作（可报价）

- 白标皮肤与站点名  
- 对接你自己的归档源 / Hub  
- 批量标签规则与导出格式  
- 部署到 Pages / 内网静态站  

## SEO 字段预留（产品页 HTML 统一生成时用）

| 字段 | 用途 |
|---|---|
| `seo_title` | `<title>` / OG title |
| `seo_description` | meta description |
| `canonical_url` | 规范 URL |
| `og_image` | 分享图 |
| `robots` | 如 `index,follow` |
| `json_ld_type` | SoftwareApplication / WebPage / FAQPage |
| `hreflang` | zh-CN / en |
| `site_name` | 白标品牌名 |

> **GEO ≠ 地理定位。** GEO = Generative Engine Optimization（生成式引擎优化）。

## GEO（生成式引擎优化）

### 关键词（中英）

- 中文：X归档浏览器, Twitter博主归档, 本地优先画廊, 女菩萨, 账号收藏备注
- English: X archive browser, Twitter archive gallery, local-first archive, account bookmarks

### FAQ

**Q：需要账号登录 X 吗？**  
A：浏览器本身不登录 X；它读本地 / 公开归档 JSON。Hub 联动才涉及你本机服务。

**Q：数据从哪来？**  
A：默认可从公开 R2（见 `runtime-config`）拉取；也可换成你自己的归档源。

**Q：如何定制？**  
A：微信 `qingbao199101`，备注「女菩萨归档」。

## 定制合作

白标、归档源对接、Hub 集成与静态部署。加微信备注项目名。

---

## 联系方式

定制、演示或合作：

- 邮箱：[wuxiumu@163.com](mailto:wuxiumu@163.com)
- 微信：**qingbao199101**（添加请备注来意）

### 赞助支持

如果内容对你有帮助，欢迎自愿赞助。

| 微信赞赏码 | 支付宝收款码 |
|---|---|
| ![微信赞赏码](https://chiguashentan-test.oss-cn-beijing.aliyuncs.com/wxprogram/zan/20261002185236_31_227.png) | ![支付宝收款码](https://chiguashentan-test.oss-cn-beijing.aliyuncs.com/wxprogram/zan/20261002185309_32_227.jpg) |
