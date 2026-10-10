# ChatBlog

ChatBlog 是 ChatArch 的公开知识与技术博客站点。

这个站点默认使用中文内容，后续可以再补英文或其他语言版本。

## 内容结构

- `blog/`：按时间组织的技术博客、阶段总结和项目文章。
- `docs/blocks/`：可复用的公开知识块，比 Skill 更轻，更适合阅读和引用。
- `src/`：站点页面和样式。
- `static/`：静态资源。
- `service/`：独立的 ChatLogin 编辑服务、审查状态持久化与发布同步工具；服务运行数据不在公开仓库。

`keep` 是经过精选的正式内容；`candidate` 是发布后仍待人工精选的公开候选；`slop` 是旧文负面归档。候选与负面归档不可互换。阅读页仍由 GitHub Pages 提供，后端点击保存仅改变编辑状态；正式列表、标签、订阅和索引在下一次源文件同步及 Pages 部署后更新。

## 本地启动

```bash
npm install
npm run start
```

## 构建静态站点

```bash
npm run build
```

## 部署

ChatBlog 使用 ChatArch 共享 GitHub Pages 域名：

```text
https://arch.gh.wzhecnu.cn/ChatBlog/
```

部署规则：

- PR：`Preview Docs` 会用 `/ChatBlog/dev/` 作为 `baseUrl` 构建，并发布到 `gh-pages` 分支的 `dev/` 目录。
- 合并到 `main` / `master`：`Deploy Docs` 会用 `/ChatBlog/` 作为 `baseUrl` 构建，并发布到 `gh-pages` 分支根目录。
- GitHub Pages source 应保持为 `gh-pages` 分支 `/` 路径。
- 导航里的“登录”入口始终可见，进入 `/login` 查看接入状态。未配置 `CHATBLOG_EDITOR_ORIGIN` 时说明账号登录尚未接通，不显示假密码表单；配置真实入口后转到独立编辑服务的 ChatLogin 页面。只有选定并验证实际 HTTPS 后端后，才在构建时设置它。管理员配置、源清单导出与人工同步 PR 见 [`service/README.md`](service/README.md)。
- 规范 URL 使用大写仓库名路径 `/ChatBlog/`；小写 `/chatblog/` 需要由组织主页仓库提供跳转别名。

## 如何写内容

长文章放在 `blog/`，可复用知识块放在 `docs/blocks/`。

博客文章需要包含 front matter：

```md
---
title: 示例标题
date: 2026-06-29
tags: [chatblog, public]
description: 一句话摘要。
---
```

公开内容必须先经过整理，不要直接发布原始聊天记录，也不要包含密钥、私有项目状态、内部进度或其他不适合公开的信息。
