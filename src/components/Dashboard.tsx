import React from 'react';
import { motion } from 'motion/react';
import { Plus, Search, Filter, Database, Trash2, Edit3, Eye, FileText, CheckCircle, Clock, Upload, Users, Heart, Trophy, BarChart3, Globe2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Case, CaseType } from '../types';
import { User } from '../services/apiService';
import { DashboardModule } from './DashboardModule';

interface DashboardProps {
  cases: Case[];
  user: User | null;
  appName: string;
  appDescription: string;
  pageTitle: string;
  pageSubtitle: string;
  emptyTitle: string;
  emptySubtitle: string;
  showOverviewInsights?: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onNewCase: () => void;
  onEditCase: (c: Case) => void;
  onViewCanvas: (c: Case) => void;
  onDeleteCase: (id: string) => void;
  onLikeCase: (id: string) => void;
  onLogin: () => void;
  onLogout: () => void;
  onOpenDbConfig: () => void;
  onOpenUserManagement: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  cases,
  user,
  appName,
  appDescription,
  pageTitle,
  pageSubtitle,
  emptyTitle,
  emptySubtitle,
  showOverviewInsights = false,
  searchQuery,
  setSearchQuery,
  onNewCase,
  onEditCase,
  onViewCanvas,
  onDeleteCase,
  onLikeCase,
  onLogin,
  onLogout,
  onOpenDbConfig,
  onOpenUserManagement
}) => {
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'published' | 'draft'>('all');
  const [organizationFilter, setOrganizationFilter] = React.useState<'all' | string>('all');
  const [creatorFilter, setCreatorFilter] = React.useState<'all' | string>('all');
  const [visibilityFilter, setVisibilityFilter] = React.useState<'all' | 'public' | 'private'>('all');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(50);
  const [jumpPageInput, setJumpPageInput] = React.useState('1');

  const caseTypeLabelMap: Record<CaseType, string> = {
    openclaw_app: 'OpenClaw应用案例',
    tool_app: '小工具应用案例',
    agent_app: 'Agent案例',
    rpa_app: 'RPA案例',
    dashboard_app: '看板案例',
  };

  const creators = React.useMemo(() => {
    const set = new Set<string>();
    cases.forEach((c) => set.add(c.author?.trim() || '未命名用户'));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
  }, [cases]);

  const organizationOptions = React.useMemo(() => {
    const set = new Set<string>();
    cases.forEach((c) => set.add(c.organization));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
  }, [cases]);

  const filteredCases = React.useMemo(() => {
    return cases.filter(c => {
      const query = searchQuery.toLowerCase();
      const matchQuery =
        c.title.toLowerCase().includes(query) ||
        c.organization.toLowerCase().includes(query) ||
        (c.author || '').toLowerCase().includes(query);

      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchOrg = organizationFilter === 'all' || c.organization === organizationFilter;
      const creatorName = c.author?.trim() || '未命名用户';
      const matchCreator = creatorFilter === 'all' || creatorName === creatorFilter;
      const matchVisibility =
        visibilityFilter === 'all' ||
        (visibilityFilter === 'public' ? c.isPublic === true : c.isPublic !== true);

      return matchQuery && matchStatus && matchOrg && matchCreator && matchVisibility;
    });
  }, [cases, searchQuery, statusFilter, organizationFilter, creatorFilter, visibilityFilter]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, organizationFilter, creatorFilter, visibilityFilter]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredCases.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pagedCases = React.useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredCases.slice(start, start + pageSize);
  }, [filteredCases, safeCurrentPage, pageSize]);

  React.useEffect(() => {
    setJumpPageInput(String(safeCurrentPage));
  }, [safeCurrentPage]);

  const pageNumbers = React.useMemo(() => {
    const windowSize = 5;
    const half = Math.floor(windowSize / 2);
    let start = Math.max(1, safeCurrentPage - half);
    let end = Math.min(totalPages, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);
    const pages: number[] = [];
    for (let p = start; p <= end; p += 1) pages.push(p);
    return pages;
  }, [safeCurrentPage, totalPages]);

  const orgStats = React.useMemo(() => {
    const statsMap = new Map<string, { count: number; published: number; publicCount: number; likes: number }>();
    cases.forEach((c) => {
      const current = statsMap.get(c.organization) || { count: 0, published: 0, publicCount: 0, likes: 0 };
      current.count += 1;
      if (c.status === 'published') current.published += 1;
      if (c.isPublic === true) current.publicCount += 1;
      current.likes += c.likeCount ?? 0;
      statsMap.set(c.organization, current);
    });
    return Array.from(statsMap.entries())
      .map(([organization, stat]) => ({
        organization,
        ...stat,
        publishRate: stat.count > 0 ? Math.round((stat.published / stat.count) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count || b.likes - a.likes);
  }, [cases]);

  const headquartersStats = React.useMemo(() => {
    const headquarters = cases.filter((c) => c.organization === '财服总部');
    const regions = cases.filter((c) => c.organization !== '财服总部');
    return {
      headquartersCount: headquarters.length,
      headquartersPublished: headquarters.filter((c) => c.status === 'published').length,
      regionCount: regions.length,
      regionPublished: regions.filter((c) => c.status === 'published').length,
    };
  }, [cases]);

  const caseTypeStats = React.useMemo(() => {
    const orderedTypes: CaseType[] = ['openclaw_app', 'tool_app', 'agent_app', 'rpa_app', 'dashboard_app'];
    return orderedTypes.map((type) => {
      const typeCases = cases.filter((c) => (c.caseType || 'openclaw_app') === type);
      const published = typeCases.filter((c) => c.status === 'published').length;
      const publicCount = typeCases.filter((c) => c.isPublic === true).length;
      const likes = typeCases.reduce((sum, c) => sum + (c.likeCount ?? 0), 0);
      const percentage = cases.length > 0 ? Math.round((typeCases.length / cases.length) * 100) : 0;
      return {
        type,
        label: caseTypeLabelMap[type],
        count: typeCases.length,
        published,
        publicCount,
        likes,
        percentage,
        likeDensity: typeCases.length > 0 ? Number((likes / typeCases.length).toFixed(1)) : 0,
      };
    });
  }, [cases]);

  const caseTypeByOrganization = React.useMemo(() => {
    return orgStats.map((org) => ({
      organization: org.organization,
      values: caseTypeStats.map((typeItem) => {
        const count = cases.filter(
          (c) => c.organization === org.organization && (c.caseType || 'openclaw_app') === typeItem.type
        ).length;
        return {
          type: typeItem.type,
          label: typeItem.label,
          count,
        };
      }),
    }));
  }, [cases, orgStats, caseTypeStats]);

  const handleExportExcel = React.useCallback(() => {
    const joinLines = (arr?: string[]) => (arr || []).filter(Boolean).join('\n');
    const fmtSteps = (steps?: { title: string; description: string }[]) =>
      (steps || []).map((s, i) => `步骤${i + 1}: ${s.title || ''}${s.description ? ' — ' + s.description : ''}`).join('\n');
    const fmtMetrics = (metrics?: { label: string; value: string; subtext: string }[]) =>
      (metrics || []).map((m) => `${m.label}: ${m.value}${m.subtext ? '（' + m.subtext + '）' : ''}`).join('\n');
    const fmtRoadmap = (items?: { task: string; content: string; date: string }[]) =>
      (items || []).map((r) => `[${r.date}] ${r.task}: ${r.content}`).join('\n');

    const rows = filteredCases.map((c) => ({
      标题: c.title,
      副标题: c.subtitle || '',
      案例类型: caseTypeLabelMap[c.caseType || 'openclaw_app'],
      组织: c.organization,
      团队: c.team || '',
      创建人: c.author?.trim() || '未命名用户',
      UM号: c.umNumber || '',
      状态: c.status === 'published' ? '已发布' : '草稿',
      公开性: c.isPublic === true ? '公开' : '私密',
      点赞数: c.likeCount ?? 0,
      版本: (c.version ?? 0).toFixed(1),
      更新时间: new Date(c.lastModified ?? Date.now()).toLocaleString(),
      业务背景: c.challenges?.background || '',
      痛点: joinLines(c.challenges?.painPoints),
      目标: c.challenges?.objectives || '',
      实施步骤: fmtSteps(c.implementation?.steps),
      效果指标: fmtMetrics(c.businessValue?.metrics),
      效果备注: c.businessValue?.footerNote || '',
      未来规划: fmtRoadmap(c.roadmap?.items),
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);

    const colWidths = [
      28, 20, 10, 10, 10, 10, 10, 6, 6, 6, 6, 18,
      40, 30, 30, 50, 40, 20, 40,
    ];
    worksheet['!cols'] = colWidths.map((w) => ({ wch: w }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '案例列表');
    const normalize = (v: string) =>
      v.replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, '').slice(0, 24) || 'all';
    const filename = [
      '案例列表',
      `状态-${statusFilter}`,
      `组织-${normalize(organizationFilter)}`,
      `创建人-${normalize(creatorFilter)}`,
      `可见性-${visibilityFilter}`,
      `关键词-${normalize(searchQuery || 'all')}`,
      new Date().toISOString().slice(0, 10),
    ].join('_');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  }, [filteredCases, statusFilter, organizationFilter, creatorFilter, visibilityFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-neutral-50/50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/20">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-neutral-400 font-bold text-[10px] uppercase tracking-[0.2em]">{appName || '案例资产库'}</p>
              <h1 className="text-3xl font-black text-neutral-900 tracking-tight">{pageTitle}</h1>
              <p className="text-neutral-500 text-sm mt-1">{pageSubtitle || appDescription || 'Case Asset Repository'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user?.role === 'admin' && (
              <button
                onClick={onOpenDbConfig}
                className="p-3 bg-white text-neutral-400 rounded-xl hover:text-brand-500 hover:shadow-sm transition-all border border-neutral-200"
                title="数据库配置"
              >
                <Database className="w-5 h-5" />
              </button>
            )}
            {user?.role === 'admin' && (
              <button
                onClick={onOpenUserManagement}
                className="p-3 bg-white text-neutral-400 rounded-xl hover:text-brand-500 hover:shadow-sm transition-all border border-neutral-200"
                title="用户管理"
              >
                <Users className="w-5 h-5" />
              </button>
            )}
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 px-3 py-1.5 bg-white border border-neutral-200 rounded-2xl shadow-sm">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-8 h-8 rounded-lg object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-xs">
                      {user.displayName.charAt(0)}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-neutral-900 leading-tight">{user.displayName}</span>
                    <button onClick={onLogout} className="text-[10px] text-neutral-400 hover:text-red-500 text-left font-bold uppercase tracking-wider">退出登录</button>
                  </div>
                </div>
                <button 
                  onClick={onNewCase}
                  className="btn-primary"
                >
                  <Plus className="w-5 h-5" />
                  新建案例
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={onLogin}
                  className="btn-secondary"
                >
                  <Upload className="w-5 h-5 text-brand-500" />
                  登录以开始
                </button>
              </div>
            )}
          </div>
        </header>

        {showOverviewInsights && (
          <>
            <DashboardModule
              title="平台分析"
              subtitle="全平台评价指标、总部与地区分布以及组织排名"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="card-modern p-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">总案例数</p>
                    <BarChart3 className="w-5 h-5 text-brand-500" />
                  </div>
                  <p className="text-3xl font-black text-neutral-900">{cases.length}</p>
                </div>
                <div className="card-modern p-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">公开案例</p>
                    <Globe2 className="w-5 h-5 text-brand-500" />
                  </div>
                  <p className="text-3xl font-black text-neutral-900">{cases.filter(c => c.isPublic === true).length}</p>
                </div>
                <div className="card-modern p-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">累计点赞</p>
                    <Heart className="w-5 h-5 text-pink-500" />
                  </div>
                  <p className="text-3xl font-black text-neutral-900">{cases.reduce((sum, c) => sum + (c.likeCount ?? 0), 0)}</p>
                </div>
                <div className="card-modern p-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">总部占比</p>
                    <Trophy className="w-5 h-5 text-amber-500" />
                  </div>
                  <p className="text-3xl font-black text-neutral-900">
                    {cases.length > 0 ? `${Math.round((headquartersStats.headquartersCount / cases.length) * 100)}%` : '0%'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="card-modern p-6">
                  <p className="text-sm font-bold text-neutral-900 mb-4">总部与地区分布</p>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-500">财服总部案例</span>
                      <span className="text-lg font-black text-brand-600">{headquartersStats.headquartersCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-500">总部已发布</span>
                      <span className="text-lg font-black text-neutral-900">{headquartersStats.headquartersPublished}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-500">地区案例</span>
                      <span className="text-lg font-black text-brand-600">{headquartersStats.regionCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-500">地区已发布</span>
                      <span className="text-lg font-black text-neutral-900">{headquartersStats.regionPublished}</span>
                    </div>
                  </div>
                </div>

                <div className="card-modern p-6">
                  <p className="text-sm font-bold text-neutral-900 mb-4">组织案例数排名</p>
                  <div className="space-y-3">
                    {orgStats.slice(0, 6).map((item, index) => (
                      <div key={item.organization} className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-xs font-black">{index + 1}</span>
                          <span className="text-sm font-semibold text-neutral-700">{item.organization}</span>
                        </div>
                        <span className="text-lg font-black text-neutral-900">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-modern p-6">
                  <p className="text-sm font-bold text-neutral-900 mb-4">组织发布率排名</p>
                  <div className="space-y-3">
                    {[...orgStats].sort((a, b) => b.publishRate - a.publishRate || b.count - a.count).slice(0, 6).map((item, index) => (
                      <div key={item.organization} className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-xs font-black">{index + 1}</span>
                          <span className="text-sm font-semibold text-neutral-700">{item.organization}</span>
                        </div>
                        <span className="text-lg font-black text-neutral-900">{item.publishRate}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DashboardModule>

            <div className="mb-12" />

            <DashboardModule
              title="案例类型结构"
              subtitle="从 OpenClaw、工具、Agent、RPA、看板五类案例观察平台结构占比"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
                {caseTypeStats.map((item) => (
                  <div key={item.type} className="card-modern p-5">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">{item.label}</p>
                    <div className="flex items-end justify-between gap-3 mb-3">
                      <p className="text-3xl font-black text-neutral-900">{item.count}</p>
                      <span className="text-sm font-black text-brand-600">{item.percentage}%</span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-orange-400 to-brand-500"
                          style={{ width: `${Math.max(item.percentage, item.count > 0 ? 8 : 0)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-neutral-500">
                        <span>已发布 {item.published} / 公开 {item.publicCount}</span>
                        <span>点赞密度 {item.likeDensity}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card-modern p-6">
                  <p className="text-sm font-bold text-neutral-900 mb-4">类型占比排名</p>
                  <div className="space-y-3">
                    {[...caseTypeStats].sort((a, b) => b.count - a.count || b.likes - a.likes).map((item, index) => (
                      <div key={item.type} className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-xs font-black">{index + 1}</span>
                          <div>
                            <p className="text-sm font-semibold text-neutral-800">{item.label}</p>
                            <p className="text-[11px] text-neutral-400">案例数 {item.count} / 占比 {item.percentage}%</p>
                          </div>
                        </div>
                        <span className="text-lg font-black text-neutral-900">{item.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-modern p-6">
                  <p className="text-sm font-bold text-neutral-900 mb-4">类型成熟度观察</p>
                  <div className="space-y-3">
                    {[...caseTypeStats].sort((a, b) => b.published - a.published || b.count - a.count).map((item) => (
                      <div key={`${item.type}-maturity`} className="rounded-xl bg-neutral-50 px-4 py-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-neutral-800">{item.label}</span>
                          <span className="text-xs font-bold text-neutral-500">
                            发布率 {item.count > 0 ? Math.round((item.published / item.count) * 100) : 0}% / 公开率 {item.count > 0 ? Math.round((item.publicCount / item.count) * 100) : 0}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                            style={{ width: `${item.count > 0 ? Math.round((item.published / item.count) * 100) : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DashboardModule>

            <div className="mb-12" />

            <DashboardModule
              title="组织与类型分布"
              subtitle="查看不同组织在五类案例上的分布情况，辅助判断推广方向"
            >
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-neutral-50/70">
                      <th className="px-4 py-3 text-left text-[10px] font-black text-neutral-400 uppercase tracking-wider">组织</th>
                      {caseTypeStats.map((item) => (
                        <th key={`head-${item.type}`} className="px-4 py-3 text-left text-[10px] font-black text-neutral-400 uppercase tracking-wider">
                          {item.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {caseTypeByOrganization.map((row) => (
                      <tr key={row.organization} className="hover:bg-neutral-50/60 transition-colors">
                        <td className="px-4 py-3 text-sm font-bold text-neutral-800">{row.organization}</td>
                        {row.values.map((cell) => (
                          <td key={`${row.organization}-${cell.type}`} className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-black text-neutral-900">{cell.count}</span>
                              <div className="h-2 flex-1 min-w-[72px] rounded-full bg-neutral-100 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-orange-300 to-brand-500"
                                  style={{ width: `${Math.max(
                                    caseTypeStats.find((item) => item.type === cell.type)?.count
                                      ? Math.round((cell.count / (caseTypeStats.find((item) => item.type === cell.type)?.count || 1)) * 100)
                                      : 0,
                                    cell.count > 0 ? 10 : 0
                                  )}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DashboardModule>

            <div className="mb-12" />
          </>
        )}

        <DashboardModule
          title={showOverviewInsights ? "总体概览" : "模块概览"}
          subtitle={showOverviewInsights ? "补充展示平台状态指标，避免与平台分析重复" : `当前模块为「${pageTitle}」，功能与交互保持一致`}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card-modern p-8 group hover:border-brand-200 transition-all">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{showOverviewInsights ? '已发布率' : '总案例数'}</p>
                <div className="w-10 h-10 bg-neutral-50 rounded-xl flex items-center justify-center group-hover:bg-neutral-100 transition-colors">
                  <FileText className="w-5 h-5 text-neutral-400" />
                </div>
              </div>
              <p className="text-4xl font-black text-neutral-900">
                {showOverviewInsights
                  ? `${cases.length > 0 ? Math.round((cases.filter(c => c.status === 'published').length / cases.length) * 100) : 0}%`
                  : cases.length}
                <span className="text-sm font-bold text-neutral-300 ml-2">{showOverviewInsights ? 'RATE' : 'ITEMS'}</span>
              </p>
            </div>
            <div className="card-modern p-8 group hover:border-brand-200 transition-all">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{showOverviewInsights ? '公开率' : '已发布'}</p>
                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center group-hover:bg-brand-100 transition-colors">
                  <CheckCircle className="w-5 h-5 text-brand-500" />
                </div>
              </div>
              <p className="text-4xl font-black text-brand-500">
                {showOverviewInsights
                  ? `${cases.length > 0 ? Math.round((cases.filter(c => c.isPublic === true).length / cases.length) * 100) : 0}%`
                  : cases.filter(c => c.status === 'published').length}
                <span className="text-sm font-bold text-brand-200 ml-2">{showOverviewInsights ? 'PUBLIC' : 'LIVE'}</span>
              </p>
            </div>
            <div className="card-modern p-8 group hover:border-amber-200 transition-all">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{showOverviewInsights ? '草稿案例' : '草稿'}</p>
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
              </div>
              <p className="text-4xl font-black text-amber-500">
                {cases.filter(c => c.status === 'draft').length}
                <span className="text-sm font-bold text-amber-200 ml-2">DRAFT</span>
              </p>
            </div>
          </div>
        </DashboardModule>

        <div className="mb-12" />

        <DashboardModule
          title={`${pageTitle}列表`}
          subtitle="支持搜索、筛选、点赞、导出与常用操作"
          actions={
            <>
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setOrganizationFilter('all');
                  setCreatorFilter('all');
                  setVisibilityFilter('all');
                  setSearchQuery('');
                }}
                className="p-2.5 bg-white border border-neutral-200 rounded-xl text-neutral-500 hover:text-brand-500 hover:border-brand-200 transition-all shadow-sm"
                title="重置筛选"
              >
                <Filter className="w-4 h-4" />
              </button>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'published' | 'draft')}
                className="px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-600"
              >
                <option value="all">状态：全部</option>
                <option value="published">状态：已发布</option>
                <option value="draft">状态：草稿</option>
              </select>
              <select
                value={organizationFilter}
                onChange={(e) => setOrganizationFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-600"
              >
                <option value="all">组织：全部</option>
                {organizationOptions.map((organization) => (
                  <option key={organization} value={organization}>{organization}</option>
                ))}
              </select>
              <select
                value={creatorFilter}
                onChange={(e) => setCreatorFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-600"
              >
                <option value="all">创建人：全部</option>
                {creators.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <select
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value as 'all' | 'public' | 'private')}
                className="px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-600"
              >
                <option value="all">可见性：全部</option>
                <option value="public">公开</option>
                <option value="private">私密</option>
              </select>
              <button
                onClick={handleExportExcel}
                className="px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-600 hover:text-brand-600 hover:border-brand-200"
              >
                导出Excel
              </button>
            </>
          }
        >
          <div className="mb-4">
            <div className="relative w-full md:w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-brand-500 transition-colors" />
              <input
                type="text"
                placeholder="搜索案例名称、组织、创建人..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-modern pl-11"
              />
            </div>
          </div>

          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-neutral-50/50">
                  <th className="px-8 py-4 text-left text-[10px] font-black text-neutral-400 uppercase tracking-[0.15em]">案例名称</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black text-neutral-400 uppercase tracking-[0.15em]">案例类型</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black text-neutral-400 uppercase tracking-[0.15em]">组织</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black text-neutral-400 uppercase tracking-[0.15em]">创建人</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black text-neutral-400 uppercase tracking-[0.15em]">状态</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black text-neutral-400 uppercase tracking-[0.15em]">最后更新</th>
                  <th className="px-8 py-4 text-right text-[10px] font-black text-neutral-400 uppercase tracking-[0.15em]">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {pagedCases.map((c) => (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-neutral-50/50 transition-colors group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-neutral-100 rounded-2xl flex items-center justify-center group-hover:bg-brand-50 transition-colors">
                          <FileText className="w-6 h-6 text-neutral-400 group-hover:text-brand-600" />
                        </div>
                        <div>
                          <p className="font-bold text-neutral-900 text-sm group-hover:text-brand-600 transition-colors">{c.title}</p>
                          <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-0.5">
                            VERSION {(c.version ?? 0).toFixed(1)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <span className="inline-flex px-3 py-1.5 rounded-xl bg-orange-50 text-orange-800 border border-orange-100 text-[10px] font-bold tracking-wide">
                        {caseTypeLabelMap[c.caseType || 'openclaw_app']}
                      </span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <span className="px-3 py-1 bg-neutral-100 text-neutral-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                        {c.organization}
                      </span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-xs text-neutral-600 font-bold">
                      {c.author?.trim() || '未命名用户'}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        {c.status === 'published' ? (
                          <div className="flex items-center gap-1.5 text-brand-600 bg-brand-50 px-3 py-1 rounded-full">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">已发布</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">草稿</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-xs text-neutral-500 font-bold">
                      {new Date(c.lastModified ?? Date.now()).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onViewCanvas(c)}
                          className="p-2.5 text-neutral-400 hover:text-brand-500 hover:bg-brand-50 rounded-xl transition-all"
                          title="查看画布"
                        >
                          <Eye className="w-4.5 h-4.5" />
                        </button>
                        {c.isPublic === true && (
                          <button
                            onClick={() => onLikeCase(c.id)}
                            className="inline-flex items-center gap-1.5 p-2.5 text-neutral-400 hover:text-pink-500 hover:bg-pink-50 rounded-xl transition-all"
                            title="点赞公开案例"
                          >
                            <Heart className="w-4.5 h-4.5" />
                            <span className="text-[10px] font-bold">{c.likeCount ?? 0}</span>
                          </button>
                        )}
                        {user?.uid === c.ownerId && (
                          <button
                            onClick={() => onEditCase(c)}
                            className="p-2.5 text-neutral-400 hover:text-brand-500 hover:bg-brand-50 rounded-xl transition-all"
                            title="编辑"
                          >
                            <Edit3 className="w-4.5 h-4.5" />
                          </button>
                        )}
                        {user?.uid === c.ownerId && c.isPublic !== true && (
                          <button
                            onClick={() => onDeleteCase(c.id)}
                            className="p-2.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="删除"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredCases.length === 0 && (
            <div className="py-20 text-center">
              <div className="w-20 h-20 bg-neutral-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-neutral-200" />
              </div>
              <p className="text-neutral-400 font-bold text-sm">{emptyTitle}</p>
              <p className="text-neutral-300 text-xs mt-1">{emptySubtitle}</p>
            </div>
          )}
          {filteredCases.length > 0 && (
            <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
              <span>共 {filteredCases.length} 条，当前第 {safeCurrentPage} / {totalPages} 页</span>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <label className="inline-flex items-center gap-1">
                  <span>每页</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="px-2 py-1 rounded-lg border border-neutral-200 bg-white"
                  >
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </label>
                <button
                  disabled={safeCurrentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-neutral-200 disabled:opacity-40"
                >
                  上一页
                </button>
                {pageNumbers.map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`px-2.5 py-1.5 rounded-lg border ${
                      p === safeCurrentPage
                        ? 'border-brand-500 text-brand-600 bg-brand-50'
                        : 'border-neutral-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-neutral-200 disabled:opacity-40"
                >
                  下一页
                </button>
                <div className="inline-flex items-center gap-1">
                  <span>跳转</span>
                  <input
                    value={jumpPageInput}
                    onChange={(e) => setJumpPageInput(e.target.value.replace(/[^\d]/g, ''))}
                    className="w-14 px-2 py-1 rounded-lg border border-neutral-200 bg-white"
                  />
                  <button
                    onClick={() => {
                      const target = Number(jumpPageInput || '1');
                      if (!Number.isFinite(target)) return;
                      setCurrentPage(Math.min(totalPages, Math.max(1, target)));
                    }}
                    className="px-2.5 py-1 rounded-lg border border-neutral-200"
                  >
                    前往
                  </button>
                </div>
              </div>
            </div>
          )}
        </DashboardModule>
      </div>
    </div>
  );
};
