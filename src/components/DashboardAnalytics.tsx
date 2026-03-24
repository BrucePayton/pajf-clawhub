import React from 'react';
import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { FullAnalyticsData } from '../services/apiService';
import { Graph as G6Graph } from '@antv/g6';

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
  const graphContainerRef = React.useRef<HTMLDivElement | null>(null);
  const graphInstanceRef = React.useRef<any>(null);

  React.useEffect(() => {
    const graphData = analytics?.charts?.knowledgeGraph;
    const container = graphContainerRef.current;
    if (!container || !graphData || graphData.nodes.length === 0) {
      if (graphInstanceRef.current) {
        graphInstanceRef.current.destroy();
        graphInstanceRef.current = null;
      }
      return;
    }

    if (graphInstanceRef.current) {
      graphInstanceRef.current.destroy();
      graphInstanceRef.current = null;
    }

    try {
      const width = container.clientWidth || 720;
      const height = container.clientHeight || 320;
      const graph = new G6Graph({
        container,
        width,
        height,
        data: graphData as any,
        layout: {
          type: 'force',
          preventOverlap: true,
          nodeSize: 28,
          linkDistance: 120,
        } as any,
        node: {
          style: {
            labelText: (d: any) => d.label,
            labelFontSize: 10,
            lineWidth: 1,
            stroke: '#E5E7EB',
            fill: (d: any) => {
              if (d.type === 'user') return '#DBEAFE';
              if (d.type === 'region') return '#DCFCE7';
              if (d.type === 'metric') return '#FEF3C7';
              return '#F3F4F6';
            },
          },
        } as any,
        edge: {
          style: {
            stroke: '#D1D5DB',
            endArrow: true,
            labelText: (d: any) => d.label,
            labelFontSize: 9,
            labelFill: '#6B7280',
          },
        } as any,
        behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],
      } as any);
      graph.render();
      graphInstanceRef.current = graph;

      const onResize = () => {
        if (!graphInstanceRef.current || !graphContainerRef.current) return;
        const nextWidth = graphContainerRef.current.clientWidth || 720;
        const nextHeight = graphContainerRef.current.clientHeight || 320;
        graphInstanceRef.current.resize(nextWidth, nextHeight);
      };
      window.addEventListener('resize', onResize);
      return () => {
        window.removeEventListener('resize', onResize);
        if (graphInstanceRef.current) {
          graphInstanceRef.current.destroy();
          graphInstanceRef.current = null;
        }
      };
    } catch (e) {
      console.error('Failed to render G6 graph:', e);
      return () => {
        if (graphInstanceRef.current) {
          graphInstanceRef.current.destroy();
          graphInstanceRef.current = null;
        }
      };
    }
  }, [analytics]);

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
        <p className="text-sm text-neutral-500">正在初始化分析数据，请稍后刷新。</p>
      </div>
    );
  }

  const { totals, charts, rankings } = analytics;
  const heatValues = charts.heatmapMatrix.rows.flatMap((r) => r.values.map((v) => v.value));
  const maxHeatValue = Math.max(1, ...heatValues);

  const heatColor = (value: number) => {
    const ratio = Math.min(1, Math.max(0, value / maxHeatValue));
    const alpha = 0.1 + ratio * 0.9;
    return `rgba(59,130,246,${alpha.toFixed(3)})`;
  };

  if (totals.cases === 0) {
    return (
      <div className="card-modern p-6 mb-12">
        <p className="text-sm text-neutral-500">数据库暂无案例数据，请先创建或初始化案例。</p>
      </div>
    );
  }

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
        <ChartCard title="月度趋势（折线图）">
          <div data-export-chart="line" className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.lineSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" name="总新增" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="published" name="已发布" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="案例质量分布（直方图）">
          <div data-export-chart="histogram" className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.histogramSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bucket" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#6366F1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard title="版本-质量关系（散点图）">
          <div data-export-chart="scatter" className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="xVersion" name="版本" />
                <YAxis dataKey="yQuality" name="质量分" domain={[0, 100]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v: any, key: string) => [v, key]} />
                <Scatter data={charts.scatterSeries} fill="#F59E0B">
                  {charts.scatterSeries.map((entry) => (
                    <Cell key={entry.id} fill={entry.group === '财服总部' ? '#3B82F6' : '#F59E0B'} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="组织-月份热力矩阵（热力图）">
          <div data-export-chart="heatmap" className="h-full overflow-auto">
            <div className="min-w-[560px]">
              <div
                className="grid gap-1 mb-1"
                style={{ gridTemplateColumns: `160px repeat(${charts.heatmapMatrix.columns.length}, minmax(64px, 1fr))` }}
              >
                <div className="text-xs text-neutral-400 font-semibold px-2 py-1">组织 \\ 月份</div>
                {charts.heatmapMatrix.columns.map((col) => (
                  <div key={col} className="text-xs text-neutral-500 font-semibold text-center px-1 py-1">{col}</div>
                ))}
              </div>
              {charts.heatmapMatrix.rows.map((row) => (
                <div
                  key={row.row}
                  className="grid gap-1 mb-1"
                  style={{ gridTemplateColumns: `160px repeat(${charts.heatmapMatrix.columns.length}, minmax(64px, 1fr))` }}
                >
                  <div className="text-xs text-neutral-600 font-semibold px-2 py-2 bg-neutral-50 rounded">{row.row}</div>
                  {row.values.map((cell) => (
                    <div
                      key={`${row.row}-${cell.col}`}
                      className="h-8 rounded text-[11px] font-semibold text-center leading-8 text-neutral-800"
                      style={{ background: heatColor(cell.value) }}
                    >
                      {cell.value}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="知识图谱分布（G6）">
        <div data-export-chart="knowledge-graph" className="h-full">
          {charts.knowledgeGraph.nodes.length > 0 ? (
            <div ref={graphContainerRef} className="w-full h-full rounded-xl border border-neutral-200" />
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-neutral-500">
              暂无可展示的图谱关系数据
            </div>
          )}
        </div>
      </ChartCard>

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

