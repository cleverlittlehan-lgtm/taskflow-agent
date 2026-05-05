# TaskFlow Agent Tool Schema 与执行契约

本规范规定 **Tool Calling 执行契约**：参数、校验、Mock 回执、Workflow Sync 挂载点及评测映射。
---

## 1. 契约链路

Skills 与执行层之间的数据形态须严格按序传递：

```text
normalized_candidate → route_result → confirmed_tool_call → execution_receipt → Workflow Sync
```

| 形态 | 说明 |
|------|------|
| `normalized_candidate` | Field Extraction 输出；含类型、字段闭包、`source_evidence`、confidence、`risk_*`（若有） |
| `route_result` | Tool Routing 输出；`tool_name`、`arguments`（符合本规范 Schema 草案）、`validation_status` |
| `confirmed_tool_call` | Confirmation 输出子项；在 `arguments` 上叠加 **`execution_batch_id`** 与最终快照，**不得** 再经模型改写意图 |
| `execution_receipt` | Mock Executor（或未来 Adapter）输出；**统一外壳**见 §4 |
| **Workflow Sync** | 消费 `execution_receipt` 中 `status=succeeded` 的条目，写入 §3 所列视图 |

---

## 2. Gold 定义与 Wrong Execution Rate

**Gold（主标准）** = 评测集上针对该次调用的人工标注 **Gold Arguments Snapshot**：在约定字段集合内、与本规范 Schema 一致的 **理想 `arguments` 对象**（含嵌套的 `source_evidence`）。

**Wrong Execution Rate：** 用 `confirmed_tool_call.arguments` 或成功回执的 `input_snapshot` 与 Gold Arguments Snapshot **逐字段**比对；容忍规则由 [evaluation.md](./evaluation.md) 定。逐字段 diff 与 Gold 台盘的 **主展示面** 归 **Admin Console**（[demo_plan.md](./demo_plan.md) §4）；用户端可作体验级提示，**不替代** Gold。Routing Accuracy 另计：选对 `tool_name` 且与 Gold 路由一致。

---

## 3. Tool 清单与 Sync 视图

| 优先级 | `tool_name` | Sync 主目标 |
|--------|-------------|-------------|
| P0 | `create_todo` | **Tasks** |
| P0 | `update_project_board` | **Projects** |
| P1 | `generate_weekly_report_material` | **Reports** |
| P1 | `create_knowledge_card` | **Knowledge** |

---

## 4. 统一回执结构 `execution_receipt`

所有 Tool 的 Mock / 真实适配器返回 **同一外壳**；业务增量放在 `result`。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `receipt_id` | string | 是 | 全局唯一 |
| `tool_name` | string | 是 | 与请求一致 |
| `status` | enum | 是 | `succeeded` \| `failed` |
| `execution_batch_id` | string | 是 | 与确认批次一致 |
| `input_snapshot` | object | 是 | 执行瞬间参数深拷贝，用于审计与评测对齐 |
| `sync_target` | enum | 是 | `tasks` \| `projects` \| `reports` \| `knowledge` \| `none` |
| `created_at` | string | 是 | ISO 8601 |
| `error_code` | string | 失败时 | 封闭错误码，见各 Tool § Failure |
| `error_message` | string | 失败时 | 人类可读短句 |
| `handling_class` | string | 失败时 | 行为语义分类，封闭集见 §12；与 `error_code` 映射固定 |
| `result` | object | 成功时建议 | Tool 专属摘要，供 Sync 与 UI |

**失败时：** `status=failed`，`sync_target` 一般为 `none`（或保持目标视图但不写入，由实现二选一并在评测中固定）；须同时返回 `error_code`、`error_message`、`handling_class`。

---

## 5. 全局校验与类型约定

### 5.1 `source_evidence` 与 `anchor` 格式

| 字段 | 规则 |
|------|------|
| `text` | 非空摘录字符串 |
| `anchor` | **正式格式：** `inbox:{batch_id}#s{slice_index}` |

- **`batch_id`**：Inbox 批次 ID，与 Inbox 存储一致，不含字符 `:`、`#`。  
- **`slice_index`**：非负整数，与 Recognition 的 Actionable Slice 序号一致，从 0 递增。  
- 非法 `anchor` → Routing `validation_status=invalid`。

**P0 Tool 调用** 中 `source_evidence` 必填且 `anchor` 必须符合上述格式。

### 5.2 通用字段

| 约定 | 规则 |
|------|------|
| `confidence` | number，闭区间 \[0, 1\]；**P0 必填** |
| `execution_batch_id` | string；仅 **Confirmation 之后** 写入 `arguments`；Routing 输出草案中可为 `""`，**Mock 前必须非空** |
| `created_from` | enum：`task_candidate` \| `project_update_candidate` |
| `risk_severity` | enum：`low` \| `medium` \| `high` \| `null` |
| **Risk 校验（唯一策略）** | 当 **`risk_flag=true`** 时，**`risk_severity` 必填**。缺失则 **仅在 Tool Routing 阶段** 置 `validation_status=invalid`，**不得** 延后到 Confirmation 或 Adapter 再判定。 |
| 其他必填缺失 | Routing：`validation_status=invalid`；已确认后 Mock 前复检失败 → **失败回执**，不写入 Sync |
| 绕过 Confirmation | **禁止**：Mock 层须校验 `execution_batch_id` 与批次令牌 |

**Risk：** 默认路由 `update_project_board`；`risk_flag=true` 时 Projects 侧高亮；`risk_highlight` 用于确认前与看板；高风险须有效 `execution_batch_id`，与 skills_design 一致。

---

# P0 Tools

---

## 6. `create_todo`

### 1. Tool Purpose

将 **已确认的任务候选项** 落实为 **Tasks** 视图中的一条可追踪待办。

### 2. Trigger Condition

- `normalized_candidate.candidate_type = task`（或等价类型标签，与 skills 封闭表一致）  
- `route_result.validation_status = ok` 且 `tool_name = create_todo`  
- 用户 **Confirmation** 将该条纳入批次且 Mock 前复检通过  

### 3. Required Fields

| 字段 | 类型 | 说明 |
|------|------|------|
| `title` | string | 非空 |
| `source_evidence` | object | 见 §5 |
| `confidence` | number | 见 §5 |
| `created_from` | enum | 固定 `task_candidate` |
| `execution_batch_id` | string | 确认后注入 |

### 4. Optional Fields

| 字段 | 类型 | 说明 |
|------|------|------|
| `owner` | string \| null | 未知则省略或 `null` |
| `due_date` | string \| null | ISO 日期或产品约定格式 |
| `priority` | string \| null | 封闭枚举，如 `low` \| `medium` \| `high` |
| `project` | string \| null | 项目名或 ID |
| `notes` | string \| null | 短备注 |

### 5. Validation Rules

- `title` 去空白后长度 ≥ 1  
- `source_evidence.text` 非空  
- `confidence` ∈ \[0, 1\]  
- `execution_batch_id` 非空且已注册于批次存储  
- **不得** 包含权限、组织、外部 SaaS id（MVP）

### 6. Mock Request Example

下列 `arguments` 与 §10 端到端示例中 **`confirmed_tool_call.arguments`** 一致。

```json
{
  "tool_name": "create_todo",
  "arguments": {
    "title": "补齐活动页文案",
    "source_evidence": {
      "text": "@小王 周五前给一版",
      "anchor": "inbox:inb_demo_001#s3"
    },
    "confidence": 0.82,
    "created_from": "task_candidate",
    "execution_batch_id": "eb_demo_001",
    "owner": "小王",
    "due_date": "2026-05-09",
    "priority": "high",
    "project": "增长活动",
    "notes": null
  }
}
```

### 7. Mock Success Response

`input_snapshot` 与请求 `arguments` **逐字段深拷贝一致**。

```json
{
  "receipt_id": "rcpt_demo_todo_001",
  "tool_name": "create_todo",
  "status": "succeeded",
  "execution_batch_id": "eb_demo_001",
  "input_snapshot": {
    "title": "补齐活动页文案",
    "source_evidence": {
      "text": "@小王 周五前给一版",
      "anchor": "inbox:inb_demo_001#s3"
    },
    "confidence": 0.82,
    "created_from": "task_candidate",
    "execution_batch_id": "eb_demo_001",
    "owner": "小王",
    "due_date": "2026-05-09",
    "priority": "high",
    "project": "增长活动",
    "notes": null
  },
  "sync_target": "tasks",
  "created_at": "2026-05-04T12:00:00Z",
  "result": {
    "task_id": "task_mock_001",
    "title": "补齐活动页文案",
    "project": "增长活动"
  }
}
```

### 8. Mock Failure Response

失败时 `input_snapshot` 仍须为 **当次提交参数字典**（与成功回执规则相同）；本例模拟批次未注册。

```json
{
  "receipt_id": "rcpt_demo_fail_001",
  "tool_name": "create_todo",
  "status": "failed",
  "execution_batch_id": "eb_demo_001",
  "input_snapshot": {
    "title": "补齐活动页文案",
    "source_evidence": {
      "text": "@小王 周五前给一版",
      "anchor": "inbox:inb_demo_001#s3"
    },
    "confidence": 0.82,
    "created_from": "task_candidate",
    "execution_batch_id": "eb_demo_001",
    "owner": "小王",
    "due_date": "2026-05-09",
    "priority": "high",
    "project": "增长活动",
    "notes": null
  },
  "sync_target": "none",
  "created_at": "2026-05-04T12:00:01Z",
  "error_code": "BATCH_NOT_FOUND",
  "error_message": "execution_batch_id not registered",
  "handling_class": "blocking_batch"
}
```

### 9. Workflow Sync Target

**Tasks**：新增或更新一行；保留 `source_evidence`、`execution_batch_id`、`receipt_id` 关联。

### 10. Metrics Mapping

| 指标 | 关联方式 |
|------|----------|
| Tool Routing Accuracy | 是否应对 `create_todo` |
| Mock Execution Success Rate | `status` 分布 |
| Wrong Execution Rate | **`input_snapshot`（或等价的 `confirmed_tool_call.arguments`）与 Gold Arguments Snapshot 逐字段对比**，见 §2；`result` 仅作 Sync 侧辅助校验 |
| Evidence Coverage Rate | `source_evidence` 存在且可解析 |
| Schema Consistency | 请求与 `input_snapshot` 通过 JSON Schema 校验 |

### 11. Future API Mapping

- 请求体 **`arguments`** 保持不变；新增 `HttpToolAdapter` 将同一 JSON POST 至真实任务系统。  
- 仅替换 **传输层与鉴权**；不在 MVP 字段中增加企业级扩展。

---

## 7. `update_project_board`

### 1. Tool Purpose

将 **已确认的项目更新**（含 Risk 归并项）写入 **Projects** 视图：进展、风险、Blocker、Follow-up。

### 2. Trigger Condition

- `candidate_type = project_update`（含由 Recognition `Risk` 归并的候选）  
- `route_result.validation_status = ok` 且 `tool_name = update_project_board`  
- 用户 **Confirmation** 通过；**高风险**同样必须确认（`risk_severity=high` 不得跳过批次）

### 3. Required Fields

| 字段 | 类型 | 说明 |
|------|------|------|
| `project` | string | 非空 |
| `update_type` | enum | 封闭集，如 `status_change` \| `risk` \| `blocker` \| `follow_up` \| `general` |
| `summary` | string | 非空摘要 |
| `source_evidence` | object | 见 §5 |
| `confidence` | number | 见 §5 |
| `execution_batch_id` | string | 确认后注入 |

### 4. Optional Fields

| 字段 | 类型 | 说明 |
|------|------|------|
| `risk_flag` | boolean | 默认 `false` |
| `risk_highlight` | string \| null | 短高亮文案；`risk_flag=true` 时建议非空 |
| `risk_severity` | enum \| null | `low` \| `medium` \| `high`；**`risk_flag=true` 时 Routing 前必填**，否则 `validation_status=invalid` |
| `blocker` | string \| null | |
| `follow_up` | string \| null | |
| `status` | string \| null | 看板列或状态标签 |
| `related_task_id` | string \| null | Mock 侧任务 id 或占位 |

### 5. Validation Rules

- `project`、`summary` 非空  
- `update_type` 必须在枚举内  
- `source_evidence`、`confidence` 同 §5  
- **`risk_flag=true` 且缺少 `risk_severity`** → **仅** Tool Routing：`validation_status=invalid`（禁止 Confirmation / Adapter 二次决定）  
- `risk_severity=high` 的调用须携带 **已验证** 的 `execution_batch_id`（确认门产物）

### 6. Mock Request Example

```json
{
  "tool_name": "update_project_board",
  "arguments": {
    "project": "增长活动",
    "update_type": "risk",
    "summary": "投放渠道数据延迟，影响复盘",
    "source_evidence": {
      "text": "渠道数据要周二才能齐",
      "anchor": "inbox:inb_demo_001#s5"
    },
    "confidence": 0.78,
    "execution_batch_id": "eb_demo_002",
    "risk_flag": true,
    "risk_highlight": "数据延迟 → 复盘推迟",
    "risk_severity": "high",
    "blocker": "等待数仓同步",
    "follow_up": "周三对齐结论",
    "status": "at_risk",
    "related_task_id": null
  }
}
```

### 7. Mock Success Response

```json
{
  "receipt_id": "rcpt_demo_proj_001",
  "tool_name": "update_project_board",
  "status": "succeeded",
  "execution_batch_id": "eb_demo_002",
  "input_snapshot": {
    "project": "增长活动",
    "update_type": "risk",
    "summary": "投放渠道数据延迟，影响复盘",
    "source_evidence": {
      "text": "渠道数据要周二才能齐",
      "anchor": "inbox:inb_demo_001#s5"
    },
    "confidence": 0.78,
    "execution_batch_id": "eb_demo_002",
    "risk_flag": true,
    "risk_highlight": "数据延迟 → 复盘推迟",
    "risk_severity": "high",
    "blocker": "等待数仓同步",
    "follow_up": "周三对齐结论",
    "status": "at_risk",
    "related_task_id": null
  },
  "sync_target": "projects",
  "created_at": "2026-05-04T12:00:02Z",
  "result": {
    "board_item_id": "proj_mock_010",
    "project": "增长活动",
    "risk_flag": true,
    "risk_severity": "high"
  }
}
```

### 8. Mock Failure Response

```json
{
  "receipt_id": "rcpt_demo_fail_002",
  "tool_name": "update_project_board",
  "status": "failed",
  "execution_batch_id": "eb_demo_002",
  "input_snapshot": {
    "project": "增长活动",
    "update_type": "risk_unknown",
    "summary": "投放渠道数据延迟，影响复盘",
    "source_evidence": {
      "text": "渠道数据要周二才能齐",
      "anchor": "inbox:inb_demo_001#s5"
    },
    "confidence": 0.78,
    "execution_batch_id": "eb_demo_002",
    "risk_flag": true,
    "risk_highlight": "数据延迟 → 复盘推迟",
    "risk_severity": "high",
    "blocker": null,
    "follow_up": null,
    "status": null,
    "related_task_id": null
  },
  "sync_target": "none",
  "created_at": "2026-05-04T12:00:03Z",
  "error_code": "ENUM_INVALID",
  "error_message": "update_type not in allowed set",
  "handling_class": "user_action_required"
}
```

### 9. Workflow Sync Target

**Projects**：写入 / 更新看板条目；**`risk_flag=true`** 时 UI **高亮**（原型与实现须一致）。

### 10. Metrics Mapping

| 指标 | 关联方式 |
|------|----------|
| Tool Routing Accuracy | 是否应对 `update_project_board` |
| Mock Execution Success Rate | `status` 分布 |
| Wrong Execution Rate | **`input_snapshot` 与 Gold Arguments Snapshot** 逐字段对比，见 §2 |
| Evidence Coverage Rate | `source_evidence` |
| Schema Consistency | 含 `risk_*` 条件校验 |

### 11. Future API Mapping

- 同一 `arguments` POST 至项目管理适配器；可增加 **适配器侧** 字段映射表，**不** 修改 MVP 发布的 Tool Schema。

---

# P1 Tools

---

## 8. `generate_weekly_report_material`

### 1. Tool Purpose

基于 **已确认** 的 Tasks / Projects 上下文生成 **周报素材**（结构化块），写入 **Reports**。

### 2. Trigger Condition

- 用户从 Reports 路径或显式动作触发；输入上下文须 **仅含已确认** 条目  
- `route_result` / 批次策略由 PRD 与交互稿固定；仍须 **Confirmation** 若与执行批次绑定

### 3. Required Fields

| 字段 | 类型 | 说明 |
|------|------|------|
| `source_items` | array | 元素为 `{ "type": "task"|"project", "id": string }` 等封闭结构 |
| `time_range` | object | 如 `{ "start": "2026-04-28", "end": "2026-05-04" }` |
| `summary_type` | enum | 如 `bullet` \| `paragraph` |

### 4. Optional Fields

| 字段 | 类型 | 说明 |
|------|------|------|
| `execution_batch_id` | string | 与主链路同批时必填；独立生成流按 PRD |
| `locale` | string | 默认 `zh-CN` |

### 5. Validation Rules

- `source_items` 非空数组  
- `time_range` 起止合法  
- **不得** 将未确认草稿混入 `source_items`

### 6. Mock Request Example

```json
{
  "tool_name": "generate_weekly_report_material",
  "arguments": {
    "source_items": [
      { "type": "task", "id": "task_mock_001" },
      { "type": "project", "id": "proj_mock_010" }
    ],
    "time_range": { "start": "2026-04-28", "end": "2026-05-04" },
    "summary_type": "bullet",
    "execution_batch_id": "eb_demo_003",
    "locale": "zh-CN"
  }
}
```

### 7. Mock Success Response

```json
{
  "receipt_id": "rcpt_demo_report_001",
  "tool_name": "generate_weekly_report_material",
  "status": "succeeded",
  "execution_batch_id": "eb_demo_003",
  "input_snapshot": {
    "source_items": [
      { "type": "task", "id": "task_mock_001" },
      { "type": "project", "id": "proj_mock_010" }
    ],
    "time_range": { "start": "2026-04-28", "end": "2026-05-04" },
    "summary_type": "bullet",
    "execution_batch_id": "eb_demo_003",
    "locale": "zh-CN"
  },
  "sync_target": "reports",
  "created_at": "2026-05-04T12:30:00Z",
  "result": {
    "material_id": "rpt_mock_001",
    "bullets": [
      "任务：补齐活动页文案（截止 2026-05-09）",
      "项目：增长活动 — 渠道数据延迟，复盘顺延"
    ]
  }
}
```

### 8. Mock Failure Response

| `error_code` | 典型场景 |
|--------------|----------|
| `EMPTY_SOURCES` | `source_items` 为空 |
| `INVALID_RANGE` | `time_range` 非法 |

回执须含完整 `input_snapshot` 与 `handling_class`，见 §12。

下列示例为 **`EMPTY_SOURCES`**（`handling_class=silent_fail`）；`INVALID_RANGE` 时仅替换 `error_code` / `error_message` / `handling_class`（`user_action_required`），`input_snapshot` 仍为当次请求深拷贝。

```json
{
  "receipt_id": "rcpt_demo_report_fail_001",
  "tool_name": "generate_weekly_report_material",
  "status": "failed",
  "execution_batch_id": "eb_demo_003",
  "input_snapshot": {
    "source_items": [],
    "time_range": { "start": "2026-04-28", "end": "2026-05-04" },
    "summary_type": "bullet",
    "execution_batch_id": "eb_demo_003",
    "locale": "zh-CN"
  },
  "sync_target": "none",
  "created_at": "2026-05-04T12:30:01Z",
  "error_code": "EMPTY_SOURCES",
  "error_message": "source_items must be non-empty",
  "handling_class": "silent_fail"
}
```

### 9. Workflow Sync Target

**Reports**。

### 10. Metrics Mapping

Tool Routing Accuracy（若经路由）；Mock Success Rate；**Wrong Execution Rate** 定义同 §2，对比 Gold Arguments Snapshot；Schema Consistency；与 **Usefulness** 类人工评分在 evaluation 中关联。

### 11. Future API Mapping

输出侧可接文档或 IM 适配器；**输入 Schema 保持稳定**。

---

## 9. `create_knowledge_card`

### 1. Tool Purpose

基于与 **已确认执行项** 强相关的片段生成 **轻量知识卡片**，写入 **Knowledge**。

### 2. Trigger Condition

- 用户显式触发；`related_execution_id` 须指向已 **succeeded** 的执行或产品约定的稳定 id  
- 具体入口、页面位置与交互路径见 [workflow.md](./workflow.md)、[demo_plan.md](./demo_plan.md)

### 3. Required Fields

| 字段 | 类型 | 说明 |
|------|------|------|
| `title` | string | 非空 |
| `content` | string | 非空正文或要点 |
| `source_evidence` | object | 见 §5 |
| `related_execution_id` | string | 关联已确认执行 |

### 4. Optional Fields

| 字段 | 类型 | 说明 |
|------|------|------|
| `tags` | string[] | 封闭标签集 |
| `execution_batch_id` | string | 若与批次绑定 |

### 5. Validation Rules

- `title`、`content`、`source_evidence.text` 非空  
- `related_execution_id` 必须在本地执行日志中存在且状态为成功（或产品约定）

### 6. Mock Request Example

`related_execution_id` 与 §6 `create_todo` 成功回执 `receipt_id` 对齐，用于跨 Tool 追溯。

```json
{
  "tool_name": "create_knowledge_card",
  "arguments": {
    "title": "活动页文案检查清单",
    "content": "需包含：标题、利益点、CTA、合规声明。",
    "source_evidence": {
      "text": "文案要过法务",
      "anchor": "inbox:inb_demo_001#s7"
    },
    "related_execution_id": "rcpt_demo_todo_001",
    "execution_batch_id": "eb_demo_004",
    "tags": ["合规", "活动页"]
  }
}
```

### 7. Mock Success Response

```json
{
  "receipt_id": "rcpt_demo_card_001",
  "tool_name": "create_knowledge_card",
  "status": "succeeded",
  "execution_batch_id": "eb_demo_004",
  "input_snapshot": {
    "title": "活动页文案检查清单",
    "content": "需包含：标题、利益点、CTA、合规声明。",
    "source_evidence": {
      "text": "文案要过法务",
      "anchor": "inbox:inb_demo_001#s7"
    },
    "related_execution_id": "rcpt_demo_todo_001",
    "execution_batch_id": "eb_demo_004",
    "tags": ["合规", "活动页"]
  },
  "sync_target": "knowledge",
  "created_at": "2026-05-04T12:45:00Z",
  "result": {
    "card_id": "card_mock_001",
    "title": "活动页文案检查清单"
  }
}
```

### 8. Mock Failure Response

`error_code`：`RELATED_EXEC_NOT_FOUND`；`handling_class`：`user_action_required`。

```json
{
  "receipt_id": "rcpt_demo_card_fail_001",
  "tool_name": "create_knowledge_card",
  "status": "failed",
  "execution_batch_id": "eb_demo_004",
  "input_snapshot": {
    "title": "活动页文案检查清单",
    "content": "需包含：标题、利益点、CTA、合规声明。",
    "source_evidence": {
      "text": "文案要过法务",
      "anchor": "inbox:inb_demo_001#s7"
    },
    "related_execution_id": "rcpt_demo_missing_999",
    "execution_batch_id": "eb_demo_004",
    "tags": ["合规", "活动页"]
  },
  "sync_target": "none",
  "created_at": "2026-05-04T12:45:01Z",
  "error_code": "RELATED_EXEC_NOT_FOUND",
  "error_message": "related_execution_id not found or not succeeded",
  "handling_class": "user_action_required"
}
```

### 9. Workflow Sync Target

**Knowledge**。

### 10. Metrics Mapping

同 §8 `generate_weekly_report_material`；Evidence Coverage 强制校验 `source_evidence` 与 `anchor` 格式。

### 11. Future API Mapping

与 §8 `generate_weekly_report_material` 相同：**适配器替换传输**，Schema 不企业化扩张。

---

## 10. 端到端契约示例（`create_todo`）

以下四条为 **同一业务事实** 的链式形态，字段值与 §6 请求 / 成功回执一致；评测 Gold 即对该链最终 `arguments` 的人工标注快照。

**`normalized_candidate`（Field Extraction 输出，摘录）**

```json
{
  "candidate_id": "cand_demo_todo_001",
  "candidate_type": "task",
  "title": "补齐活动页文案",
  "source_evidence": {
    "text": "@小王 周五前给一版",
    "anchor": "inbox:inb_demo_001#s3"
  },
  "confidence": 0.82,
  "owner": "小王",
  "due_date": "2026-05-09",
  "priority": "high",
  "project": "增长活动",
  "notes": null,
  "risk_flag": false
}
```

**`route_result`（Tool Routing；确认前 `execution_batch_id` 为空占位）**

```json
{
  "candidate_id": "cand_demo_todo_001",
  "tool_name": "create_todo",
  "arguments": {
    "title": "补齐活动页文案",
    "source_evidence": {
      "text": "@小王 周五前给一版",
      "anchor": "inbox:inb_demo_001#s3"
    },
    "confidence": 0.82,
    "created_from": "task_candidate",
    "execution_batch_id": "",
    "owner": "小王",
    "due_date": "2026-05-09",
    "priority": "high",
    "project": "增长活动",
    "notes": null
  },
  "validation_status": "ok"
}
```

**`confirmed_tool_call`（Confirmation 注入批次 ID）**

```json
{
  "call_id": "call_demo_001",
  "tool_name": "create_todo",
  "arguments": {
    "title": "补齐活动页文案",
    "source_evidence": {
      "text": "@小王 周五前给一版",
      "anchor": "inbox:inb_demo_001#s3"
    },
    "confidence": 0.82,
    "created_from": "task_candidate",
    "execution_batch_id": "eb_demo_001",
    "owner": "小王",
    "due_date": "2026-05-09",
    "priority": "high",
    "project": "增长活动",
    "notes": null
  },
  "confirmed_at": "2026-05-04T11:59:00Z"
}
```

**`execution_receipt`（成功）** 见 §6.7；**`input_snapshot`** 须与本条 `arguments` 深拷贝一致。

---

## 11. 端到端契约示例（`update_project_board` / Risk Path）

以下四条为 **同一 Risk 业务事实** 的链式形态，字段值与 §7 请求 / 成功回执一致；**高风险**须在 Confirmation 通过且 `execution_batch_id` 有效后方可执行。

**`normalized_candidate`（Field Extraction / Risk 归并输出，摘录）**

```json
{
  "candidate_id": "cand_demo_proj_risk_001",
  "candidate_type": "project_update",
  "project": "增长活动",
  "update_type": "risk",
  "summary": "投放渠道数据延迟，影响复盘",
  "source_evidence": {
    "text": "渠道数据要周二才能齐",
    "anchor": "inbox:inb_demo_001#s5"
  },
  "confidence": 0.78,
  "risk_flag": true,
  "risk_highlight": "数据延迟 → 复盘推迟",
  "risk_severity": "high",
  "blocker": "等待数仓同步",
  "follow_up": "周三对齐结论",
  "status": "at_risk"
}
```

**`route_result`（Tool Routing；确认前 `execution_batch_id` 为空占位）**

```json
{
  "candidate_id": "cand_demo_proj_risk_001",
  "tool_name": "update_project_board",
  "arguments": {
    "project": "增长活动",
    "update_type": "risk",
    "summary": "投放渠道数据延迟，影响复盘",
    "source_evidence": {
      "text": "渠道数据要周二才能齐",
      "anchor": "inbox:inb_demo_001#s5"
    },
    "confidence": 0.78,
    "execution_batch_id": "",
    "risk_flag": true,
    "risk_highlight": "数据延迟 → 复盘推迟",
    "risk_severity": "high",
    "blocker": "等待数仓同步",
    "follow_up": "周三对齐结论",
    "status": "at_risk",
    "related_task_id": null
  },
  "validation_status": "ok"
}
```

**`confirmed_tool_call`（用户确认批次后注入 `execution_batch_id`）**

```json
{
  "call_id": "call_demo_proj_risk_001",
  "tool_name": "update_project_board",
  "arguments": {
    "project": "增长活动",
    "update_type": "risk",
    "summary": "投放渠道数据延迟，影响复盘",
    "source_evidence": {
      "text": "渠道数据要周二才能齐",
      "anchor": "inbox:inb_demo_001#s5"
    },
    "confidence": 0.78,
    "execution_batch_id": "eb_demo_002",
    "risk_flag": true,
    "risk_highlight": "数据延迟 → 复盘推迟",
    "risk_severity": "high",
    "blocker": "等待数仓同步",
    "follow_up": "周三对齐结论",
    "status": "at_risk",
    "related_task_id": null
  },
  "confirmed_at": "2026-05-04T11:59:30Z"
}
```

**`execution_receipt`（成功；`sync_target=projects`）**

`input_snapshot` 须与本条 `arguments` 深拷贝一致；与 §7.7 成功示例对齐。

```json
{
  "receipt_id": "rcpt_demo_proj_001",
  "tool_name": "update_project_board",
  "status": "succeeded",
  "execution_batch_id": "eb_demo_002",
  "input_snapshot": {
    "project": "增长活动",
    "update_type": "risk",
    "summary": "投放渠道数据延迟，影响复盘",
    "source_evidence": {
      "text": "渠道数据要周二才能齐",
      "anchor": "inbox:inb_demo_001#s5"
    },
    "confidence": 0.78,
    "execution_batch_id": "eb_demo_002",
    "risk_flag": true,
    "risk_highlight": "数据延迟 → 复盘推迟",
    "risk_severity": "high",
    "blocker": "等待数仓同步",
    "follow_up": "周三对齐结论",
    "status": "at_risk",
    "related_task_id": null
  },
  "sync_target": "projects",
  "created_at": "2026-05-04T12:00:02Z",
  "result": {
    "board_item_id": "proj_mock_010",
    "project": "增长活动",
    "risk_flag": true,
    "risk_severity": "high"
  }
}
```

---

## 12. 错误码与 `handling_class`（Mock / Adapter）

契约层 **行为语义**（非 UI）：Adapter / Workflow 引擎据此选择重试、阻断批次或标记静默失败。

| `error_code` | 含义 | `handling_class` |
|--------------|------|------------------|
| `VALIDATION_FAILED` | 参数或批次校验失败 | `user_action_required` |
| `ENUM_INVALID` | 枚举越界 | `user_action_required` |
| `BATCH_NOT_FOUND` | `execution_batch_id` 无效或未注册 | `blocking_batch` |
| `EMPTY_SOURCES` | P1 源列表为空 | `silent_fail` |
| `INVALID_RANGE` | 时间范围非法 | `user_action_required` |
| `RELATED_EXEC_NOT_FOUND` | 知识卡关联执行不存在 | `user_action_required` |
| `INTERNAL_ERROR` | 未分类实现错误 | `retryable` |

| `handling_class` | 契约含义 |
|------------------|----------|
| `retryable` | 允许同构重试（须防重复写入，由实现保证幂等或批次令牌） |
| `user_action_required` | 须修正参数或数据后再提交；不自动重试 |
| `blocking_batch` | 当前执行批次不可继续，直至批次状态被修复或取消 |
| `silent_fail` | 不产生 Sync 写入；是否向用户升维提示由产品层决定，**非本契约范围** |

失败回执仍须带完整 `input_snapshot`，以便与 Gold / 日志对齐。

---

## 13. 相关文档

| 文档 | 用途 |
|------|------|
| [skills_design.md](./skills_design.md) | Skill IO 与 Risk 规则 |
| [workflow.md](./workflow.md) | 状态机与 Sync |
| [demo_plan.md](./demo_plan.md) | Web 原型步骤与验收口径（User Workspace / Admin Console） |
| [PRD.md](./PRD.md) | 范围与优先级 |
| [evaluation.md](./evaluation.md) | 指标操作化 |

