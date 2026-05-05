# TaskFlow Agent 产品需求文档

| 属性 | 内容 |
|------|------|
| 产品名称 | TaskFlow Agent |
| 文档类型 | MVP 阶段产品需求规格 |
| 读者 | 产品、研发、设计及评测协作方 |


**产品定义：** 
- **TaskFlow Agent** = **面向办公场景的碎片信息执行助手**。  
- **核心目标：** 将碎片输入转化为 **任务执行、项目推进与工作流更新**。  
- **产品归类：** **办公执行系统**——以 Tool Calling 与 Workflow 将碎片输入推进为可确认、可追踪的执行结果与状态同步。

---

## 1. 用户问题与解决方案

### 1.1 用户问题

交办信息分散在即时沟通、会议纪要、文档节选等渠道。用户需在多步手工操作中完成：识别可执行项、补齐责任与时间节点、对齐项目上下文、在多工具间重复录入，并单独维护周报与要点。结果是 **执行状态与工作流不同步**、漏项多、推进成本高。

### 1.2 解决方案

TaskFlow Agent 提供 **单流水线 + 模块化 Skills + Tool 层**：**Skill 决策**覆盖识别、抽取与路由；**Tool 执行**在 MVP 阶段为 Mock Tool Call；在 **用户确认** 后完成 **工作流更新 Workflow Sync**，使 Tasks、Projects 以及 P1 的 Reports、Knowledge 与原始依据可对照。

### 1.3 Agent 价值定义

**Agent 价值 = Skill 决策 + Tool 执行 + 用户确认 + 工作推进。**

Tool Calling 是 **核心执行机制**，用于表达与落地办公侧动作，不是辅助说明或纯对话输出。

---

## 2. 用户与场景

### 2.1 目标用户

| 类型 | 说明 | MVP 侧重 |
|------|------|----------|
| 一线知识工作者 | 多来源交办、并行事项多、易遗漏 | 主路径 |
| 项目参与者 | 需将进展与风险对齐到项目视图 | 主路径 |
| 管理 / 协调角色 | 关注可见度 | 非 MVP 独立方案对象 |

### 2.2 典型场景

| 场景 | 输入 | 期望产出 |
|------|------|----------|
| 群聊交办 | 聊天记录粘贴 | Todo 候选项 → `create_todo` → Tasks 更新 |
| 会议纪要 | 纪要正文 | 行动项 + 项目更新 → `create_todo` / `update_project_board` → Tasks / Projects 更新 |
| 文档片段 | 节选 | 优先 Task；Knowledge Card 仅 P1 且与已确认执行项强相关 |

### 2.3 范围外

不覆盖 CRM / ERP、组织级权限与审计、完整企业知识平台、多 Agent 编排、生产环境 API 自动回写、泛办公平台替代。原因：MVP 验证 **最小办公执行闭环**。

---

## 3. 产品目标

1. 从碎片输入稳定产出 **可编辑、可确认** 的结构化候选项，并绑定证据与置信度。  
2. **Tool Routing** 将候选项映射到正确 Tool 与 Schema。  
3. **Confirmation Gate** 之后 **Mock Tool Call** 产生可核对回执，并驱动 **Workflow Sync**。  
4. 相对手工基线，在样本评测与用户操作中验证 **耗时、漏项率、编辑成本** 的改善，口径见 §10。

### 3.1 与用户调研的闭环

假设 H-R1～H-R3、验证状态及「强证据 / 待数据」划分与 [user_research.md](./user_research.md) §9 同步维护。当前需求中 **确认闸门、证据与置信度、Mock 优先** 与访谈结论一致；**周报与知识** 的叙事权重若试用反馈偏弱，则收缩产品表达与资源投入，优先保证 P0 闭环。定量结论以 evaluation 与可用性测试为准；若抽取或路由长期不达标，**收窄 MVP、延后 P1、强化确认前提示与评测**，不新增未经验证的能力面。

### 3.2 双端产品结构（User Workspace / Admin Console）

Web 原型的 **信息架构** 拆为两端（详见 [demo_plan.md](./demo_plan.md) §0～§4）；**不改变** Tool Schema、状态机与评测指标定义，仅划分 **默认用户路径** 与 **治理 / 评测路径**。

| 端 | 职责 | 价值主张 |
|----|------|------------|
| **User Workspace** | Inbox、输入、候选项、证据与候选项级置信度、Confirmation、Tool Routing 草案与回执摘要、Workflow Sync 结果（Tasks / Projects / P1） | **用户价值**：可信执行助手——轻量、工作流清晰、不过度工程化 |
| **Admin Console** | Evaluation Summary、Run History、Metrics、Tool Analytics、Logs、Error Review、Gold Dataset 管理与对照 | **系统治理价值**：AI 治理后台——可评测、可监控、可审计、可优化 |

**边界：** 用户端 **不** 将全局 P/R 大盘、逐字段 Gold diff、全站错误分拣作为默认首屏；运营端 **不** 替代用户完成执行确认或写入决策。评测体系（[evaluation.md](./evaluation.md)）完整保留，**主展示面** 归 Admin；用户端仅消费与决策直接相关的证据与置信信号。

---

## 4. 功能范围与优先级

### 4.1 P0 · 核心执行闭环

| 能力 | 说明 |
|------|------|
| Inbox 输入 | 接收并保留原始碎片文本 |
| Task Extraction | 从碎片中抽取任务候选项 |
| Project Update | 识别项目状态 / 风险 / Blocker 等更新项 |
| Field Extraction | 必填 / 可选字段与 `missing` 策略 |
| Tool Routing | 映射至 P0 Tool |
| Confirmation Gate | 编辑、拒绝、批量确认；未确认不执行 |
| Mock Tool Call | `create_todo`、`update_project_board` |
| Tasks / Projects 更新 | Workflow Sync 核心落点 |

### 4.2 P1 · 体验增强

| 能力 | 说明 |
|------|------|
| Weekly Report | `generate_weekly_report_material` 与 Reports 视图 |
| Knowledge Card | `create_knowledge_card` 与 Knowledge 视图 |
| 导出 | Markdown / JSON 等，格式由工程与 `skills_design` 约定 |

可选：轻量执行建议、评测用标注入口；**不得**阻塞 P0 验收。

### 4.3 P2 · 本阶段不做

| 能力 | 说明 |
|------|------|
| API 集成 | 真实企业系统写接口 |
| 长期记忆 | 跨会话持久化推理上下文 |
| 企业能力 | 组织权限、审计、合规控制台等 |

---

## 5. 核心 Workflow

### 5.1 主链路

```text
碎片输入 → 识别 → 抽取 → 模块化 Skill → Tool 路由与参数 → 确认 → Mock Tool Call 执行 → Workflow Sync 工作流更新
```

阶段对应关系：**信息识别 → 字段抽取 → Tool Routing → 用户确认 → 执行 → 工作流更新**。工程上由 Task Extraction、Project Update、Field Extraction 等 Skills 承载识别与抽取阶段。

### 5.2 终点：工作流更新 Workflow Sync

**职责：**

- Tasks 更新：Todo 执行结果  
- Projects 更新：`update_project_board` 对应的看板与项目视图  
- P1 Reports 补充  
- P1 Knowledge 补充  
- 工作状态追踪：执行回执与证据链可查阅  

**定义：** 执行结果进入工作系统，形成可持续推进的状态同步能力。

### 5.3 设计原则

执行优先；用户可控；Tool Calling 优先；可追溯；可评测；可扩展。扩展不扩大 MVP 承诺范围。

---

## 6. Skills 与 Tool Calling

### 6.1 分工

| 层级 | 职责 |
|------|------|
| 模型 | 语义理解与候选生成 |
| Skills | Task Extraction、Project Update、Field Extraction、Tool Routing、Confirmation、Mock Executor |
| Tool | 标准化执行接口；MVP 为 Mock |
| 用户 | 确认与拒绝 |

### 6.2 Tool 分层

| 级别 | Tool | 用途 |
|------|------|------|
| P0 | `create_todo` | 任务执行写入 Tasks |
| P0 | `update_project_board` | 项目推进与状态同步写入 Projects |
| P1 | `generate_weekly_report_material` | Weekly Report |
| P1 | `create_knowledge_card` | Knowledge Card |

### 6.3 Schema 产品设计约束

每次调用须可核对：**Tool 名称、必填 / 可选参数、source evidence、confidence、execution status、Mock 回执**。契约细节见 [skills_design.md](./skills_design.md)。

---

## 7. 功能需求 · 按模块

以下各节均包含：**用户入口**、**输入**、**核心处理逻辑**、**输出**、**状态**、**边界**、**异常情况**。

### 7.1 Inbox · P0

| 维度 | 说明 |
|------|------|
| 用户入口 | 导航「Inbox」；主区文本输入与提交操作 |
| 输入 | 非空文本；可选 `source_type`，枚举含群聊、纪要、文档 |
| 核心处理逻辑 | 持久化原文与提交时间；生成 `inbox_item_id` |
| 输出 | 可供下游引用的批次上下文与句段锚点 |
| 状态 | `draft` → `submitted` → `parsed` / `failed` |
| 边界 | 单次长度上限由工程定义并在界面提示；超长策略须固定为截断或分块之一并文档化 |
| 异常情况 | 提交失败：保留草稿并提示重试；解析失败见 §8.3 |

### 7.2 识别与分类 · P0

| 维度 | 说明 |
|------|------|
| 用户入口 | Inbox 提交后自动触发；或「重新解析」 |
| 输入 | `inbox_item_id`、原文 |
| 核心处理逻辑 | 一级 Actionable / Informational；二级 Todo、Project Update；Risk / Blocker 归并与 [evaluation.md](./evaluation.md) 一致 |
| 输出 | 分类标签写入批次 |
| 状态 | `parsing` → `parsed` / `failed` |
| 边界 | Informational 不进入 Tool 执行；Knowledge / Report 细分规则为 P1 |
| 异常情况 | 解析失败：`failed`，提供重试入口与错误信息 |

### 7.3 Task Extraction · P0

| 维度 | 说明 |
|------|------|
| 用户入口 | 解析完成后候选项列表中的 Task 类条目 |
| 输入 | 原文、Actionable + Todo 分类结果 |
| 核心处理逻辑 | 生成任务候选项：`title`、`owner`、`due_date`、`priority`、`evidence` 等 |
| 输出 | 结构化候选项，进入 Field Extraction |
| 状态 | 随候选项 `proposed` → `edited` → `confirmed` / `rejected` |
| 边界 | 无证据不捏造执行项 |
| 异常情况 | 模型超时或空结果：批次可标记 `failed` 或 `empty_actionable`，由工程策略二选一固定 |

### 7.4 Project Update · P0

| 维度 | 说明 |
|------|------|
| 用户入口 | 候选项列表中 Project Update 类条目 |
| 输入 | 原文、分类结果 |
| 核心处理逻辑 | 抽取项目状态、风险、延期、Blocker、Follow-up 等 |
| 输出 | 结构化候选项，进入 Field Extraction |
| 状态 | 同候选项状态机 |
| 边界 | 与 Todo 重复内容可合并策略须在 workflow / 评测中固定 |
| 异常情况 | 同 §7.3 |

### 7.5 Field Extraction · P0

| 维度 | 说明 |
|------|------|
| 用户入口 | 候选项行内编辑 |
| 输入 | Task / Project Update 中间结果 |
| 核心处理逻辑 | 输出必填：`title`、`source evidence`、`item_type`、`project`、`confidence`；可选字段不确定则 `missing` |
| 输出 | 通过 Schema 校验的候选项 |
| 状态 | `proposed` / `edited` |
| 边界 | 禁止为补齐界面而猜测可选字段；`project` = 用户预选 + 系统推荐 |
| 异常情况 | Schema 校验失败：`route_error` 类标记，禁止进入执行批次直至修复 |

### 7.6 Tool Routing · P0

| 维度 | 说明 |
|------|------|
| 用户入口 | 侧栏或候选项关联区「Tool 草案」 |
| 输入 | 候选项终值 |
| 核心处理逻辑 | 映射 `tool_name` 与 `arguments`；P0 为 `create_todo`、`update_project_board` |
| 输出 | 与候选项 `id` 绑定的调用草案 |
| 状态 | `routed` / `route_error` |
| 边界 | P1 Tool 不得阻塞 P0 发布 |
| 异常情况 | 路由错误：阻止纳入执行批次 |

### 7.7 Confirmation Gate · P0

| 维度 | 说明 |
|------|------|
| 用户入口 | 侧栏或底部「确认并执行」 |
| 输入 | 用户勾选集、字段终值 |
| 核心处理逻辑 | 校验必填；通过后生成 `execution_batch_id` |
| 输出 | `confirmed` 批次 |
| 状态 | `pending_confirmation` → `confirmed` → `executing` → `executed` / `execution_failed` |
| 边界 | 未确认不得调用 Mock Executor |
| 异常情况 | 校验失败：提示缺失项，保持 `pending_confirmation` |

### 7.8 Mock Tool Call · P0

| 维度 | 说明 |
|------|------|
| 用户入口 | 确认通过后自动触发或显式「执行」，全局仅允许一种模式，由交互稿锁定 |
| 输入 | 已确认 `tool_name`、`arguments` |
| 核心处理逻辑 | 本地 Mock：写调用日志、返回结构化回执 |
| 输出 | `execution_status`、`receipt`、时间戳 |
| 状态 | `queued` → `running` → `succeeded` / `failed` |
| 边界 | 界面与文案不得暗示已连接外部生产系统 |
| 异常情况 | 执行失败：条目 `execution_failed`，保留参数与日志；允许修正后重新确认并执行，防重复写入策略由工程定义 |

### 7.9 Workflow Sync：Tasks / Projects · P0

| 维度 | 说明 |
|------|------|
| 用户入口 | 导航「Tasks」「Projects」 |
| 输入 | Mock 成功回执、候选项终值 |
| 核心处理逻辑 | 将 Todo 与 Project Board 更新写入对应视图；保留证据与 `execution_batch_id` 关联 |
| 输出 | 可筛选列表与详情：字段、证据、调用摘要 |
| 状态 | 条目默认 `active`；删除策略为不做或软删，由变更单固定 |
| 边界 | 仅反映已确认且执行成功的结果 |
| 异常情况 | 部分成功：列表反映成功子集，失败项保留可重试状态 |

### 7.10 Weekly Report · P1

| 维度 | 说明 |
|------|------|
| 用户入口 | 导航「Reports」；或从已确认上下文触发生成 |
| 输入 | 已确认 Tasks / Projects 上下文 |
| 核心处理逻辑 | 调用 `generate_weekly_report_material` |
| 输出 | 报告素材条目 |
| 状态 | 独立于 P0 执行状态 |
| 边界 | 不与 Todo / Project Update 平权；不得反向驱动未确认草稿执行 |
| 异常情况 | 生成失败：提示错误，不写入 Tasks / Projects |

### 7.11 Knowledge Card · P1

| 维度 | 说明 |
|------|------|
| 用户入口 | 导航「Knowledge」 |
| 输入 | 与已确认执行项强相关的片段 |
| 核心处理逻辑 | 调用 `create_knowledge_card` |
| 输出 | 卡片条目 |
| 状态 | 与 §7.10 相同 |
| 边界 | 不建设企业级知识平台；仅轻量补充 |
| 异常情况 | 与 §7.10 相同 |

### 7.12 导出 · P1

| 维度 | 说明 |
|------|------|
| 用户入口 | Tasks / Projects / Reports / Knowledge 模块级操作 |
| 输入 | 选中项或当前筛选结果 |
| 核心处理逻辑 | 生成 Markdown 或 JSON |
| 输出 | 下载或剪贴板 |
| 状态 | 不阻塞主链路 |
| 边界 | 导出内容须与界面字段一致，不含未确认草稿 |
| 异常情况 | 导出失败：提示重试 |

---

## 8. 信息架构与交互状态

### 8.1 布局

- **User Workspace：** 左侧导航 Inbox、Tasks、Projects、P1 Reports、P1 Knowledge；中央区 Inbox 输入与候选项列表，其余模块为列表 + 详情；右侧或底部为 Tool 草案、确认与执行、调用状态（摘要级即可）。**不**将 Evaluation、Run History、全量日志等列为与用户任务同级的默认主导航。  
- **Admin Console：** 独立入口或受限子域，承载评测摘要、批次历史、指标、Tool 分析、日志与 Gold 管理；与 [demo_plan.md](./demo_plan.md) §4 一致。

以设计稿为准；须与 §7 模块一一对应；双端归属以 demo_plan 为准。

### 8.2 确认与执行交互

- 批量确认须列出：将执行的 Tool 列表、关键参数、证据摘要。  
- 执行中防止对同一 `execution_batch_id` 重复提交。

### 8.3 异常汇总

| 情况 | 行为 |
|------|------|
| 解析失败 | Inbox `failed`；重试入口与错误信息 |
| 路由 / Schema 错误 | `route_error`；不进入执行批次 |
| Mock 失败 | `execution_failed`；日志保留 |
| 无可执行项 | 提示并结束本批次 |

---

## 9. 里程碑

范围与 P0 / P1 / P2 划分见 §4。

| 里程碑 | 交付 |
|--------|------|
| M1 | PRD、[workflow.md](./workflow.md)、Tool Schema、[skills_design.md](./skills_design.md) 与 P0 主链路冻结 |
| M2 | MVP 可运行版本，跑通 P0 Workflow 至 Workflow Sync |
| M3 | 固定样本集评测迭代；P1 按资源排期 |

---

## 10. 数据与评估

指标与 [evaluation.md](./evaluation.md) 对齐，分三类：**结果质量**，含 Tool Routing Accuracy、Project Update Accuracy 等；**用户操作**，含采纳率、编辑率、耗时；**风险与控制**，含误执行率、证据覆盖率、低置信字段修正率。

若评测说明与 PRD 冲突，以 PRD §4 范围与优先级为准修订评测文档。

---

## 11. 风险与依赖

| 风险 | 缓解 |
|------|------|
| 幻觉填充字段 | evidence、confidence、`missing` 策略 |
| 产品被理解为长文阅读辅助 | 默认视图以候选项与 Tool 链为主 |
| 范围蔓延 | 变更同步 §4、§9 与 evaluation |

**依赖：** [workflow.md](./workflow.md)、[skills_design.md](./skills_design.md)、[demo_plan.md](./demo_plan.md)、[user_research.md](./user_research.md)、[evaluation.md](./evaluation.md)。

---

## 12. 附录 · 文档索引

| 文档 | 路径 |
|------|------|
| 工作流与数据结构 | [workflow.md](./workflow.md) |
| Skills 与 Tool 契约 | [skills_design.md](./skills_design.md) |
| 界面与流程规格（User / Admin 双端） | [demo_plan.md](./demo_plan.md) |
| 评测口径 | [evaluation.md](./evaluation.md) |
| 用户研究 | [user_research.md](./user_research.md) |

