import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Download, Globe, Target, Zap, TrendingUp, Calendar, Clock, CheckCircle, ChevronRight, Layout, FileText, X, ZoomIn, MessageSquare, Send, Trash2 } from 'lucide-react';
import { Case } from '../types';
import { exportToPptx } from '../services/pptxService';
import { exportElementToPdf } from '../services/pdfService';
import { buildExportFileBaseName, getCaseTypeLabel } from '../services/exportMeta';
import { apiService, CaseComment, User } from '../services/apiService';

interface CanvasViewProps {
  caseData: Case;
  onBack: () => void;
  onEdit: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'loading') => void;
  user?: User | null;
}

export const CanvasView: React.FC<CanvasViewProps> = ({
  caseData,
  onBack,
  onEdit,
  showToast,
  user,
}) => {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const exportAreaRef = useRef<HTMLDivElement | null>(null);
  const [comments, setComments] = useState<CaseComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement | null>(null);

  const loadComments = useCallback(async () => {
    const data = await apiService.getComments(caseData.id);
    setComments(data);
  }, [caseData.id]);

  useEffect(() => { loadComments(); }, [loadComments]);

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    if (!user) { showToast('请先登录后再留言', 'info'); return; }
    setSubmitting(true);
    const result = await apiService.postComment(caseData.id, newComment.trim());
    setSubmitting(false);
    if (result.success && result.comment) {
      setComments(prev => [...prev, result.comment!]);
      setNewComment('');
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } else {
      showToast(result.message || '留言失败', 'error');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const ok = await apiService.deleteComment(commentId);
    if (ok) {
      setComments(prev => prev.filter(c => c.id !== commentId));
    } else {
      showToast('删除留言失败', 'error');
    }
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return '刚刚';
    if (diffMin < 60) return `${diffMin} 分钟前`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} 小时前`;
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleExport = async () => {
    try {
      showToast('正在生成 PPTX，请稍候...', 'loading');
      await exportToPptx(caseData);
      showToast('PPTX 导出完成，已开始下载');
    } catch (error) {
      console.error('PPTX export error:', error);
      showToast('PPTX 导出失败，请重试', 'error');
    }
  };

  const handleExportPdf = async () => {
    if (!exportAreaRef.current) {
      showToast('导出区域未就绪，请稍后重试', 'error');
      return;
    }
    try {
      showToast('正在生成 PDF，请稍候...', 'loading');
      await exportElementToPdf(exportAreaRef.current, buildExportFileBaseName(caseData));
      showToast('PDF 导出完成，已开始下载');
    } catch (error) {
      console.error('PDF export error:', error);
      showToast('PDF 导出失败，已切换浏览器打印模式', 'info');
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 p-8 md:p-12 flex flex-col print:h-auto print:bg-white print:text-black print:p-0 overflow-x-hidden print:overflow-visible">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-8 print:hidden shrink-0">
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
              <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded-lg text-[10px] font-bold tracking-wider border border-orange-100">
                {getCaseTypeLabel(caseData.caseType)}
              </span>
              <span className="px-2 py-1 bg-brand-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-md shadow-brand-500/20">v{(caseData.version ?? 0).toFixed(1)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-neutral-400 font-semibold text-[10px] uppercase tracking-widest mt-2">
              <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-brand-500" /> {caseData.organization}</span>
              <span className="w-1.5 h-1.5 bg-neutral-200 rounded-full" />
              <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-brand-500" /> {caseData.author} ({caseData.umNumber})</span>
              <span className="w-1.5 h-1.5 bg-neutral-200 rounded-full" />
              <span className="flex items-center gap-1.5"><Layout className="w-3.5 h-3.5 text-brand-500" /> {caseData.team}</span>
              <span className="w-1.5 h-1.5 bg-neutral-200 rounded-full" />
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-brand-500" /> {new Date(caseData.lastModified ?? Date.now()).toLocaleDateString()}</span>
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
            onClick={handleExportPdf}
            className="btn-secondary text-sm"
          >
            <Layout className="w-4 h-4 text-brand-500" />
            导出 PDF
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

      <main ref={exportAreaRef} className="flex-1 grid grid-cols-12 gap-6 print:block print:space-y-10 min-h-0">
        {/* Left Column: Challenges & Value */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-6 print:col-span-12 min-h-0">
          <motion.section 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card-modern p-6 relative overflow-hidden group print:bg-white print:border-neutral-200 print:text-black flex flex-col min-h-0 lg:flex-1"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 blur-2xl rounded-full -mr-12 -mt-12 print:hidden" />
            <div className="flex items-center gap-3 mb-6 shrink-0">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/20">
                <Target className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-bold tracking-tight">核心挑战</h2>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto pr-2 -mr-2 custom-scrollbar print:overflow-visible">
              <p className="text-neutral-600 leading-relaxed font-medium mb-6 text-sm print:text-neutral-600">
                {caseData.challenges?.background ?? ''}
              </p>
              <div className="space-y-2.5">
                {(caseData.challenges?.painPoints ?? []).map((point, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 p-3 bg-neutral-50 rounded-xl border border-neutral-200/60 print:bg-neutral-50 print:border-neutral-100">
                    <div className="w-1 h-1 bg-brand-500 rounded-full shrink-0" />
                    <span className="text-xs font-semibold text-neutral-800 print:text-neutral-800">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

          <motion.section 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="card-modern p-6 print:bg-white print:border-neutral-200 print:text-black flex-1 min-h-0 flex flex-col"
          >
            <div className="flex items-center gap-3 mb-6 shrink-0">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/20">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-bold tracking-tight">业务价值</h2>
            </div>
            <div className="grid grid-cols-1 gap-3 overflow-y-auto pr-2 -mr-2 flex-1 custom-scrollbar">
              {(caseData.businessValue?.metrics ?? []).map((metric) => (
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
        <div className="col-span-12 lg:col-span-6 flex flex-col print:col-span-12 min-h-0">
          <motion.section 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="card-modern p-8 relative overflow-hidden print:bg-white print:border-neutral-200 print:text-black flex-1 flex flex-col min-h-0"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/5 blur-[80px] rounded-full -mr-24 -mt-24 print:hidden" />
            <div className="flex items-center gap-4 mb-8 shrink-0">
              <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
                <Layout className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold tracking-tight">核心实施步骤</h2>
            </div>
            <div className="flex-1 overflow-y-auto pr-4 -mr-4 custom-scrollbar relative">
              <div className="grid grid-cols-1 gap-6 relative">
                {(caseData.implementation?.steps ?? []).map((step, idx) => (
                  <div key={step.id} className="flex gap-5 group">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center font-bold text-neutral-400 group-hover:bg-brand-500 group-hover:text-white transition-all print:bg-neutral-100 print:text-neutral-400 text-sm">
                        {idx + 1}
                      </div>
                      {idx !== (caseData.implementation?.steps ?? []).length - 1 && (
                        <div className="w-0.5 flex-1 bg-neutral-100 my-2 rounded-full print:bg-neutral-100" />
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex items-center justify-between mb-1.5">
                        <h3 className="text-base font-bold text-neutral-900 print:text-neutral-900">{step.title}</h3>
                      </div>
                      <p className="text-neutral-500 text-xs font-medium leading-relaxed print:text-neutral-600">{step.description}</p>
                      {step.imageUrl && (
                        <div 
                          className="mt-3 rounded-xl overflow-hidden border border-neutral-200/60 max-w-sm shadow-sm relative group/img cursor-zoom-in"
                          onClick={() => setZoomedImage(step.imageUrl)}
                        >
                          <img src={step.imageUrl} alt={step.title} className="w-full h-auto object-cover transition-transform duration-500 group-hover/img:scale-105" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors flex items-center justify-center">
                            <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover/img:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        </div>

        {/* Right Column: Roadmap */}
        <div className="col-span-12 lg:col-span-3 flex flex-col print:col-span-12 min-h-0">
          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="card-modern p-6 print:bg-white print:border-neutral-200 print:text-black flex-1 flex flex-col min-h-0"
          >
            <div className="flex items-center gap-3 mb-8 shrink-0">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/20">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-bold tracking-tight">未来演进规划</h2>
            </div>
            <div className="space-y-4 overflow-y-auto pr-2 -mr-2 flex-1 custom-scrollbar">
              {(caseData.roadmap?.items ?? []).map((item) => (
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

      {/* Comments Section -- not included in PPTX/PDF exports */}
      <section className="mt-8 mb-12 max-w-3xl mx-auto print:hidden">
        <div className="card-modern p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-neutral-500" />
            </div>
            <h2 className="text-lg font-bold tracking-tight">留言讨论</h2>
            <span className="text-xs text-neutral-400 font-bold">{comments.length} 条</span>
          </div>

          {comments.length > 0 && (
            <div className="space-y-4 mb-6 max-h-[420px] overflow-y-auto pr-2 -mr-2 custom-scrollbar">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3 group/comment">
                  <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 text-xs font-black shrink-0 mt-0.5">
                    {c.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-neutral-800">{c.username}</span>
                      <span className="text-[10px] text-neutral-400">{formatTime(c.created_at)}</span>
                      {user && (user.uid === c.user_id || user.role === 'admin') && (
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          className="opacity-0 group-hover/comment:opacity-100 transition-opacity p-1 text-neutral-300 hover:text-red-500 rounded"
                          title="删除留言"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-neutral-600 leading-relaxed mt-1 break-words">{c.content}</p>
                  </div>
                </div>
              ))}
              <div ref={commentsEndRef} />
            </div>
          )}

          {comments.length === 0 && (
            <p className="text-sm text-neutral-400 text-center py-6 mb-4">暂无留言，来说点什么吧</p>
          )}

          <div className="flex gap-3 items-end">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value.slice(0, 500))}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePostComment(); } }}
              placeholder={user ? '写下你的想法...' : '登录后可以留言'}
              disabled={!user}
              rows={2}
              className="flex-1 px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-700 placeholder-neutral-400 resize-none focus:outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={handlePostComment}
              disabled={!user || !newComment.trim() || submitting}
              className="px-4 py-3 bg-brand-500 text-white rounded-xl font-bold text-sm hover:bg-brand-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shrink-0 shadow-lg shadow-brand-500/20"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? '发送中...' : '发送'}</span>
            </button>
          </div>
          {newComment.length > 400 && (
            <p className="text-[10px] text-neutral-400 mt-1 text-right">{newComment.length}/500</p>
          )}
        </div>
      </section>

      {/* Image Zoom Modal */}
      <AnimatePresence>
        {zoomedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-12 cursor-zoom-out"
            onClick={() => setZoomedImage(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-full max-h-full"
            >
              <img 
                src={zoomedImage} 
                alt="Zoomed" 
                className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl border border-white/10 object-contain"
                referrerPolicy="no-referrer"
              />
              <button 
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomedImage(null);
                }}
              >
                <X className="w-6 h-6" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
