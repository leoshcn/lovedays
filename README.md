# LoveDays

类「倒数日」的网页版 App：记录纪念日、倒计时与正数日，并支持 AI Agent 协同和对外 API 服务。

## 核心能力（规划）

- **倒数日 / 纪念日**：创建事件，按目标日期显示倒数或已过天数；支持重复（每年/每月/每周）、农历、分类、置顶、提醒。
- **Web App**：响应式网页，桌面与移动端可用。
- **AI Agent 协同**：Agent 可通过 API / MCP 读取、创建、更新事件，例如用自然语言添加纪念日、生成提醒与总结。
- **开放 API**：基于 API Key 的 REST API（OpenAPI 文档），供第三方集成。

## 开发流程

本项目使用 [Trellis](https://github.com/mindfold-ai/Trellis) 管理 AI 协作开发：

- `.trellis/spec/` — 项目编码规范（供 AI 子 Agent 自动加载）
- `.trellis/tasks/` — 任务与 PRD
- `.trellis/d/project/lovedays/` — 开发者会话记录
- `AGENTS.md` / `.claude/` — AI 工具配置

技术栈待定，确定后补充到本文件与 `.trellis/spec/`。
