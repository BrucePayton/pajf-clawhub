import React from 'react';
import { ArrowLeft, ChartNoAxesCombined, Download } from 'lucide-react';
import { toPng } from 'html-to-image';
import { FullAnalyticsData } from '../services/apiService';
import { DashboardAnalytics } from './DashboardAnalytics';
import { DashboardModule } from './DashboardModule';
import { exportAnalyticsToPptx } from '../services/pptxService';

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
  const [exporting, setExporting] = React.useState(false);

  const handleExportPptx = React.useCallback(async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const titleMap: Record<string, string> = {
        line: '月度趋势（折线图）',
        histogram: '案例质量分布（直方图）',
        scatter: '版本-质量关系（散点图）',
        heatmap: '组织-月份热力矩阵（热力图）',
        'knowledge-graph': '知识图谱分布（G6）',
      };

      const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-export-chart]'));
      const chartImages: Array<{ key: string; title: string; imageDataUrl: string }> = [];
      for (const node of nodes) {
        const key = node.dataset.exportChart || 'chart';
        const imageDataUrl = await toPng(node, {
          cacheBust: true,
          backgroundColor: '#ffffff',
          pixelRatio: 2,
        });
        chartImages.push({
          key,
          title: titleMap[key] || key,
          imageDataUrl,
        });
      }

      if (chartImages.length === 0) {
        throw new Error('NO_CHART_IMAGE');
      }

      await exportAnalyticsToPptx(analytics, chartImages);
    } catch (e) {
      console.error('Failed to export analytics pptx:', e);
      window.alert('导出失败：未能生成图表快照，请稍后重试。');
    } finally {
      setExporting(false);
    }
  }, [analytics, exporting]);

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
          <button
            onClick={handleExportPptx}
            disabled={loading || exporting}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-neutral-200 text-xs font-semibold text-neutral-600 hover:text-brand-600 hover:border-brand-200 disabled:opacity-60"
          >
            <Download className="w-4 h-4" />
            {exporting ? '导出中...' : '导出分析PPTX'}
          </button>
        </header>

        <DashboardModule title="全量图表分析" subtitle="仅展示数据库持久化数据（MySQL优先，文件回退）">
          <DashboardAnalytics analytics={analytics} loading={loading} error={error} />
        </DashboardModule>
      </div>
    </div>
  );
};

