# TaskFlow Agent 系统工作流规格

本规格描述产品 **如何运行**：输入路径、状态机、模块与 Skills 调用顺序、Tool Routing、确认门、Mock 执行、Workflow Sync、异常分支及与界面模块的映射。需求见 [PRD.md](./PRD.md)；配套 [skills_design.md](./skills_design.md)、[demo_plan.md](./demo_plan.md)（**User Workspace / Admin Console** 信息架构划分）、[evaluation.md](./evaluation.md)。

---

## 1. 主链路

以下为端到端标准顺序；实现须可逐段对齐评测与埋点。

```text
碎片输入 → 信息识别 → 字段抽取 → Skill 处理 → Tool Routing → 用户确认 → Mock Tool Call → Workflow Sync
```

| 步骤 | 系统含义 | 主要产出 |
|------|----------|----------|
| 碎片输入 | Inbox 接收原文与元数据 | `inbox_batch`、句段锚点 |
| 信息识别 | Recognition：Actionable / Informational；二级 Todo、Project Update 等 | 分类标签、可执行切片引用 |
| 字段抽取 | 将识别结果结构化为候选项字段 | 候选记录草案 |
| Skill 处理 | Task Extraction、Project Update 与 Field Extraction 的顺序化协作 | 完整候选、证据、置信度、路由前字段 |
| Tool Routing | 候选 → 工具名 + 参数载荷 | `tool_call` 草案列表 |
| 用户确认 | Confirmation Gate：编辑 / 拒绝 / 批量确认 | 已锁定执行批次 |
| Mock Tool Call | Mock Executor：本地模拟调用与回执 | 执行状态 + 结构化回执 |
| Workflow Sync | 回执写入任务 / 项目等视图 | Tasks / Projects / P1 Reports、Knowledge |

**命名对齐：** 主线中「**字段抽取**」与「非结构化 → 可执行结构」同指；「**Skill 处理**」指 **Task Extraction → Project Update → Field Extraction** 的顺序化协作，将识别结果落实为可路由的完备候选。二者在工程上可合并为同一处理阶段，但评测与日志须能区分 Recognition 输出、抽取输出与 Routing 输入。

与 [PRD.md](./PRD.md) §5 主链路对应：输入含于「碎片输入」；「执行」由 Mock Tool Call 承担；「工作流更新」即 Workflow Sync。

### 1.1 用户端主流程（User Workspace）

与上表 **同一套系统顺序**，在 **默认用户界面** 上须可走完、可感知：Inbox 输入与提交 → 候选项与证据 / 置信度 → Tool 草案 → Confirmation → Mock 执行态与回执 **摘要** → Tasks / Projects（及 P1）同步结果。不在此路径强制展开全量评测表或 Gold 逐字段 diff（归属 [demo_plan.md](./demo_plan.md) §3）。

### 1.2 运营端监控流（Admin Console）

与同一 pipeline **同源**：按 `execution_batch_id` / 时间维度的 **Run History**；聚合 **Metrics**、**Evaluation Summary**（与 [evaluation.md](./evaluation.md) 同名指标）；**Tool Analytics**（按 `tool_name`、`error_code`、`handling_class`）；**Logs** 与 **Error Review**；**Gold Dataset** 与 `input_snapshot` / Wrong Execution 对照。用于审计、回归与迭代，**不**替代用户在 Confirmation 上的确认动作（见 demo_plan §0.2）。

---

## 2. Skills 顺序化架构

单流水线，无多 Agent 分叉。下列为 **逻辑顺序**；Task Extraction 与 Project Update 均仅在 **Actionable** 路径上触发，可同一解析轮次内对不同切片并行产出多条候选，再统一进入 Field Extraction。

```text
Recognition
  → Task Extraction（当二级含 Todo / 可归并任务）
  → Project Update（当二级含 Project Update / Risk 等）
  → Field Extraction（对每条候选标准化字段）
  → Tool Routing
  → Confirmation
  → Mock Executor
  → Workflow Sync（由 Sync 层消费 Mock 回执，非独立 Skill）
```

| 序号 | Skill | 输入 | 输出 |
|------|-------|------|------|
| 1 | **Recognition** | Inbox 原文、批次 ID | Actionable / Informational；二级类型 |
| 2 | **Task Extraction** | Actionable + Todo 相关切片 | 任务类候选记录 |
| 3 | **Project Update** | Actionable + 项目更新类切片 | 项目更新类候选记录 |
| 4 | **Field Extraction** | 单条候选草案 | 必填 / 可选字段、`missing`、证据、置信度 |
| 5 | **Tool Routing** | 字段完备的候选 | 目标 Tool、`arguments` 草案 |
| 6 | **Confirmation** | 路由结果 + 用户编辑 | 纳入批次的已确认调用集合 |
| 7 | **Mock Executor** | 已确认调用 | 回执、`execution` 终态 |

**说明：** Risk / Blocker 与 Todo 或 Project Update 的归并策略须与 [evaluation.md](./evaluation.md) 及 [skills_design.md](./skills_design.md) 一致。

---

## 3. 状态机

### 3.1 Inbox 批次

| 状态 | 含义 | 典型下一事件 |
|------|------|----------------|
| `draft` | 用户编辑未提交 | `submit` |
| `submitted` | 已提交，待解析 | 进入 Recognition |
| `parsed` | 识别与候选管线完成 | 用户在候选区操作 |
| `failed` | 解析或管线失败 | `retry` 或保留草稿 |

### 3.2 Candidate 候选项

| 状态 | 含义 | 典型下一事件 |
|------|------|----------------|
| `proposed` | 模型 / Skill 产出 | 用户编辑或拒绝 |
| `edited` | 用户改过字段 | 确认或继续编辑 |
| `confirmed` | 已纳入执行批次 | Mock 执行 |
| `rejected` | 用户丢弃 | 无执行 |

### 3.3 Execution 执行实例

| 状态 | 含义 | 典型下一事件 |
|------|------|----------------|
| `pending` | 已确认、尚未调用 Mock | Mock Executor 领取 |
| `running` | Mock 进行中 | 成功或失败 |
| `succeeded` | 回执成功 | Workflow Sync |
| `failed` | Mock 返回失败 | 修正后重新确认或重试 |

### 3.4 Sync 工作流同步

| 状态 | 含义 |
|------|------|
| `synced` | 该执行实例对应视图已全部写入成功 |
| `partial` | 批次内部分实例成功、部分失败 |
| `retryable` | 失败项允许在修正后再次进入 `pending` |

---

## 4. Tool Calling 流程

### 4.1 P0

| Tool | 触发条件 | 参数来源 | 用户确认 | 回执 | Workflow Sync 目标 |
|------|----------|----------|----------|------|---------------------|
| `create_todo` | 候选类型为任务且路由为该工具 | Field Extraction 输出 + Routing 映射 | 须通过 Confirmation；未确认不调用 | 成功 / 失败、摘要、与证据关联 | **Tasks** 列表新增或更新条目 |
| `update_project_board` | 候选为项目更新且路由为该工具 | 同上 | 同上 | 同上 | **Projects** 看板 / 进展视图 |

### 4.2 P1

| Tool | 触发条件 | 参数来源 | 用户确认 | 回执 | Workflow Sync 目标 |
|------|----------|----------|----------|------|---------------------|
| `generate_weekly_report_material` | 用户在 Reports 路径或显式生成；输入为已确认上下文 | 已确认 Tasks / Projects 聚合 | 若与执行批次绑定则同 Confirmation；独立生成流由交互稿定 | 素材块列表 | **Reports** |
| `create_knowledge_card` | 片段与已确认执行项强相关且用户触发 | 选定片段 + 上下文 | 同上 | 卡片载荷 | **Knowledge** |

**共性规则：** 参数须可追溯至来源证据；Mock 阶段不写真实外部 SaaS；回执结构须满足 [skills_design.md](./skills_design.md) 以便替换真实适配器。

---

## 5. 页面与数据映射

| 页面 | 输入来源 | 主要输出 / 状态变化 | Tool 关系 |
|------|----------|---------------------|-----------|
| **Inbox** | 用户粘贴、可选 `source_type` | 批次 `draft` → `submitted` → `parsed` / `failed`；产出候选 | 无直接 Tool；下游决定 Routing |
| **Tasks** | Workflow Sync 消费 `create_todo` 成功回执 | 列表与详情；条目关联证据与执行实例 | 读 P0：`create_todo` |
| **Projects** | Sync 消费 `update_project_board` 成功回执 | 项目 / 看板视图更新 | 读 P0：`update_project_board` |
| **Reports（P1）** | 已确认上下文 + `generate_weekly_report_material` | 报告素材条目 | 读 P1 工具 |
| **Knowledge（P1）** | 强相关片段 + `create_knowledge_card` | 卡片条目 | 读 P1 工具 |

中央区与侧栏职责见 [demo_plan.md](./demo_plan.md) **§3 User Workspace**：候选项、工具草案、确认与执行状态须与上表一致；评测与全量回执审计见 **§4 Admin Console**。

---

## 6. 用户输入路径

1. 用户进入 **Inbox**，输入或粘贴文本，可选来源类型。  
2. **提交** → 批次 `submitted`，触发 Recognition 起整条管线直至候选 `proposed` 或批次 `failed`。  
3. 用户在中央区审阅候选：`edited` / `rejected` / 纳入确认集。  
4. **确认并执行** → 候选 `confirmed`，执行实例 `pending` → `running` → `succeeded` | `failed`。  
5. **Workflow Sync** → Tasks / Projects 等进入 `synced` 或 `partial` / `retryable`。

---

## 7. 异常流

| 异常 | 检测点 | 系统行为 | Inbox / Candidate / Execution / Sync |
|------|--------|----------|----------------------------------------|
| **Parsing failure** | Recognition 或早期管线 | 批次 `failed`；可重试 | Inbox → `failed` |
| **Empty actionable** | Recognition 后无可执行候选 | 提示无可执行项；批次可仍为 `parsed` 或业务标记空结果 | 无进入 Routing |
| **Schema error** | Field Extraction 或 Routing 前校验 | 候选或路由标记错误，不进入确认批次 | Candidate 保持可编辑；阻塞确认 |
| **Routing failure** | Tool Routing | 不产生有效 `tool_call`；不进入执行 | 用户修正字段或类型 |
| **Execution failure** | Mock Executor | 实例 `failed`；回执含原因 | Execution `failed`；Sync `partial` 或单项 `retryable` |
| **Partial sync** | 批次内多实例部分成功 | 成功项写入视图；失败项保留重试入口 | Sync `partial` + `retryable` |

---

## 8. 前端实现与工作流对照

| 须在前端可见的环节（User Workspace 为主） | 工作流锚点 |
|-----------------|------------|
| 粘贴与提交 | Inbox `submitted` → `parsed` |
| 识别与候选项列表 | Recognition + Task / Project + Field |
| 工具草案与参数 | Tool Routing |
| 确认与批量操作 | Confirmation |
| 调用中与回执 | Mock Executor `running` → `succeeded` / `failed` |
| 任务 / 项目视图变化 | Workflow Sync → Tasks / Projects |
| P1 报告与卡片 | P1 Tool + Sync → Reports / Knowledge |

| Admin Console 建议对齐 | 工作流锚点 |
|------------------------|------------|
| Run History / 批次审计 | §3.3 Execution、§3.4 Sync |
| Evaluation / Gold / 错误分拣 | 与 evaluation、tool_schema §2、§12 一致 |

界面布局、验证目标与 [demo_plan.md](./demo_plan.md) 中的完整版 / 精简版分层一致；本文约束 **数据与状态不得与原型验收方案冲突**。

---

## 9. 设计约束

1. **可追溯：** 视图条目可回溯 Inbox 证据与执行回执。  
2. **可评测：** 状态转移与异常类型可对应 evaluation 指标。  
3. **可替换：** Mock Executor 与 Sync 写入层接口保持稳定，便于接入真实 API。  
4. **单批次防重：** 同一已确认执行批次在 `running` 期间禁止重复提交。

---

## 10. 相关文档

| 文档 | 用途 |
|------|------|
| [PRD.md](./PRD.md) | 需求边界与模块验收语言 |
| [skills_design.md](./skills_design.md) | Skill I/O 与 Tool Schema |
| [demo_plan.md](./demo_plan.md) | 原型验证目标、User/Admin 页面映射与 Fixture |
| [evaluation.md](./evaluation.md) | 评测与样本口径 |

