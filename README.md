# TaskFlow Agent

## 产品定位

面向办公碎片信息执行转化的 **Execution Agent（执行型 AI Agent）**：将即时沟通、会议与文档中的非结构化输入，转化为 **可确认、可路由、可同步至工作流载体** 的结构化执行项。

**边界：** 不是通用任务管理平台本体，不是聊天机器人；TaskFlow 负责理解与编排执行，工作流资产落在约定的外部视图或由适配器写入的后端系统。

## 核心问题

**碎片信息 → 可执行状态** 的转化效率低：多通道交办、手工抄写、工具间重复录入导致漏项、状态不同步与推进成本高。

## 核心能力

- **输入理解**：识别可执行切片与噪声，绑定证据与锚点  
- **候选生成**：产出任务类、项目更新类等规范化候选项及置信度  
- **Confirmation Gate**：用户确认前不进入执行；批次与参数可编辑、可丢弃  
- **Tool Routing**：候选项映射至约定 Tool 与参数形态  
- **Mock Execution**：MVP 阶段以统一回执契约模拟执行，便于评测与联调  
- **Cross-platform Sync**：成功回执驱动 Tasks / Projects 等视图更新；P1 延伸至 Reports、Knowledge  

## 产品结构

| 端 | 产品名称 | 职责 |
|----|----------|------|
| **用户端** | User Workspace | 收件箱、解析与候选项、确认与执行链摘要、同步结果 |
| **运营端** | Admin Console | 评测总览、运行历史、执行日志、工具分析、错误复盘、系统配置 |

## 系统范围

- **用户工作流**：从输入到确认、Mock 执行与工作流同步的闭环  
- **运营监控**：批次、日志、指标聚合与异常分类  
- **评测治理**：Gold 对照、路由与执行质量指标、版本对比口径  

## 文档索引

详细规格见 [`docs/`](docs/) 目录下各文档。

| 文档 | 路径 |
|------|------|
| 用户调研 | [docs/user_research.md](docs/user_research.md) |
| 产品需求 | [docs/PRD.md](docs/PRD.md) |
| 系统工作流 | [docs/workflow.md](docs/workflow.md) |
| Skills 设计 | [docs/skills_design.md](docs/skills_design.md) |
| Tool 契约 | [docs/tool_schema.md](docs/tool_schema.md) |
| 评测体系 | [docs/evaluation.md](docs/evaluation.md) |
| 原型验收 | [docs/demo_plan.md](docs/demo_plan.md) |

## 前端原型

Web 原型位于 [`demo/`](demo/)，本地开发：

```bash
cd demo && npm install && npm run dev
```

构建：`npm run build`。

## 路线图

- **Tool 扩展**：在稳定 Schema 下增加工具类型与校验策略  
- **平台接入**：Mock Executor 替换为经评测对齐的生产适配器  
- **能力迭代**：P1 Reports / Knowledge、导出与观测性深化  
