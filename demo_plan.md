# TaskFlow Agent · Web 原型验收方案

本文规定 **Web 前端的验收结构**：将 **用户工作流**、**运营与评测**、**技术可观测性** 分置于 **User Workspace（用户端）** 与 **Admin Console（运营端）**，避免职责混排。

**契约不变：** PRD、workflow、skills_design、tool_schema、evaluation 中的 **字段、状态、指标定义与 Gold 口径** 不随双端拆分而改变；仅规定 **在何种界面被指认、以何种信息密度呈现**。

| 端 | 定位 | 原则 |
|----|------|------|
| **User Workspace** | 可信执行助手 | 产品化、轻量、工作流清晰 |
| **Admin Console** | AI 治理后台 | 可评测、可监控、可审计、可优化 |

---

## 0. 双端职责总览

### 0.1 User Workspace（用户端）— 须可走通或可指认

仅服务 **用户工作流**，保留与 PRD §7 主路径一致的最小闭环：

| 能力域 | 验收要点（与 workflow / PRD 对齐） |
|--------|-----------------------------------|
| **Inbox** | 批次化输入、来源类型、`draft` → `submitted` → `parsed` / `failed` |
| **输入区** | 原文编辑、提交、重试；不混入全局指标或 Gold 审计台 |
| **候选项** | `normalized_candidate` 表：可编辑、丢弃；未丢弃项进入执行批次；状态 `proposed` / `edited` / `confirmed` / `rejected` |
| **Evidence** | 候选项级 `source_evidence`、`anchor`；可与原文对照（含正文内高亮等轻量形态） |
| **Confidence** | 候选项级置信展示与低置信提示；**不** 升级为整页评测诊断 |
| **Confirmation** | 批量确认、`execution_batch_id` 注入；未确认不执行 |
| **Tool Routing** | 侧栏或固定区：`route_result` 草案、`confirmed_tool_call` 摘要；与 tool_schema **同键名** |
| **Sync Results** | Tasks / Projects（及 P1 Reports / Knowledge）仅反映 **已确认且执行成功** 的写入；Before / After 对照 |

P1 模块（Reports / Knowledge）仍属用户工作流延伸，**不得**承载运营大盘。

### 0.2 Admin Console（运营端）— 须可指认或与 pipeline 同源

承载 **系统治理、评测、日志、监控**；下列项 **从用户主屏迁出**，统一在 Admin 或其子视图指认（可为全量 Web、内网工具或静态报告 + 链接，但 **文档验收以「有独立归属」为准**）：

| 能力域 | 验收要点 |
|--------|----------|
| **Evaluation Summary** | P/R、Wrong Execution、Routing Accuracy、Zero-Edit Approval 等与 [evaluation.md](./evaluation.md) **同名同义**；与 `expected_metrics` 无两套数 |
| **Run History** | `execution_batch_id`、批次时间、状态聚合；与 workflow §3.3 / §3.4 对齐 |
| **Metrics** | 版本对比、趋势、门槛对照 evaluation §7 |
| **Tool Analytics** | 按 `tool_name` 的成功率、错误码分布、`handling_class` 聚合；与 tool_schema §12 一致 |
| **Logs** | 结构化调用日志、Tracing ID（若有）、与回执关联 |
| **Error Review** | `error_code` / `handling_class` 分拣、典型失败复现入口；与本文件 §7 错误流表一致 |
| **Gold Dataset** | Gold Arguments Snapshot 管理、样本 id、与 `input_snapshot` 差异对照；与 tool_schema §2、evaluation §4 一致 |


### 0.3 原型在体系中的位置

| 维度 | 要点 |
|------|------|
| 验证焦点 | **用户端**：碎片输入 → 可执行结构化资产 → Mock 执行 → Workflow Sync 的 **可确认闭环**。**运营端**：同源 pipeline 之指标、批次、日志与 Gold **可审计**。 |
| 验证什么 | 下表「核心验证目标」须在 **User 和/或 Admin** 中按列指认；不得仅靠未归档的口头说明 |
| 如何证明产品成立 | Skills、Tool、Sync、Evaluation **同源数据**；须具备可核对的契约字段，避免仅有界面而无结构 |
| 如何映射系统架构 | 用户端页面与状态、Tool 名、字段与 workflow、tool_schema 一致；运营端与 evaluation、回执字段对齐 |
| 如何体现分层 | 本文 §3～§6；用户端可用轻量执行链；**八步全链深度对照**优先在 Admin 或折叠专家视图 |
| 完整版 / 精简版 | §2；同一 Fixture，**用户端**裁剪交互深度，**运营端**在精简版下可仅开放摘要条 |
| 前端实现 | §10；用户端布局轻量；运营端可读 JSON、表格、筛选 |

---

## 1. 核心验证目标（须全部可走通或可指认）

以下七条为 **验收级** 目标。表中明确 **主要在 User Workspace 指认** 还是 **主要在 Admin Console 指认**（「主 / 辅」：辅表示用户端可极简，但不可与主指认矛盾）。

| # | 验证命题 | 系统锚点 | User Workspace | Admin Console |
|---|----------|----------|------------------|---------------|
| 1 | 碎片输入可变为可执行结构化资产 | Inbox → Recognition → Field Extraction | **主**：原文、批次、候选项表与 `source_evidence`、`confidence`、`missing` | **辅**：同批次解析日志 / 切片索引（若有） |
| 2 | Agent Workflow 闭环成立 | workflow 八步 | **主**：提交 → Tasks/Projects 无断点；状态与 workflow §3 一致 | **辅**：Run History 状态机对照 |
| 3 | Skills 分层可信 | skills_design 顺序 | **主**：分段在产物上可区分（候选项类型、证据链），禁止单键黑箱 | **辅**：管线阶段耗时或阶段标记（可选） |
| 4 | Tool Calling 可信 | tool_schema | **主**：侧栏展示路由草案、确认载荷摘要、回执关键字段，与 tool_schema 示例一致 | **主**：完整 `execution_receipt` JSON、Tool Analytics、与 Gold 逐字段对照 |
| 5 | Confirmation 可控 | PRD §7.7 | **主**：无 `execution_batch_id` 不可执行；确认后注入批次 | **辅**：批次审计列表 |
| 6 | Mock 与 Sync 可信 | tool_schema §4 | **主**：回执 `status`、`sync_target` 与 Tasks/Projects 列表联动，仅 succeeded 写入 | **主**：失败回执库、部分成功 `partial` 统计 |
| 7 | Evaluation 可验证 | evaluation、tool_schema §2 | **辅**：用户端 **不** 要求展示 P/R 大盘；可保留一句「指标见治理台」 | **主**：Evaluation Summary、Wrong Execution、Routing、Zero-Edit 与 Gold 对照；`expected_metrics` 同源 |

任一缺失且无等效 Admin 指认，则不足以完成「执行型 Agent」产品级验收。

---

## 2. 版本层级：完整版与精简版（按端裁剪）

| 维度 | **完整版 · User Workspace** | **精简版 · User Workspace** |
|------|---------------------------|---------------------------|
| **用途** | 全链路深度验收与产品设计对照 | 主路径快速走通 |
| **深度** | 八步主链用户可见环节 + 侧栏契约摘要 | 主链：输入 → 候选 + 确认 → 执行回执 → Tasks/Projects Before/After |
| **错误流** | 至少两类 `error_code` 与 `handling_class` **在用户路径上可感知**（inline / 阻断提示），码表与 tool_schema §12 一致 | 一屏静态说明或固定口述，码表不自编 |
| **Risk** | §5 完整高风险路径在用户端可见 | 至少一条 `risk_highlight` 可见 |
| **P1** | Reports / Knowledge 各至少一次成功路径（与 PRD P1 一致） | 可省略或静态一页 |

| 维度 | **完整版 · Admin Console** | **精简版 · Admin Console** |
|------|--------------------------|---------------------------|
| **用途** | 评测指标、工程联调与迭代复盘 | 指标摘要与文档交叉引用 |
| **深度** | Evaluation Summary + Run History + Gold 差异表 + Error Review 入口 | 静态 Evaluation Summary 数表 + 指向 evaluation.md 的说明 |
| **数据** | 与 `evaluation.md` 混合 bundle **同源** `expected_metrics` | 预渲染指标截图或子集 JSON |

两版本 **共用** 术语、Tool 名、状态枚举；精简版仅为 **信息裁剪**，不改变契约含义。精简版 **不得**省略错误可信度在用户端的锚点（见上表「错误流」）。

---

## 3. User Workspace — 信息架构与页面映射

### 3.1 全局布局职责

| 区域 | 职责 | 与 workflow 关系 |
|------|------|------------------|
| **左侧导航** | Inbox、Tasks、Projects、Reports（P1）、Knowledge（P1） | 与 PRD 模块一一对应；**不**增加 Evaluation / Run History 等运营顶层项 |
| **中央主区** | Inbox：输入、来源类型、批次提交；解析后 **候选项表** | Inbox 状态 `draft`→`submitted`→`parsed`/`failed`；候选 `proposed`/`edited` |
| **右侧栏或底部 Dock** | Tool 草案、确认与批次、Mock 执行状态、`execution_receipt` **摘要**（非整站日志） | Confirmation → Mock Executor → 触发 Sync |

### 3.2 分页面说明（用户端）

下列 §3.2.A～H 为分页面验收说明；指标大盘归属 **§4 Admin**。

#### A. Inbox（P0）

| 维度 | 内容 |
|------|------|
| 产品目的 | 接收碎片原文，形成可追溯 **批次** 与句段锚点 |
| 用户动作 | 粘贴/编辑；选择 `source_type`；提交；失败时重试 |
| 数据状态 | `inbox_batch`：`draft` → `submitted` → `parsed` \| `failed`（workflow §3.1） |
| Tool 关系 | 无直接 Tool；下游 Skills 消费批次 ID |
| 验收要点 | 证明「输入资产」非一次性对话，而是 **批次化执行入口** |

#### B. Recognition / Parsing（逻辑层，可与 Inbox 同屏第二阶段展示）

| 维度 | 内容 |
|------|------|
| 产品目的 | Actionable vs Informational；二级 Todo / Project Update（含 Risk 归并口径，见 skills_design / evaluation） |
| 用户动作 | 默认自动触发；可选「重新解析」 |
| 数据状态 | 批次 `parsed` 后附着分类标签；**Actionable Slice** 可引用 `anchor`（tool_schema §5） |
| Tool 关系 | 为 Task Extraction / Project Update 提供输入；不直接产出 Tool |
| 验收要点 | 证明「不是全文摘要」，而是 **可执行切片识别** |

#### C. Candidate Table（P0，中央区核心）

| 维度 | 内容 |
|------|------|
| 产品目的 | 展示 `normalized_candidate`：可编辑、可拒绝；未丢弃项进入本批执行集 |
| 用户动作 | 行内编辑；丢弃；查看 `source_evidence` 与 **候选项级** `confidence`；处理 `missing` |
| 数据状态 | `proposed` → `edited` → `confirmed` \| `rejected`（workflow §3.2） |
| Tool 关系 | 每行绑定 **路由预览** `tool_name`（P0/P1 与 PRD 一致） |
| 验收要点 | 证明 **可控结构化** 与 **证据绑定** |

#### D. Confirmation Gate（P0，侧栏或底部）

| 维度 | 内容 |
|------|------|
| 产品目的 | 批量确认、编辑终值、删除；**未确认不调用 Mock** |
| 用户动作 | 确认并执行；丢弃以缩小批次；高风险项须完成确认（无有效批次不得执行） |
| 数据状态 | 生成 `execution_batch_id`；候选进入 `confirmed`；执行 `pending`→`running`→`succeeded`\|`failed` |
| Tool 关系 | 输出 `confirmed_tool_call` 列表 |
| 验收要点 | 证明 **人在环路** 与 **执行闸门** |

#### E. Mock Tool Call 观测区（P0，建议侧栏固定 Tab）

| 维度 | 内容 |
|------|------|
| 产品目的 | 显性化 **路由结果**、**确认后参数**、**回执摘要**（用户决策够用即可） |
| 用户动作 | 展开关键字段；可选「复制回执」；**完整 JSON 审计**可链至 Admin 或折叠「专家模式」 |
| 数据状态 | 与 tool_schema `execution_receipt` 外壳字段一致 |
| Tool 关系 | 四 Tool 名与 PRD / tool_schema **完全一致**，禁止别名 |
| 验收要点 | 证明 **产品非概念**：用户可核对；深度审计在 Admin |

#### F. Workflow Sync 视图：Tasks / Projects（P0）

| 维度 | 内容 |
|------|------|
| 产品目的 | 仅反映 **已确认且执行成功** 的写入 |
| 用户动作 | 列表筛选；详情看证据链与 `execution_batch_id` / `receipt_id` |
| 数据状态 | Sync `synced` \| `partial` \| `retryable`（workflow §3.4） |
| Tool 关系 | Tasks ← `create_todo`；Projects ← `update_project_board` |
| 验收要点 | 证明 **工作流更新** 非聊天侧栏 |

#### G. Reports / Knowledge（P1）

| 维度 | 内容 |
|------|------|
| 产品目的 | `generate_weekly_report_material`、`create_knowledge_card` 的 Sync 落点 |
| 用户动作 | Reports：选择已确认上下文触发生成；Knowledge：**显式触发**（见 [tool_schema.md](./tool_schema.md)） |
| 数据状态 | 独立于 P0 主链路阻塞关系；失败不反写 Tasks/Projects |
| Tool 关系 | 严格 P1；不得阻塞 P0 主路径验收 |
| 验收要点 | 证明 **沉淀维度可扩展**，且仍走确认与契约 |

#### H. Before / After（建议独立窄条或末屏）

| 维度 | 内容 |
|------|------|
| 产品目的 | 同批次 **输入原文摘要** vs **Tasks/Projects 资产列表** 对照 |
| 用户动作 | 切换对照视图 |
| 数据状态 | 只读；数据来自同一 `inbox_batch_id` |
| Tool 关系 | 聚合多 Tool 成功回执 |
| 验收要点 | 支撑 **输入到工作流资产** 的对照可追溯；整页指标仍归 Admin |

---

## 4. Admin Console — 信息架构与能力映射

### 4.1 与评测文档的固定对应

| Admin 模块 | 文档锚点 | 最低验收 |
|------------|----------|----------|
| **Evaluation Summary** | [evaluation.md](./evaluation.md) §3、§7 | P/R、Wrong Execution、Routing、Zero-Edit 等与定义 **同名同义**；若来自 Fixture 内嵌字段，须与 §4.3 `expected_metrics` **一致** |
| **Run History** | workflow §3.3、§3.4 | 批次列表、`execution_batch_id`、终态、与 Sync 结果关联 |
| **Metrics** | evaluation.md | 版本对比、门槛、时间节省率等可折叠 |
| **Tool Analytics** | tool_schema §4、§12 | 按 Tool / `error_code` / `handling_class` 聚合 |
| **Logs** | tool_schema 回执与实现约定 | 可检索、可关联 `receipt_id` |
| **Error Review** | 本文 §6、tool_schema §12 | 典型失败用例与修复状态（可与 Error 流表同一 Fixture） |
| **Gold Dataset** | tool_schema §2、evaluation §4 | Gold Arguments Snapshot 与 bundle id；禁止与 Fixture 参数矛盾的「隐藏 Gold」 |

### 4.2 `expected_metrics` 与 Evaluation Summary（强制一致）

须来源于 **与当前 `demo_fixture` 同源、同一评测口径** 的 **真实 evaluation pipeline 输出**（小样本跑批、预计算缓存 JSON 等），并记录脚本版本 / 输入哈希或 bundle id。**禁止** 人工编造无 pipeline 依据的数值、与 Gold 或 pipeline 脱节的伪评测结果。口径与 evaluation 文档及本文 §9 一致；**主指认面为 Admin Console**。

### 4.3 与用户端的跳转关系（可选实现）

- User Workspace 可提供「在治理台查看本批次」链接（权限受控）；**不** 要求在用户默认路径内嵌 iframe 大盘。

---

## 5. 数据对象与契约字段（双端可读性）

完整版验收中下列字段至少一处 **可读**（用户端表格 / Tooltip / 侧栏摘要，或 Admin 全量 JSON）。精简版可折叠非空校验字段。

| 对象 | 关键字段 | 文档出处 | 主要呈现端 |
|------|----------|----------|------------|
| 批次 | `inbox_batch_id`、`source_type`、原文 | PRD §7.1；workflow | User |
| 候选 | `candidate_id`、`candidate_type`、`normalized_candidate`、`source_evidence`（含 `anchor`）、`confidence`、`missing` | skills_design；tool_schema §5 | User（主） |
| 路由 | `route_result.tool_name`、`arguments`、`validation_status` | tool_schema | User（草案）+ Admin（聚合） |
| 确认 | `confirmed_tool_call`、`execution_batch_id` | tool_schema | User |
| 回执 | `execution_receipt` 全外壳 + `result` | tool_schema §4 | User（摘要）+ Admin（全量） |
| 评测 | Gold Arguments Snapshot；Wrong Execution 对比口径 | tool_schema §2；evaluation.md | **Admin** |

**`anchor` 格式**须符合 `inbox:{batch_id}#s{slice_index}`（tool_schema §5）；原型实现中禁止随意字符串。

---

## 6. Risk 路径（P0）

目标与历史 §6 相同：**项目管理型执行** 与纯任务列表区分，走通 **Recognition → Candidate → Confirmation → Tool → Projects Sync**。

| 步骤 | 系统行为 | User Workspace | Admin Console（可选） |
|------|----------|----------------|------------------------|
| 1～6 | 与 workflow / PRD 一致 | 候选行类型、Risk 标记、高亮、确认文案、Projects 写入 | 同批次 Routing / 回执校验、错误复现 |

Fixture 须含至少一条 **可与 Task 候选区分** 的 Risk 更新，以验收 **同批次多 Tool 类型**。

---

## 7. 错误流与 `handling_class`

错误码与 **`handling_class`** 以 [tool_schema.md](./tool_schema.md) §12 为准；完整版 / 精简版底线见 §2。

| `error_code`（示例） | `handling_class` | User Workspace 最低展示 | Admin Console |
|----------------------|------------------|---------------------------|---------------|
| `VALIDATION_FAILED` | `user_action_required` | Inline 或表单旁错误；不自动重试执行 | Error Review 条目、日志 |
| `ENUM_INVALID` | `user_action_required` | 同左；可链回候选编辑 | 聚合统计 |
| `BATCH_NOT_FOUND` | `blocking_batch` | **Blocking**：禁用执行或整批回退提示 | 批次审计 |
| `INTERNAL_ERROR` | `retryable` | **Retry**：用户可见重试入口 | 与 evaluation 中间失败叙事一致之日志 |
| `EMPTY_SOURCES` | `silent_fail` | **Silent fail**：Reports 无写入 + 文案说明 | 静默失败计数 |
| `INVALID_RANGE` | `user_action_required` | P1 周报路径须可走通 | Tool Analytics |

**说明：** 用户文案中的「RETRYABLE」对应 **`handling_class = retryable`**，**不** 单独发明错误码名。

---

## 8. 相关交叉索引（无契约变更）

| 主题 | 用户端 | 运营端 |
|------|--------|--------|
| 指标定义 | 不重复定义指标 | 唯一权威展示完整版评测总览处须引用 [evaluation.md](./evaluation.md) |
| Gold / Wrong Execution | 不在默认路径展开逐字段 diff | [tool_schema.md](./tool_schema.md) §2 + Admin Gold 视图 |
| 八步主链叙事 | 侧栏轻量执行链 | Run History + Logs 对齐 workflow |

---

## 9. 场景与 Fixture 规范

- **角色与场景：** **一线知识工作者 / 项目参与者**（[PRD.md](./PRD.md) §2）；材料为群聊 + 纪要 + 可选文档节选，**须** 含：至少 2 条隐含交办、1 条非任务干扰、1 处时间歧义、**1 条完整 Risk 路径**（§6）。  
- **Fixture：** 单一 `demo_fixture.json`（或与 evaluation 混合 bundle **同源**），包含：`inbox_batch`、`normalized_candidates[]`、`route_results[]`、`gold_arguments[]`、`expected_metrics`。  
- **`expected_metrics`（必须）：** 见 §4.2。  
- **禁止：** 为炫示而扩大 PRD P2 能力（真实 API 写回、企业权限等）。

---

## 10. 一致性自检

| # | 检查项 | 通过标准 |
|---|--------|----------|
| 1 | 用户端导航 vs PRD §7 / §8 | **无** Evaluation / Run History 等运营项混为顶层模块 |
| 2 | 状态 vs workflow §3 | 枚举值与转移 **可逐条对照** |
| 3 | Skills vs skills_design | 顺序与 I/O 命名 **一致** |
| 4 | Tool vs tool_schema | 仅规定四 Tool；回执外壳字段齐全 |
| 5 | 指标 vs evaluation / tool_schema | 指标名称与定义 **不自创**；**Admin** 展示与 evaluation **无两套数** |
| 6 | 产品定位与边界 | 与 [PRD.md](./PRD.md) §2～§4、§8 一致 |
| 7 | 双端边界 | 用户端 **轻量**；评测 / Gold / 全量日志 **可归 Admin**；边界不混乱 |
| 8 | `expected_metrics` vs §4.2 / §9 | 须为 **同源 evaluation pipeline** 产出；与 Evaluation Summary **无两套数** |

---

## 11. 前端实现约束（摘要）

### 11.1 User Workspace

- **单流水线 UI：** 不呈现多 Agent 分叉；并行仅体现在「同批次多候选」列表。  
- **可读 JSON：** 用户路径上 `route_result`、`confirmed_tool_call`、`execution_receipt` 建议 **摘要 + 可选展开**；全量高亮 JSON 可放 Admin 或专家折叠。  
- **状态驱动：** UI 禁用逻辑跟 `pending_confirmation`、`execution_batch_id`、Routing `validation_status` 走。  
- **P1 隔离：** Reports/Knowledge 入口与失败行为符合 PRD §7.10～§7.11。

### 11.2 Admin Console

- **表格 + JSON：** 评测与日志视图允许信息密度高于用户端；须只读、权限受控。  
- **同源：** 所有指标与 Gold 与 User 侧引用的批次 **同一 fixture / bundle id**。

---

## 12. 相关文档

| 文档 | 用途 |
|------|------|
| [PRD.md](./PRD.md) | 定位、模块、MVP、Non-Goals、**双端产品结构** |
| [workflow.md](./workflow.md) | 八步链、状态机、**User 主流程 / Admin 监控流** |
| [skills_design.md](./skills_design.md) | Skill I/O、Risk 规则 |
| [tool_schema.md](./tool_schema.md) | Tool 契约、回执、错误码、`handling_class`、Gold |
| [evaluation.md](./evaluation.md) | 指标、Gold、门槛（**Admin 主展示**） |
