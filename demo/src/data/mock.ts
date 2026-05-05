/**
 * Demo-only mock data. Replace with API adapters when wiring the real product.
 */

/** User Workspace 主导航（工作流） */
export type UserNavId =
  | 'inbox'
  | 'execution_center'
  | 'sync_results'
  | 'settings'

/** Admin Console 导航 */
export type AdminNavId =
  | 'evaluation'
  | 'run_history'
  | 'execution_logs'
  | 'tool_analytics'
  | 'error_review'
  | 'system_config'

export interface NavItem<T extends string = string> {
  id: T
  label: string
  badge?: number
}

/** 与界面「来源标签」一致 */
export type SourceTag = '群聊' | '会议纪要' | '文档'

export type CandidateKind = 'candidate_todo' | 'project_update' | 'risk'

export interface EvidenceBlock {
  sourceType: SourceTag
  excerpt: string
  fullQuote: string
  anchor: string
  context: string
  highlightPhrase: string
}

/** 次层展开：技术/评审向字段（默认折叠） */
export interface CandidateDetailExpand {
  fullAnchor: string
  missingDetail: string
  toolArguments: string
  schemaHint: string
}

export interface CandidateTemplate {
  id: string
  kind: CandidateKind
  title: string
  toolSuggestion: string
  confidence: number
  whyTrustworthy: string
  evidence: EvidenceBlock
  /** 外部承载平台（TaskFlow 仅调度，资产在对方系统） */
  targetPlatform: string
  missingFields: string[]
  detailExpand: CandidateDetailExpand
}

/** Tool → 外部系统（产品叙事：调度层） */
export const toolDispatchCopy: Record<
  string,
  { line: string; shortTarget: string }
> = {
  create_todo: {
    line: 'create_todo → 飞书任务',
    shortTarget: '飞书任务',
  },
  update_project_board: {
    line: 'update_project_board → Linear / 飞书项目',
    shortTarget: 'Linear / 飞书项目',
  },
  create_knowledge_card: {
    line: 'create_knowledge_card → Notion',
    shortTarget: 'Notion',
  },
  generate_weekly_report_material: {
    line: 'generate_weekly_report_material → 飞书文档',
    shortTarget: '飞书文档',
  },
}

export function dispatchLineForTool(toolName: string): string {
  return toolDispatchCopy[toolName]?.line ?? `${toolName} → 外部系统`
}

/** 用户端展示：不含英文工具名 */
export function dispatchLabelZh(toolName: string): string {
  const m: Record<string, string> = {
    create_todo: '待办 → 飞书任务',
    update_project_board: '项目更新 → Linear / 飞书项目',
    create_knowledge_card: '知识卡片 → Notion',
    generate_weekly_report_material: '周报素材 → 飞书文档',
  }
  return m[toolName] ?? '外部系统'
}

export function shortTargetForTool(toolName: string): string {
  return toolDispatchCopy[toolName]?.shortTarget ?? '外部系统'
}

export const mockWorkspace = {
  name: 'Acme · 产品运营',
  env: 'Demo',
} as const

export const mockUserNavItems: NavItem<UserNavId>[] = [
  { id: 'inbox', label: '收件箱' },
  { id: 'execution_center', label: '执行中心' },
  { id: 'sync_results', label: '同步结果' },
  { id: 'settings', label: '设置' },
]

export const mockAdminNavItems: NavItem<AdminNavId>[] = [
  { id: 'evaluation', label: '评测总览' },
  { id: 'run_history', label: '运行历史' },
  { id: 'execution_logs', label: '执行日志' },
  { id: 'tool_analytics', label: '工具分析' },
  { id: 'error_review', label: '错误复盘' },
  { id: 'system_config', label: '系统配置' },
]

/** 默认选中的来源标签（与 Inbox 初始状态一致） */
export const defaultDemoSourceTag: SourceTag = '群聊'

/** 「加载示例」按当前来源标签只填入对应一段 */
export const demoFixtureTexts: Record<SourceTag, string> = {
  群聊: `【飞书群 · 增长】14:32
小美：周五前要把埋点事件表对齐，验收通过再合主干，不然发布窗口会被卡住。
阿强：收到，我这边今天内出一版对齐表。`,
  会议纪要: `【会议纪要 · CS 周会】昨天 17:00
纪要摘录：关键交付确认推迟一周。需要在项目看板标记风险，并 @ 研发负责人同步预期，避免客户侧口径不一致。`,
  文档: `【文档 · Notion】
本周对外口径草稿已起头；仍需补齐数据截图与引用来源后再发 PR 审核。`,
}

export const mockCandidateTemplates: CandidateTemplate[] = [
  {
    id: 'c1',
    kind: 'candidate_todo',
    title: '下周发布前补齐埋点验收',
    toolSuggestion: 'create_todo',
    confidence: 0.86,
    whyTrustworthy: '动作、截止与语境较完整。',
    targetPlatform: '飞书任务（飞书 Todo）',
    missingFields: ['负责人', '截止时间'],
    evidence: {
      sourceType: '群聊',
      excerpt: '周五前对齐埋点表，验收通过后合主干',
      fullQuote:
        '周五前要把埋点事件表对齐，验收通过再合主干，不然发布窗口会被卡住。',
      anchor: '群聊 · Msg 附近 #1',
      context: '增长群 · 今日 14:32 线程',
      highlightPhrase:
        '周五前要把埋点事件表对齐，验收通过再合主干，不然发布窗口会被卡住。',
    },
    detailExpand: {
      fullAnchor: 'source=feishu_im · thread=growth_daily · msg_offset=12-18',
      missingDetail:
        'owner_id 未在原文显式出现；due_at 仅有「周五前」需人工补全为具体日期。',
      toolArguments: `{
  "title": "下周发布前补齐埋点验收",
  "due_at": null,
  "owner_id": null,
  "source_evidence": "…"
}`,
      schemaHint: 'create_todo@v1 · 必填：title；建议：due_at、owner_id',
    },
  },
  {
    id: 'c2',
    kind: 'project_update',
    title: '关键交付推迟一周：看板标记风险并同步负责人',
    toolSuggestion: 'update_project_board',
    confidence: 0.79,
    whyTrustworthy: '状态变更指向明确，但字段需你确认。',
    targetPlatform: 'Linear / 飞书项目',
    missingFields: ['项目 ID', '责任角色'],
    evidence: {
      sourceType: '会议纪要',
      excerpt: '交付推迟一周；看板标风险并 @ 负责人',
      fullQuote:
        '关键交付确认推迟一周。需要在项目看板标记风险，并 @ 研发负责人同步预期，避免客户侧口径不一致。',
      anchor: '纪要 · 段落 B',
      context: 'CS 周会 · 昨日 17:00',
      highlightPhrase:
        '关键交付确认推迟一周。需要在项目看板标记风险，并 @ 研发负责人同步预期',
    },
    detailExpand: {
      fullAnchor: 'source=meeting_notes · doc=cs_weekly · block=B-3',
      missingDetail:
        'project_id 需从看板映射；column 默认 Risk，需确认是否写入「备注」字段。',
      toolArguments: `{
  "project_id": null,
  "column": "risk",
  "risk_flag": true,
  "note": "关键交付推迟一周…"
}`,
      schemaHint: 'update_project_board@v1 · 必填：project_id',
    },
  },
  {
    id: 'c3',
    kind: 'risk',
    title: '客户侧口径不一致风险（交付延期）',
    toolSuggestion: 'update_project_board',
    confidence: 0.74,
    whyTrustworthy: '风险表述强相关，建议必核证据后再写入。',
    targetPlatform: 'Linear / 飞书项目',
    missingFields: ['影响范围', '项目 ID'],
    evidence: {
      sourceType: '会议纪要',
      excerpt: '需避免客户侧口径不一致',
      fullQuote:
        '需要在项目看板标记风险，并 @ 研发负责人同步预期，避免客户侧口径不一致。',
      anchor: '纪要 · 风险句',
      context: 'CS 周会 · 客户沟通窗口前',
      highlightPhrase: '避免客户侧口径不一致',
    },
    detailExpand: {
      fullAnchor: 'source=meeting_notes · doc=cs_weekly · block=B-5',
      missingDetail:
        '风险等级未量化；建议补充影响客户与时间点后再同步对外口径。',
      toolArguments: `{
  "project_id": null,
  "risk_flag": true,
  "note": "客户口径风险…"
}`,
      schemaHint: 'update_project_board@v1 · risk 写入需二次确认',
    },
  },
  {
    id: 'c4',
    kind: 'candidate_todo',
    title: '对外口径草稿：补齐截图与引用后再走 PR 审核',
    toolSuggestion: 'create_todo',
    confidence: 0.81,
    whyTrustworthy: '与文档中「补齐素材再走审核」动作一致。',
    targetPlatform: '飞书任务（飞书 Todo）',
    missingFields: ['负责人', 'PR 链接'],
    evidence: {
      sourceType: '文档',
      excerpt: '补齐数据截图与引用来源后再发 PR 审核',
      fullQuote:
        '本周对外口径草稿已起头；仍需补齐数据截图与引用来源后再发 PR 审核。',
      anchor: '文档 · Notion 摘录',
      context: '对外口径 · Notion 草稿页',
      highlightPhrase:
        '仍需补齐数据截图与引用来源后再发 PR 审核',
    },
    detailExpand: {
      fullAnchor: 'source=notion · page=ext_comms_draft · block=intro',
      missingDetail:
        'pr_url 未出现；建议关联具体 PR 或审核单后再写入工具参数。',
      toolArguments: `{
  "title": "对外口径草稿：补齐截图与引用后再走 PR 审核",
  "due_at": null,
  "owner_id": null,
  "source_evidence": "…"
}`,
      schemaHint: 'create_todo@v1 · 必填：title；建议：due_at、owner_id',
    },
  },
]

export const mockNonTaskFilterNote =
  '已过滤 1 条非可执行噪声（短确认/寒暄），不进入本表。'

export const mockNonTaskFilterNoteByTag: Record<SourceTag, string> = {
  群聊: mockNonTaskFilterNote,
  会议纪要: mockNonTaskFilterNote,
  文档: '文档类输入以段落抽取为主；本段未检出纯寒暄噪声。',
}

export interface SyncTargetMock {
  id: string
  name: string
  kind: 'todo' | 'board' | 'doc' | 'knowledge'
  status: 'connected' | 'readonly' | 'degraded'
  detail: string
}

export const mockSyncTargets: SyncTargetMock[] = [
  {
    id: 't1',
    name: '飞书任务',
    kind: 'todo',
    status: 'connected',
    detail: '待办默认写入此处（演示）',
  },
  {
    id: 't2',
    name: 'Linear / 飞书项目',
    kind: 'board',
    status: 'connected',
    detail: '项目看板与风险同步（演示）',
  },
  {
    id: 't3',
    name: 'Notion',
    kind: 'knowledge',
    status: 'readonly',
    detail: '知识卡片类写入（演示 · 只读）',
  },
  {
    id: 't4',
    name: '飞书文档',
    kind: 'doc',
    status: 'connected',
    detail: '周报等文档类写入（演示）',
  },
]

export interface RunHistorySeed {
  id: string
  at: string
  batchId: string
  items: number
  summary: string
}

export const mockRunHistorySeed: RunHistorySeed[] = [
  {
    id: 'seed-1',
    at: '2026-05-02 10:12',
    batchId: 'batch_mock_1714612320000',
    items: 2,
    summary: '待办写入 1 条、项目看板更新 1 条，已同步至外部目标（演示）',
  },
]

/** Admin · 评测摘要（业务口径 + 技术口径） */
export const mockEvaluationSummary = {
  plain: {
    routingOk: '抽样验证中，约 95% 的意图—工具路由与标注一致',
    zeroEdit: '约 92% 的确认批次无需人工改写即可下发',
    wrongExec: '近周期误执行：0 条（演示样本）',
  },
  technical: {
    toolRoutingAccuracy: 0.95,
    zeroEditApprovalRate: 0.92,
    wrongExecutionRate: 0,
    precision: 0.88,
    recall: 0.84,
  },
} as const

export interface MockLogRow {
  id: string
  at: string
  level: 'info' | 'warn' | 'error'
  batchId: string | null
  message: string
}

export const mockExecutionLogs: MockLogRow[] = [
  {
    id: 'l1',
    at: '2026-05-05 09:41:02',
    level: 'info',
    batchId: 'batch_mock_1714612320000',
    message: '执行器：待办写入成功，同步目标为飞书任务（演示）',
  },
  {
    id: 'l2',
    at: '2026-05-05 09:41:03',
    level: 'info',
    batchId: 'batch_mock_1714612320000',
    message: '执行器：项目看板更新成功，同步目标为 Linear（演示）',
  },
  {
    id: 'l3',
    at: '2026-05-05 09:12:18',
    level: 'warn',
    batchId: null,
    message: '路由：样本 stress_03 校验未通过（风险类），已拦截',
  },
]

export interface MockToolStat {
  tool: string
  calls: number
  successRate: number
  avgLatencyMs: number
}

export const mockToolAnalytics: MockToolStat[] = [
  { tool: 'create_todo', calls: 128, successRate: 0.97, avgLatencyMs: 420 },
  { tool: 'update_project_board', calls: 64, successRate: 0.94, avgLatencyMs: 510 },
  { tool: 'generate_weekly_report_material', calls: 12, successRate: 1, avgLatencyMs: 890 },
  { tool: 'create_knowledge_card', calls: 8, successRate: 1, avgLatencyMs: 650 },
]

export interface MockErrorRow {
  id: string
  batchId: string
  errorCode: string
  handlingClass: string
  tool: string
  summary: string
}

export const mockErrorReview: MockErrorRow[] = [
  {
    id: 'e1',
    batchId: 'batch_mock_stress_01',
    errorCode: '校验未通过',
    handlingClass: '需用户处理',
    tool: 'update_project_board',
    summary: '缺少项目标识，已阻断写入',
  },
]

export interface MockGoldRow {
  id: string
  tool: string
  goldTitle: string
  predictionTitle: string
  match: boolean
}

export const mockGoldVsPrediction: MockGoldRow[] = [
  {
    id: 'g1',
    tool: 'create_todo',
    goldTitle: '下周发布前补齐埋点验收',
    predictionTitle: '下周发布前补齐埋点验收',
    match: true,
  },
  {
    id: 'g2',
    tool: 'update_project_board',
    goldTitle: '关键交付推迟一周：看板标记风险',
    predictionTitle: '关键交付推迟一周：看板标记风险并同步负责人',
    match: false,
  },
]

export type ExecutionStepStatus =
  | 'pending'
  | 'running'
  | 'done'
  | 'error'

export interface ExecutionStep {
  id: string
  label: string
  status: ExecutionStepStatus
  detail?: string
}
