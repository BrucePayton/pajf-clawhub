import React from 'react';
import { motion } from 'motion/react';
import { Plus, Search, Filter, Database, Trash2, Edit3, Eye, FileText, CheckCircle, Clock, Upload, Users, Heart } from 'lucide-react';
import { Case } from '../types';
import { FullAnalyticsData, User } from '../services/apiService';
import { DashboardAnalytics } from './DashboardAnalytics';

interface DashboardProps {
  cases: Case[];
  user: User | null;
  fullAnalytics: FullAnalyticsData | null;
  analyticsLoading: boolean;
  analyticsError: string | null;
  appName: string;
  appDescription: string;
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
  fullAnalytics,
  analyticsLoading,
  analyticsError,
  appName,
  appDescription,
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

  const creators = React.useMemo(() => {
    const set = new Set<string>();
    cases.forEach((c) => set.add(c.author?.trim() || '未命名用户'));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
  }, [cases]);

  const filteredCases = cases.filter(c => {
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

  return (
    <div className="min-h-screen bg-neutral-50/50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/20">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-neutral-900 tracking-tight">{appName || '案例资产库'}</h1>
              <p className="text-neutral-400 font-bold text-[10px] uppercase tracking-[0.2em]">{appDescription || 'Case Asset Repository'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* 数据库配置按钮：只显示给初始 admin 用户 (admin-1) */}
            {user?.uid === 'admin-1' && (
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
              <button 
                onClick={onLogin}
                className="btn-secondary"
              >
                <Upload className="w-5 h-5 text-brand-500" />
                登录以开始
              </button>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="card-modern p-8 group hover:border-brand-200 transition-all">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">总案例数</p>
              <div className="w-10 h-10 bg-neutral-50 rounded-xl flex items-center justify-center group-hover:bg-neutral-100 transition-colors">
                <FileText className="w-5 h-5 text-neutral-400" />
              </div>
            </div>
            <p className="text-4xl font-black text-neutral-900">
              {cases.length}
              <span className="text-sm font-bold text-neutral-300 ml-2">ITEMS</span>
            </p>
          </div>
          <div className="card-modern p-8 group hover:border-brand-200 transition-all">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">已发布</p>
              <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center group-hover:bg-brand-100 transition-colors">
                <CheckCircle className="w-5 h-5 text-brand-500" />
              </div>
            </div>
            <p className="text-4xl font-black text-brand-500">
              {cases.filter(c => c.status === 'published').length}
              <span className="text-sm font-bold text-brand-200 ml-2">LIVE</span>
            </p>
          </div>
          <div className="card-modern p-8 group hover:border-amber-200 transition-all">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">草稿</p>
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

        <DashboardAnalytics
          analytics={fullAnalytics}
          loading={analyticsLoading}
          error={analyticsError}
        />

        <div className="card-modern overflow-hidden">
          <div className="p-6 border-b border-neutral-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-50/30">
            <div className="relative w-full md:w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-brand-500 transition-colors" />
              <input 
                type="text" 
                placeholder="搜索案例名称或组织..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-modern pl-11"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="p-2.5 bg-white border border-neutral-200 rounded-xl text-neutral-500 hover:text-brand-500 hover:border-brand-200 transition-all shadow-sm">
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
                <option value="财服总部">财服总部</option>
                <option value="深圳分公司">深圳分公司</option>
                <option value="上海分公司">上海分公司</option>
                <option value="合肥分公司">合肥分公司</option>
                <option value="成都分公司">成都分公司</option>
                <option value="内江分公司">内江分公司</option>
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
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-neutral-50/50">
                  <th className="px-8 py-4 text-left text-[10px] font-black text-neutral-400 uppercase tracking-[0.15em]">案例名称</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black text-neutral-400 uppercase tracking-[0.15em]">组织</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black text-neutral-400 uppercase tracking-[0.15em]">创建人</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black text-neutral-400 uppercase tracking-[0.15em]">状态</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black text-neutral-400 uppercase tracking-[0.15em]">最后更新</th>
                  <th className="px-8 py-4 text-right text-[10px] font-black text-neutral-400 uppercase tracking-[0.15em]">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredCases.map((c) => (
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
                          <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-0.5">VERSION {(c.version ?? 0).toFixed(1)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 bg-neutral-100 text-neutral-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                        {c.organization}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-xs text-neutral-600 font-bold">
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
                    <td className="px-8 py-6 text-xs text-neutral-500 font-bold">
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
                        {/* 编辑按钮：仅显示给案例所有者 */}
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
            {filteredCases.length === 0 && (
              <div className="py-32 text-center">
                <div className="w-20 h-20 bg-neutral-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-neutral-200" />
                </div>
                <p className="text-neutral-400 font-bold text-sm">未找到匹配的案例</p>
                <p className="text-neutral-300 text-xs mt-1">尝试更换搜索关键词</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
