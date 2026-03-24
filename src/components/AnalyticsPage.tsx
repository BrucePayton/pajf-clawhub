import React from 'react';
import { ArrowLeft, ChartNoAxesCombined } from 'lucide-react';
import { FullAnalyticsData } from '../services/apiService';
import { DashboardAnalytics } from './DashboardAnalytics';
import { DashboardModule } from './DashboardModule';

interface AnalyticsPageProps {
  analytics: FullAnalyticsData | null;
  loading: boolean;
  error: string | null;
  onBack: () => void;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  analytics,
  loading,
  error,
  onBack,
}) => {
  return (
    <div className="min-h-screen bg-neutral-50/50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2.5 bg-white border border-neutral-200 rounded-xl text-neutral-500 hover:text-brand-500 hover:border-brand-200 transition-all"
              title="返回总览"
            >
              <ArrowLeft className="w-4.5 h-4.5" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-neutral-900 tracking-tight">独立分析页面</h1>
              <p className="text-neutral-400 font-bold text-[10px] uppercase tracking-[0.2em]">Database Analytics</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-neutral-200 text-xs font-semibold text-neutral-600">
            <ChartNoAxesCombined className="w-4 h-4 text-brand-500" />
            数据来源：数据库全量口径
          </div>
        </header>

        <DashboardModule title="全量图表分析" subtitle="仅展示数据库持久化数据（MySQL优先，文件回退）">
          <DashboardAnalytics analytics={analytics} loading={loading} error={error} />
        </DashboardModule>
      </div>
    </div>
  );
};

