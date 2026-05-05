import type { ExecutionStep } from '../data/mock'

export type FlowStage =
  | 'await_input'
  | 'parsed'
  | 'ready_to_confirm'
  | 'executing'
  | 'completed'

interface DeriveArgs {
  stage: FlowStage
  batchSize: number
  candidateCount: number
  executionBatchId: string | null
  executionReceipt: string | null
}

export function deriveExecutionSteps({
  stage,
  batchSize,
  candidateCount,
  executionBatchId,
  executionReceipt,
}: DeriveArgs): ExecutionStep[] {
  const idle: ExecutionStep[] = [
    {
      id: 's1',
      label: '理解原文',
      status: 'pending',
      detail: '粘贴内容后点「开始解析」',
    },
    {
      id: 's2',
      label: '匹配写入方式',
      status: 'pending',
    },
    {
      id: 's3',
      label: '确认',
      status: 'pending',
    },
    {
      id: 's4',
      label: '模拟执行',
      status: 'pending',
    },
    {
      id: 's5',
      label: '同步结果',
      status: 'pending',
    },
  ]

  if (stage === 'await_input') return idle

  if (stage === 'parsed') {
    return [
      {
        id: 's1',
        label: '理解原文',
        status: 'done',
        detail: `解析得到 ${candidateCount} 条可执行项`,
      },
      {
        id: 's2',
        label: '匹配写入方式',
        status: 'done',
        detail: '每条已建议写入目标',
      },
      {
        id: 's3',
        label: '确认',
        status: 'running',
        detail: '表格中已无条目，可重新解析或换一段原文',
      },
      { id: 's4', label: '模拟执行', status: 'pending' },
      { id: 's5', label: '同步结果', status: 'pending' },
    ]
  }

  if (stage === 'ready_to_confirm') {
    return [
      {
        id: 's1',
        label: '理解原文',
        status: 'done',
        detail: `解析得到 ${candidateCount} 条可执行项`,
      },
      {
        id: 's2',
        label: '匹配写入方式',
        status: 'done',
        detail: '每条已建议写入目标',
      },
      {
        id: 's3',
        label: '确认',
        status: 'running',
        detail: `共 ${batchSize} 条 · 点右侧「确认并执行」`,
      },
      { id: 's4', label: '模拟执行', status: 'pending' },
      { id: 's5', label: '同步结果', status: 'pending' },
    ]
  }

  if (stage === 'executing') {
    return [
      {
        id: 's1',
        label: '理解原文',
        status: 'done',
        detail: `解析得到 ${candidateCount} 条可执行项`,
      },
      {
        id: 's2',
        label: '匹配写入方式',
        status: 'done',
        detail: '每条已建议写入目标',
      },
      {
        id: 's3',
        label: '确认',
        status: 'done',
        detail: '已确认',
      },
      {
        id: 's4',
        label: '模拟执行',
        status: 'running',
        detail: executionBatchId
          ? `批次：${executionBatchId}`
          : '处理中…',
      },
      { id: 's5', label: '同步结果', status: 'pending' },
    ]
  }

  return [
    {
      id: 's1',
      label: '理解原文',
      status: 'done',
      detail: `解析得到 ${candidateCount} 条可执行项`,
    },
    {
      id: 's2',
      label: '匹配写入方式',
      status: 'done',
      detail: '每条已建议写入目标',
    },
    {
      id: 's3',
      label: '确认',
      status: 'done',
      detail: '已确认',
    },
    {
      id: 's4',
      label: '模拟执行',
      status: 'done',
      detail: executionReceipt ?? '演示回执已生成',
    },
    {
      id: 's5',
      label: '同步结果',
      status: 'done',
      detail: '已推送到外部目标（演示）',
    },
  ]
}

export function flowBanner(stage: FlowStage): string {
  switch (stage) {
    case 'await_input':
      return '粘贴原文后点「开始解析」，中间可展开「详情」核对。'
    case 'parsed':
      return '当前表格无待执行项；可丢弃后重新解析，或换一段原文。'
    case 'ready_to_confirm':
      return '未丢弃的条目将一并执行；满意后点「确认并执行」。'
    case 'executing':
      return '正在处理本批次（演示）。'
    case 'completed':
      return '本批次已完成。可在「同步结果」查看连接状态。'
    default:
      return ''
  }
}
