# ChatBlog

ChatBlog 是 ChatArch 的公开知识与技术博客站点。

这个站点默认使用中文内容，后续可以再补英文或其他语言版本。

## 内容结构

- `blog/`：按时间组织的技术博客、阶段总结和项目文章。
- `docs/blocks/`：可复用的公开知识块，比 Skill 更轻，更适合阅读和引用。
- `src/`：站点页面和样式。
- `static/`：静态资源。

## 本地启动

```bash
npm install
npm run start
```

## 构建静态站点

```bash
npm run build
```

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
