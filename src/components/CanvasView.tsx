import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Download, Globe, Target, Zap, TrendingUp, Calendar, Clock, CheckCircle, ChevronRight, Layout, FileText } from 'lucide-react';
import { Case } from '../types';
import { exportToPptx } from '../services/pptxService';

interface CanvasViewProps {
  caseData: Case;
  onBack: () => void;
  onEdit: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const CanvasView: React.FC<CanvasViewProps> = ({
  caseData,
  onBack,
  onEdit,
  showToast
}) => {
  const handleExport = async () => {
    try {
      showToast('正在生成 PPTX...');
      await exportToPptx(caseData);
      showToast('PPTX 导出成功');
    } catch (error) {
      console.error('PPTX export error:', error);
      showToast('导出失败，请重试', 'error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 p-8 md:p-12 flex flex-col print:bg-white print:text-black print:p-0">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-12 print:hidden">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="p-3 bg-white hover:bg-neutral-100 rounded-xl transition-all text-neutral-400 hover:text-neutral-900 shadow-sm border border-neutral-200/60 active:scale-95"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900">{caseData.title}</h1>
              <span className="px-2 py-1 bg-brand-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-md shadow-brand-500/20">v{caseData.version.toFixed(1)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-neutral-400 font-semibold text-[10px] uppercase tracking-widest mt-2">
              <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-brand-500" /> {caseData.organization}</span>
              <span className="w-1.5 h-1.5 bg-neutral-200 rounded-full" />
              <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-brand-500" /> {caseData.author} ({caseData.umNumber})</span>
              <span className="w-1.5 h-1.5 bg-neutral-200 rounded-full" />
              <span className="flex items-center gap-1.5"><Layout className="w-3.5 h-3.5 text-brand-500" /> {caseData.team}</span>
              <span className="w-1.5 h-1.5 bg-neutral-200 rounded-full" />
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-brand-500" /> {new Date(caseData.lastModified).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={onEdit}
            className="btn-secondary text-sm"
          >
            <FileText className="w-4 h-4 text-brand-500" />
            编辑案例
          </button>
          <button 
            onClick={handlePrint}
            className="btn-secondary text-sm"
          >
            <Layout className="w-4 h-4 text-brand-500" />
            打印 PDF
          </button>
          <button 
            onClick={handleExport}
            className="btn-primary text-sm"
          >
            <Download className="w-4 h-4" />
            导出 PPTX
          </button>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-12 gap-6 print:block print:space-y-10">
        {/* Left Column: Challenges & Value */}
        <div className="col-span-12 lg:col-span-3 space-y-6 print:col-span-12">
          <motion.section 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card-modern p-6 relative overflow-hidden group print:bg-white print:border-neutral-200 print:text-black"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 blur-2xl rounded-full -mr-12 -mt-12 print:hidden" />
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/20">
                <Target className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-bold tracking-tight">核心挑战</h2>
            </div>
            <p className="text-neutral-600 leading-relaxed font-medium mb-6 text-sm print:text-neutral-600">
              {caseData.challenges.background}
            </p>
            <div className="space-y-2.5">
              {caseData.challenges.painPoints.map((point, idx) => (
                <div key={idx} className="flex items-center gap-2.5 p-3 bg-neutral-50 rounded-xl border border-neutral-200/60 print:bg-neutral-50 print:border-neutral-100">
                  <div className="w-1 h-1 bg-brand-500 rounded-full shrink-0" />
                  <span className="text-xs font-semibold text-neutral-800 print:text-neutral-800">{point}</span>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="card-modern p-6 print:bg-white print:border-neutral-200 print:text-black"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/20">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-bold tracking-tight">业务价值</h2>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {caseData.businessValue.metrics.map((metric) => (
                <div key={metric.id} className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/60 flex items-center justify-between print:bg-neutral-50 print:border-neutral-100">
                  <div>
                    <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5 print:text-neutral-400">{metric.label}</p>
                    <p className="text-xl font-bold text-brand-500 tracking-tight print:text-brand-600">{metric.value}</p>
                    <p className="text-[9px] text-neutral-400 mt-0.5 print:text-neutral-400">{metric.subtext}</p>
                  </div>
                  <div className="w-8 h-8 bg-brand-500/10 rounded-lg flex items-center justify-center">
                    {metric.icon === 'trending-up' && <TrendingUp className="w-4 h-4 text-brand-500" />}
                    {metric.icon === 'zap' && <Zap className="w-4 h-4 text-brand-500" />}
                    {metric.icon === 'clock' && <Clock className="w-4 h-4 text-brand-500" />}
                    {metric.icon === 'calendar' && <Calendar className="w-4 h-4 text-brand-500" />}
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        </div>

        {/* Middle Column: Implementation */}
        <div className="col-span-12 lg:col-span-6 space-y-6 print:col-span-12">
          <motion.section 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="card-modern p-8 relative overflow-hidden print:bg-white print:border-neutral-200 print:text-black h-full"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/5 blur-[80px] rounded-full -mr-24 -mt-24 print:hidden" />
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
                <Layout className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold tracking-tight">核心实施步骤</h2>
            </div>
            <div className="grid grid-cols-1 gap-6 relative">
              {caseData.implementation.steps.map((step, idx) => (
                <div key={step.id} className="flex gap-5 group">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center font-bold text-neutral-400 group-hover:bg-brand-500 group-hover:text-white transition-all print:bg-neutral-100 print:text-neutral-400 text-sm">
                      {idx + 1}
                    </div>
                    {idx !== caseData.implementation.steps.length - 1 && (
                      <div className="w-0.5 flex-1 bg-neutral-100 my-2 rounded-full print:bg-neutral-100" />
                    )}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="text-base font-bold text-neutral-900 print:text-neutral-900">{step.title}</h3>
                    </div>
                    <p className="text-neutral-500 text-xs font-medium leading-relaxed print:text-neutral-600">{step.description}</p>
                    {step.imageUrl && (
                      <div className="mt-3 rounded-xl overflow-hidden border border-neutral-200/60 max-w-sm shadow-sm">
                        <img src={step.imageUrl} alt={step.title} className="w-full h-auto object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        </div>

        {/* Right Column: Roadmap */}
        <div className="col-span-12 lg:col-span-3 space-y-6 print:col-span-12">
          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="card-modern p-6 print:bg-white print:border-neutral-200 print:text-black h-full"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/20">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-bold tracking-tight">未来演进规划</h2>
            </div>
            <div className="space-y-4">
              {caseData.roadmap.items.map((item) => (
                <div key={item.id} className="p-5 bg-neutral-50 rounded-xl border border-neutral-200/60 space-y-2.5 print:bg-neutral-50 print:border-neutral-100 group hover:border-brand-200 transition-colors">
                  <div className="flex justify-between items-start">
                    <span className="px-2 py-0.5 bg-brand-500 text-white rounded-md text-[9px] font-bold uppercase tracking-wider shadow-md shadow-brand-500/20">{item.date}</span>
                  </div>
                  <h3 className="text-sm font-bold text-neutral-900 print:text-neutral-900">{item.task}</h3>
                  <p className="text-[10px] text-neutral-500 font-semibold leading-relaxed print:text-neutral-600">{item.content}</p>
                </div>
              ))}
            </div>
          </motion.section>
        </div>
      </main>
    </div>
  );
};
