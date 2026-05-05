# TaskFlow Agent 技能架构规格

与 [workflow.md](./workflow.md)、[PRD.md](./PRD.md)、[evaluation.md](./evaluation.md) 配套；Tool 字段以 [tool_schema.md](./tool_schema.md) 为准。原型 **User Workspace** 仅暴露与确认执行直接相关的结构化 IO；**Admin Console** 承载评测与日志维度的对照，见 [demo_plan.md](./demo_plan.md) §0～§4（不改变本章 Skill 契约）。

## 1. 架构定位

单线 **Agent**：Skills 做理解与结构化，Tool 承载动作，用户在确认门把关；MVP 用 **Mock** 代替外部写入，字段形态保持稳定，便于后续接真实 API。

### 典型路径示例（P0）

群聊粘贴 → **Recognition** → 任务类 **Actionable Slice** → **Task Extraction** → **Field Extraction** → **Tool Routing** → `create_todo` → **Confirmation** → **Mock Executor** → **Workflow Sync** → **Tasks** 列表更新。

---

## 2. 能力边界总表

| 层级 | 负责内容 | 不负责内容 |
|------|----------|------------|
| **模型（LLM）** | 语义分类、切片边界提议、任务/项目更新草案生成、路由意图提议 | 越过确认门执行 Tool；违反 Schema 的强行写入；无证据的字段捏造 |
| **规则与校验** | Schema 校验、`missing` 策略、路由合法性、确认门状态机、评测口径对齐 | 替代模型做开放式语义理解 |
| **Tool** | 将已确认决策编码为可调用载荷；Mock / 未来真实 API 同一契约 | 自行 reinterpret 用户意图 |
| **用户** | 编辑、拒绝、批量确认；对低置信与高风险项的最终裁量 | 无；系统不得在未确认下调用执行层 |

**禁止：** Skill 职责重叠；「由模型自行决定一切」；仅停留在自然语言层而无结构化 IO 与失败语义。

### Risk 归类与高亮（P0）

| 规则 | 说明 |
|------|------|
| **默认归并** | Recognition 输出的 `secondary_class = Risk` 的切片，**默认按 Project Update 子路径处理**：进入 **Project Update Skill** → **Field Extraction**，路由目标仍为 `update_project_board`（与项目更新候选同一套 Tool 契约，参数中承载风险语义）。 |
| **Risk Flag / Risk Highlight** | 归并后候选须带 **`risk_flag`**（布尔）及可选 **`risk_highlight`**（短文本，用于 UI 高亮来源句段或摘要）；自 Project Update 直接产出的更新候选若含风险语义，同样置位 `risk_flag`。 |
| **展示阶段** | 候选项列表与确认前详情区须展示 **Risk Highlight**，与证据锚点并列，避免风险信息被误认为普通描述。 |
| **Confirmation** | **`risk_flag = true`** 或 **`risk_severity` ≥ 产品设定阈值** 的条目，在确认界面 **强制展示额外风险提示文案**（只读，不自动否决执行）；文案由规则模板或轻量生成器产出，**不得**替代用户点击确认。 |

---

## 3. 分层逻辑：Recognition → Extraction → Standardization → Routing

| 阶段 | 承担 Skill | 产出物性质 |
|------|------------|------------|
| **Recognition** | Recognition | 可否执行、可执行单元边界、二级类型 |
| **Extraction** | Task Extraction / Project Update | **预标准化** 候选项：有标题或进展草案、证据锚点，**不含**最终必填字段闭包 |
| **Standardization** | Field Extraction | 统一必填 / 可选、`missing`、confidence、source evidence |
| **Routing** | Tool Routing | tool 名 + 参数草案 + 校验结果 |
| **Gate** | Confirmation | 已锁定批次 |
| **Execution** | Mock Executor | 结构化回执 |

Task Extraction 与 Project Update **只做抽取**，**不做** Field Extraction 的最终字段闭包；Field Extraction **不做** Tool 选择。

---

## 4. 协作顺序与依赖

单流水线，**非多 Agent**。逻辑顺序如下；Task Extraction 与 Project Update 可按批次内不同 **Actionable Slice** 并行产出多条候选，再逐条进入 Field Extraction。

```text
Recognition
  → Task Extraction（按切片类型准入）
  → Project Update（按切片类型准入）
  → Field Extraction（逐候选）
  → Tool Routing（逐候选）
  → Confirmation（批次级）
  → Mock Executor（批次内逐调用）
```

**下游：** Mock 回执由 **Workflow Sync** 写入 Tasks / Projects，[workflow.md](./workflow.md)。Sync 是持久化层，不是独立理解 Skill。

---

## 5. P0 Skills 规格

以下各 Skill 均采用统一模板：**Core Objective · Inputs · Decision Logic · Outputs · Constraints · Failure Modes · Evaluation Metrics · Upstream / Downstream**。

---

### 5.1 Recognition Skill

**Core Objective**  
判断文本是否含可执行价值，完成 **Actionable / Informational** 二分；对 Actionable 进行 **执行单元切片（Actionable Slice Segmentation）** 与 **二级分类（Todo / Project Update / Risk）**。

**Inputs**

- `inbox_batch`：原始文本、可选来源类型、批次 ID  
- 工程约束：最大长度、分块策略（若已应用）

**Decision Logic**

- **模型：** 语义判断 Actionable vs Informational；提议切片边界与二级标签；对模糊句给出置信度。  
- **规则：** 空输入拒绝进入 Actionable；超长仅处理允许窗口；二级标签集合封闭为 {Todo, Project Update, Risk}；**Risk 切片业务处理见 §2「Risk 归类与高亮」**，模型不得自创标签名。

**Outputs**

- `recognition_result`：Informational 区间引用（可选）  
- `actionable_slices[]`：每条含 `slice_id`、文本范围或句段引用、`secondary_class` ∈ {Todo, Project Update, Risk}、`confidence`；若 `secondary_class = Risk`，下游默认进入 Project Update 管线并须生成 **`risk_flag` / `risk_highlight`** 所需语义输入（由 Project Update + Field Extraction 落字段）

**Constraints**

- 每个 Actionable Slice 须可回溯原文连续片段或等价锚点。  
- Informational 默认 **不** 生成 Tool 候选。

**Failure Modes**

- 解析超时、模型拒答、输出不可解析 JSON  
- 零 Actionable Slice 但用户预期有任务 **Empty actionable**

**Evaluation Metrics**

- Actionable vs Informational 分类 F1  
- 误将 Informational 判为 Actionable 率（驱动误执行风险）  
- 二级分类准确率；切片边界与 Gold 对齐度（可抽样）

**P0 建议上线门槛（固定样本集，口径见 evaluation）**

- Actionable / Informational **F1 ≥ 0.85**；误将 Informational 判为 Actionable 的比率须低于评测基线并作为发布门禁之一。

**Upstream / Downstream**

- **Upstream：** Inbox 批次提交  
- **Downstream：** Task Extraction、Project Update **仅消费** `secondary_class` 匹配的切片（Risk 切片由 Project Update 消费，见 §2）

---

### 5.2 Task Extraction Skill

**Core Objective**  
从 **标记为 Todo（或按口径可归并为任务）的 Actionable Slice** 中生成 **任务候选项草案**。

**Inputs**

- `actionable_slice`（Todo 类）  
- 可选：同批次轻量上下文索引，**不得**引入未识别切片的全文复述替代证据

**Decision Logic**

- **模型：** 生成任务标题草案、责任人/截止等 **提议**（可为空）、证据句段引用。  
- **规则：** 输出不得超过单条候选上限；必须带 `evidence_ref`；**不调用** 最终必填字段闭包校验（交由 Field Extraction）。

**Outputs**

- `task_candidate_draft`：`draft_title`、`evidence_ref`、可选 `hint_owner` / `hint_due`（仅作 Field Extraction 输入提示，**非最终字段**）

**Constraints**

- **不负责** 最终字段标准化与 `missing` 闭包。  
- 无证据不得生成候选。

**Failure Modes**

- 空草案、证据引用越界、模型输出 schema 违例

**Evaluation Metrics**

- 任务级 Precision / Recall（相对标注集）  
- 证据对齐率（候选能否在原文中定位）

**P0 建议上线门槛**

- 任务级 **Precision ≥ 0.90**（相对标注集；Recall 与 F1 下限由 evaluation 同步定义）。

**Upstream / Downstream**

- **Upstream：** Recognition  
- **Downstream：** Field Extraction（必经）

---

### 5.3 Project Update Skill

**Core Objective**  
从 **Project Update / Risk 类 Actionable Slice** 提取 **项目状态变化**、风险、Blocker、Follow-up 等更新候选项草案。

**Inputs**

- `actionable_slice`（Project Update 或 Risk）  
- 同 Task Extraction 的上下文约束

**Decision Logic**

- **模型：** 结构化描述进展、风险、阻塞、后续动作；绑定证据。  
- **规则：** `secondary_class = Risk` 的切片与本 Skill 产出的含风险语义候选，均须落 **§2**：**`risk_flag` + `risk_highlight`**，并进入统一 Project Update → Field Extraction → `update_project_board` 路径。

**Outputs**

- `project_update_candidate_draft`：进展摘要草案、`risk` / `blocker` / `follow_up` 片段、`evidence_ref`；**`risk_flag` / `risk_highlight`**（按 §2 必填规则填充）

**Constraints**

- **不负责** 最终字段标准化与 Tool 选择。

**Failure Modes**

- 与 Task Extraction 类似；与任务候选 **语义重复** 时的去重策略在规则层定义并计入评测

**Evaluation Metrics**

- Project Update 相关准确率（相对标注）  
- Blocker / Follow-up 检出率与误报率

**P0 建议上线门槛**

- Project Update 相关 **准确率 ≥ 0.85**（相对标注集；与 Risk 归并样本子集须单独统计）。

**Upstream / Downstream**

- **Upstream：** Recognition  
- **Downstream：** Field Extraction

---

### 5.4 Field Extraction Skill

**Core Objective**  
将 **单条** `task_candidate_draft` 或 `project_update_candidate_draft` **标准化** 为符合路由前 Schema 的 **候选记录**：必填 / 可选、`missing` 策略、confidence、**source evidence**。

**Inputs**

- 单条候选草案 + `recognition_result` 中间接引用 + 用户预选项目（若有）

**Decision Logic**

- **模型：** 补全或修正标题、项目归属提议、可选字段提议；输出每条字段置信度。  
- **规则：** 必填缺省 → 显式 `missing`；**禁止** 为可选字段无依据填充；`project` 采用 **用户预选 + 模型推荐** 的合并规则；字段名与类型与 [tool_schema.md](./tool_schema.md) 对齐。

**Outputs**

- `normalized_candidate`：闭合字段集、`missing[]`、`confidence` 结构、`source_evidence` 与 `evidence_ref` 一致可验；**继承 `risk_flag` / `risk_highlight`**，可选 **`risk_severity`**（供 Confirmation 阈值判断，枚举由规则表封闭）

**Constraints**

- Task Extraction / Project Update **不得** 跳过本 Skill 进入 Routing（评测与实现须强制）。

**Failure Modes**

- Schema 校验失败、证据与字段不一致、置信度缺失

**Evaluation Metrics**

- Field Completeness（相对必填口径）  
- 幻觉字段率；低置信字段被用户修改率

**P0 建议上线门槛**

- **必填字段闭包达标率 ≥ 95%**（在已声明可选口径下）；**幻觉字段率**须低于 evaluation 设定红线。

**Upstream / Downstream**

- **Upstream：** Task Extraction 或 Project Update  
- **Downstream：** Tool Routing

---

### 5.5 Tool Routing Skill

**Core Objective**  
将 `normalized_candidate` **映射** 为 **唯一 Tool 名** 与 **参数草案**，并完成 **Route validation**（对 Tool Schema 的可行性校验）。

**Inputs**

- `normalized_candidate`  
- 封闭 Tool 清单：P0 `create_todo`、`update_project_board`；P1 扩展见 PRD

**Decision Logic**

- **模型（可选）：** 在规则允许的映射空间内提议 tool 与参数。  
- **规则：** 基于 `candidate.type` 与字段完备性的 **确定性路由表** 优先；参数必须符合 Schema；不满足 → **路由失败** 结构化错误，不进入确认批次。

**Outputs**

- `route_result`：`tool_name`、`arguments`（草案）、`validation_status` ∈ {ok, invalid}

**Constraints**

- **不得** 执行副作用；**不得** 绕过 Confirmation。

**Failure Modes**

- 类型与 Tool 不匹配、必填参数缺失、枚举越界

**Evaluation Metrics**

- Tool Routing Accuracy  
- 路由前可被规则拦截的错误占比

**P0 建议上线门槛**

- **Tool Routing Accuracy ≥ 0.95**（工具名 + 关键参数是否与 Gold 一致）。

**Upstream / Downstream**

- **Upstream：** Field Extraction  
- **Downstream：** Confirmation（仅 `validation_status=ok`）

---

### 5.6 Confirmation Skill

**Core Objective**  
在 Mock / 真实执行前，承载 **用户编辑、拒绝、批量确认** 与 **风险控制**：未确认调用不得下发执行层。

**Inputs**

- `route_result[]`（校验通过子集）  
- UI 状态：用户编辑后的字段终值、勾选集合

**Decision Logic**

- **规则为主：** 状态机 `proposed → edited → confirmed | rejected`；批量确认生成 **执行批次**；校验必填与用户显式接受 `missing` 的策略由 PRD 固定。  
- **模型不参与** 自动化通过。  
- **Risk：** 对 **§2** 定义的高风险条目，在确认界面 **强制展示额外风险提示**（只读）；可与 P1「通用澄清文案」并存，但 **不得** 自动拦截或自动确认。

**Outputs**

- `execution_batch`：有序 `confirmed_tool_calls[]`，每条含最终参数快照与用户操作审计引用（轻量）

**Constraints**

- 与 Mock Executor 之间 **无模型自动闸门**。

**Failure Modes**

- 用户取消批次、部分条目拒绝导致批次重构；校验失败停留待确认

**Evaluation Metrics**

- Acceptance Rate、Field Edit Rate、Zero-Edit Approval Rate  
- 确认后仍误执行率（配合 Mock 与 Sync）

**P0 建议上线门槛**

- **Zero-Edit Approval Rate ≥ 60%**（固定样本集上用户零编辑即确认的比例，低于则须优化上游字段与路由再发版）。

**Upstream / Downstream**

- **Upstream：** Tool Routing  
- **Downstream：** Mock Executor

---

### 5.7 Mock Executor

**Core Objective**  
在 MVP **模拟** Tool 执行：接受已确认调用，返回 **结构化回执** 与 **状态反馈**；契约与未来真实 **Tool Adapter** 对齐。

**Inputs**

- `execution_batch` 中的单条 `confirmed_tool_call`

**Decision Logic**

- **规则 / 代码：** 校验调用指纹与批次令牌；写入调用日志；生成成功 / 失败回执；**无 LLM**。  
- 延迟、失败注入策略可用于压测（可选）。

**Outputs**

- `execution_receipt`：`status`（pending / running / succeeded / failed）、业务摘要、错误码、时间戳；字段集合与真实 API 适配器一致

**Constraints**

- 不向外部 SaaS 发网；界面不得暗示已生产写入。

**Failure Modes**

- 内部异常、超时、重复提交检测触发拒绝

**Evaluation Metrics**

- Mock Execution Success Rate  
- 回执字段与 Schema 一致性

**P0 建议上线门槛**

- **Mock Execution Success Rate ≥ 99%**（排除刻意注入故障用例）；回执与 Schema **字段一致性 100%** 作为发布前自动化检查项。

**Upstream / Downstream**

- **Upstream：** Confirmation  
- **Downstream：** Workflow Sync（消费回执）

---

### P0 全局上线门槛（发布门禁）

在固定样本集与走查通过前提下，**同时**满足：

| 维度 | 建议阈值 |
|------|----------|
| **Wrong Execution Rate** | **≤ 2%**（用户已确认批次中，执行结果与 Gold 或严重错误定义不一致的比例） |
| 各 Skill 分项 | 不低于本节 **5.1–5.7** 对应建议门槛 |
| 口径 | 与 [evaluation.md](./evaluation.md) 一致；未达标则 **P0 不发版** 或仅灰度环境 |

---

## 6. 职责去重与反模式

| 反模式 | 纠正 |
|--------|------|
| Task Extraction 直接输出可执行 Tool 参数 | 必须经过 Field Extraction 与 Tool Routing |
| Field Extraction 决定 Tool 类型 | 仅标准化字段；Tool 由 Routing 决定 |
| Recognition 直接调用 Tool | 禁止；Informational 无执行路径 |
| Mock Executor 内嵌语义理解 | 禁止；仅执行与记录 |
| 用单一大 Prompt 覆盖 Recognition+Field+Routing | 禁止作为架构；实现可合并调用，**文档与评测仍按 Skill 切分** |

---

## 7. 真实 API 接入与接口稳定性

- **稳定面：** `normalized_candidate` → `route_result` → `confirmed_tool_call` → `execution_receipt` 字段名与必填集。  
- **可变面：** Mock Executor 替换为 `HttpToolAdapter`，保持相同输入输出契约；Skills 上游 **无需** 重写。  
- **新增 Tool：** 扩展 Tool Routing 规则表与 Schema，不推翻 Recognition / Field 分层。

---

## 8. P1 扩展（非 P0 架构变更）

- `generate_weekly_report_material`、`create_knowledge_card`：在 Tool Routing 增加映射条目；Confirmation 可支持「仅生成、不写 Tasks」的批次类型；仍经 Mock Executor 统一回执形态。  
- 轻量 **Review 文案**、**执行建议**：不得自动通过确认门，不计入 P0 Skill 闭环。

---

## 9. 相关文档

| 文档 | 用途 |
|------|------|
| [workflow.md](./workflow.md) | 端到端状态机与页面映射 |
| [PRD.md](./PRD.md) | 需求边界与优先级 |
| [evaluation.md](./evaluation.md) | 指标与样本 |

