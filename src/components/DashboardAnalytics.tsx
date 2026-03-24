import React from 'react';
import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { FullAnalyticsData } from '../services/apiService';

interface DashboardAnalyticsProps {
  analytics: FullAnalyticsData | null;
  loading: boolean;
  error: string | null;
}

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="card-modern p-6">
    <h3 className="text-sm font-black text-neutral-800 uppercase tracking-wider mb-4">{title}</h3>
    <div className="h-72">{children}</div>
  </div>
);

export const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({ analytics, loading, error }) => {
  if (loading) {
    return (
      <div className="card-modern p-6 mb-12">
        <p className="text-sm text-neutral-500">正在加载全量图表分析数据...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-modern p-6 mb-12 border border-red-200">
        <p className="text-sm text-red-500">分析数据加载失败：{error}</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="card-modern p-6 mb-12">
        <p className="text-sm text-neutral-500">暂无分析数据</p>
      </div>
    );
  }

  const { totals, charts, rankings } = analytics;

  return (
    <section className="space-y-6 mb-12">
      <div className="card-modern p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-black text-neutral-900 uppercase tracking-wider">全量图表分析模块</h2>
          <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">MYSQL FULL DATA</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/60">
            <p className="text-[10px] text-neutral-400 font-bold uppercase">总案例</p>
            <p className="text-xl font-black text-neutral-900">{totals.cases}</p>
          </div>
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/60">
            <p className="text-[10px] text-neutral-400 font-bold uppercase">已发布</p>
            <p className="text-xl font-black text-brand-600">{totals.published}</p>
          </div>
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/60">
            <p className="text-[10px] text-neutral-400 font-bold uppercase">私密案例</p>
            <p className="text-xl font-black text-amber-600">{totals.privateCases}</p>
          </div>
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/60">
            <p className="text-[10px] text-neutral-400 font-bold uppercase">涉及用户</p>
            <p className="text-xl font-black text-neutral-900">{totals.users}</p>
          </div>
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/60">
            <p className="text-[10px] text-neutral-400 font-bold uppercase">涉及地区</p>
            <p className="text-xl font-black text-neutral-900">{totals.regions}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard title="地区案例数量排名（柱状图）">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts.regionCaseCount}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="地区质量排名（柱状图）">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts.regionQuality}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="qualityScore" fill="#10B981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard title="Top用户（案例数量）">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts.userTopByCaseCount}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top用户（质量得分）">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts.userTopByQuality}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="avgQualityScore" fill="#F59E0B" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card-modern p-6">
          <h3 className="text-sm font-black text-neutral-800 uppercase tracking-wider mb-4">地区排名（数量/质量）</h3>
          <div className="space-y-2">
            {rankings.regionCountRanking.map((r, idx) => (
              <div key={`${r.name}-rank`} className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 border border-neutral-200/60">
                <span className="text-sm text-neutral-700 font-semibold">{idx + 1}. {r.name}</span>
                <span className="text-xs text-neutral-500">数量 {r.count} / 质量 {r.qualityScore.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-modern p-6">
          <h3 className="text-sm font-black text-neutral-800 uppercase tracking-wider mb-4">用户总览（Top 10）</h3>
          <div className="space-y-2">
            {rankings.userOverview.slice(0, 10).map((u, idx) => (
              <div key={`${u.userId}-${idx}`} className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 border border-neutral-200/60">
                <span className="text-sm text-neutral-700 font-semibold">{idx + 1}. {u.displayName}</span>
                <span className="text-xs text-neutral-500">总 {u.total} / 发布率 {(u.publishRate * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

