import { Case, CaseType } from '../types';

const caseTypeLabelMap: Record<CaseType, string> = {
  openclaw_app: 'OpenClaw应用案例',
  tool_app: '小工具应用案例',
  agent_app: 'Agent案例',
  rpa_app: 'RPA案例',
  dashboard_app: '看板案例',
};

const sanitizeSegment = (value: string) =>
  (value || 'unknown').replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, '').trim() || 'unknown';

export const getCaseTypeLabel = (caseType?: CaseType) => caseTypeLabelMap[caseType || 'openclaw_app'];

export const buildExportFileBaseName = (caseData: Case) => {
  const date = new Date(caseData.lastModified || Date.now()).toISOString().slice(0, 10);
  return [
    getCaseTypeLabel(caseData.caseType),
    caseData.organization || '未分配组织',
    caseData.author || '未命名作者',
    caseData.title || '未命名案例',
    date,
  ].map(sanitizeSegment).join('_');
};
