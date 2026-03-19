/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Presentation, 
  Save, 
  X, 
  ArrowRight, 
  Clock, 
  Zap, 
  TrendingUp, 
  Search, 
  Rocket, 
  CheckCircle2,
  ChevronLeft,
  LayoutDashboard,
  Eye,
  Upload,
  Target,
  Calendar,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Case, CaseStep, MetricCard, RoadmapItem } from './types';
import { exportToPptx } from './services/pptxService';

// Placeholder base64 images for offline use
const PLACEHOLDER_IMAGES = {
  step1: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==',
  step2: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==',
  step3: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==',
};

// Initial sample cases for the library
const INITIAL_CASES: Case[] = [
  {
    id: 'sample-1',
    title: 'OpenClaw 自动化报表生成案例',
    subtitle: '通过 OpenClaw 实现财务月报自动汇总与分发，效率提升 90%',
    status: 'published',
    version: 1.0,
    lastModified: Date.now(),
    author: '张三',
    team: '财务数智化小组',
    organization: '财服总部',
    challenges: {
      background: '财务部每月需从 5 个不同系统导出数据，手动汇总成 20 份分公司报表，耗时耗力且易出错。',
      painPoints: [
        '跨系统数据导出繁琐，需多次登录验证',
        '手动 Excel 汇总计算量大，公式维护困难',
        '报表分发依赖邮件，无法实时跟踪阅读情况'
      ],
      objectives: '实现报表从数据抓取、清洗、汇总到分发的全流程自动化。',
    },
    implementation: {
      steps: [
        { id: 's1', title: '多系统自动登录与导出', description: '利用 OpenClaw 模拟登录 ERP、OA 等系统，定时自动下载原始数据文件。', imageUrl: PLACEHOLDER_IMAGES.step1 },
        { id: 's2', title: '数据清洗与逻辑计算', description: '编写 Python 脚本集成至 OpenClaw，自动完成数据去重、格式转换及多维度汇总。', imageUrl: PLACEHOLDER_IMAGES.step2 },
        { id: 's3', title: '报表自动分发', description: '集成企业微信机器人，将生成的 PDF 报表自动推送至各分公司负责人。', imageUrl: PLACEHOLDER_IMAGES.step3 },
      ],
    },
    businessValue: {
      metrics: [
        { id: 'm1', label: '效率提升', value: '92%', subtext: '原流程 2 天 → 现流程 1.5 小时', icon: 'trending-up' },
        { id: 'm2', label: '准确率', value: '100%', subtext: '消除人为计算误差，数据一致性大幅提升', icon: 'zap' },
      ],
      footerNote: '注：该案例已在总部财务部稳定运行 3 个月',
    },
    roadmap: {
      items: [
        { id: 'r1', task: '增加异常监控', content: '对系统登录失败等异常情况增加自动重试与告警机制', date: '2026.04' },
        { id: 'r2', task: '可视化看板', content: '将汇总数据实时推送至 BI 看板，实现动态监控', date: '2026.05' },
      ],
    },
  },
  {
    id: 'sample-2',
    title: '智能客服工单自动分类与分配',
    subtitle: '利用 OpenClaw 结合 AI 模型，实现客服工单秒级响应与精准分派',
    status: 'published',
    version: 1.0,
    lastModified: Date.now(),
    author: '李四',
    team: '客户服务优化团队',
    organization: '深圳分公司',
    challenges: {
      background: '客服中心每日接收数千条工单，人工分类耗时约 2 分钟/条，且分类标准不统一。',
      painPoints: [
        '工单积压严重，高峰期响应延迟超过 4 小时',
        '人工分类主观性强，导致分派错误率约 15%',
        '无法快速识别紧急工单，存在服务风险'
      ],
      objectives: '实现工单自动分类、关键词提取及根据业务逻辑自动分派。',
    },
    implementation: {
      steps: [
        { id: 's1', title: '工单实时抓取', description: 'OpenClaw 实时监听工单系统接口，获取新进工单内容。', imageUrl: PLACEHOLDER_IMAGES.step1 },
        { id: 's2', title: 'AI 智能分类', description: '调用内置 NLP 模型对工单进行意图识别与分类。', imageUrl: PLACEHOLDER_IMAGES.step2 },
        { id: 's3', title: '精准分派', description: '根据分类结果自动将工单流转至对应业务组，并标记优先级。', imageUrl: PLACEHOLDER_IMAGES.step3 },
      ],
    },
    businessValue: {
      metrics: [
        { id: 'm1', label: '响应时间', value: '-95%', subtext: '从 4 小时缩短至 5 分钟内', icon: 'clock' },
        { id: 'm2', label: '分派准确率', value: '98%', subtext: '远高于人工分类的 85%', icon: 'trending-up' },
      ],
      footerNote: '注：该方案有效缓解了深圳分公司高峰期客服压力',
    },
    roadmap: {
      items: [
        { id: 'r1', task: '多语言支持', content: '增加对粤语等方言工单的识别能力', date: '2026.06' },
        { id: 'r2', task: '自动回复集成', content: '对常见简单咨询实现 AI 自动回复', date: '2026.08' },
      ],
    },
  }
];

// Default initial case template
const createNewCase = (): Case => ({
  id: crypto.randomUUID(),
  title: '平安财服 OpenClaw 应用价值案例',
  subtitle: '记录业务优化点滴，沉淀数智化转型价值',
  status: 'draft',
  version: 0.1,
  lastModified: Date.now(),
  author: '',
  team: '',
  organization: '财服总部',
  challenges: {
    background: '业务背景描述：此处描述当前的业务流程或背景，如业务目标、涉及系统等。',
    painPoints: ['痛点 1：[……]', '痛点 2：[……]', '痛点 3：[……]'],
    objectives: '优化目标：此处描述通过使用 OpenClaw 期望达到的状态。',
  },
  implementation: {
    steps: [
      { id: '1', title: '环境配置/任务创建', description: '详细描述在该步骤中需要执行的操作。', imageUrl: '' },
      { id: '2', title: '脚本编写/参数设置', description: '详细描述该步骤的关键设置或代码片段说明。', imageUrl: '' },
      { id: '3', title: '任务运行/结果监控', description: '描述任务如何启动、如何监控状态及获取结果。', imageUrl: '' },
    ],
  },
  businessValue: {
    metrics: [
      { id: '1', label: '效率提升', value: '85%', subtext: '原流程耗时：4 小时 → OpenClaw：36 分钟', icon: 'trending-up' },
      { id: '2', label: '时间节约', value: '120h', subtext: '预计每月节约 120 小时，释放人员精力专注于核心业务', icon: 'clock' },
    ],
    footerNote: '注：此效果基于……的预估，将在实际运行后进行验证',
  },
  roadmap: {
    items: [
      { id: '1', task: '效果验证', content: '主要内容：[……]', date: '2026.04' },
      { id: '2', task: '脚本迭代', content: '主要内容：[……]', date: '2026.05' },
      { id: '3', task: '推广复制', content: '主要内容：[……]', date: '2026.06' },
    ],
  },
});

export default function App() {
  const [cases, setCases] = useState<Case[]>([]);
  const [activeView, setActiveView] = useState<'dashboard' | 'editor' | 'canvas'>('dashboard');
  const [currentCase, setCurrentCase] = useState<Case | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load from Local Storage
  useEffect(() => {
    const saved = localStorage.getItem('openclaw_cases');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCases(parsed);
        } else {
          setCases(INITIAL_CASES);
        }
      } catch (e) {
        console.error('Failed to load cases', e);
        setCases(INITIAL_CASES);
      }
    } else {
      setCases(INITIAL_CASES);
    }
  }, []);

  // Save to Local Storage
  const saveCases = (updatedCases: Case[]) => {
    setCases(updatedCases);
    localStorage.setItem('openclaw_cases', JSON.stringify(updatedCases));
  };

  const handleCreate = () => {
    const newCase = createNewCase();
    setCurrentCase(newCase);
    setActiveView('editor');
  };

  const handleDelete = (id: string) => {
    setConfirmDelete(id);
  };

  const confirmDeleteCase = () => {
    if (confirmDelete) {
      saveCases(cases.filter(c => c.id !== confirmDelete));
      setConfirmDelete(null);
      showToast('删除成功');
    }
  };

  const handleSave = () => {
    if (!currentCase) return;
    const updatedCase = { ...currentCase, lastModified: Date.now() };
    const existingIndex = cases.findIndex(c => c.id === currentCase.id);
    
    let newCases;
    if (existingIndex >= 0) {
      newCases = [...cases];
      newCases[existingIndex] = updatedCase;
    } else {
      newCases = [updatedCase, ...cases];
    }
    
    saveCases(newCases);
    setCurrentCase(updatedCase);
    showToast('保存成功！');
  };

  const formatVersion = (v: any) => {
    if (typeof v === 'number') return v.toFixed(1);
    return v;
  };

  const handlePublish = () => {
    if (!currentCase) return;
    const publishedCase = { 
      ...currentCase, 
      status: 'published' as const, 
      lastModified: Date.now(),
      version: currentCase.status === 'published' ? (currentCase.version + 0.1) : currentCase.version
    };
    
    const existingIndex = cases.findIndex(c => c.id === publishedCase.id);
    let newCases;
    if (existingIndex >= 0) {
      newCases = [...cases];
      newCases[existingIndex] = publishedCase;
    } else {
      newCases = [publishedCase, ...cases];
    }
    
    saveCases(newCases);
    setCurrentCase(publishedCase);
    setActiveView('canvas');
    showToast('发布成功！');
  };

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900">
      {activeView === 'dashboard' && (
        <Dashboard 
          cases={cases} 
          onCreate={handleCreate} 
          onEdit={(c: Case) => { setCurrentCase(c); setActiveView('editor'); }}
          onView={(c: Case) => { setCurrentCase(c); setActiveView('canvas'); }}
          onDelete={handleDelete}
        />
      )}

      {activeView === 'editor' && currentCase && (
        <Editor 
          caseData={currentCase} 
          setCaseData={setCurrentCase}
          onBack={() => setActiveView('dashboard')}
          onSave={handleSave}
          onPublish={handlePublish}
          showToast={showToast}
        />
      )}

      {activeView === 'canvas' && currentCase && (
        <CanvasView 
          caseData={currentCase} 
          onBack={() => setActiveView('dashboard')}
          onEdit={() => setActiveView('editor')}
          showToast={showToast}
        />
      )}

      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={`fixed bottom-8 left-1/2 px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-2 ${
              toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <X className="w-5 h-5" />}
            <span className="font-semibold text-sm">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            >
              <h3 className="text-lg font-bold text-neutral-900 mb-2">确认删除？</h3>
              <p className="text-neutral-500 text-sm mb-6">此操作无法撤销。</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 px-4 py-2 rounded-xl border border-neutral-200 text-sm font-semibold hover:bg-neutral-50 transition-all"
                >
                  取消
                </button>
                <button 
                  onClick={confirmDeleteCase}
                  className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-all"
                >
                  确认删除
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Dashboard Component ---
function Dashboard({ cases, onCreate, onEdit, onView, onDelete }: any) {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 flex items-center gap-2">
            <LayoutDashboard className="w-8 h-8 text-orange-500" />
            平安财服 OpenClaw 应用价值案例库
          </h1>
          <p className="text-neutral-500 mt-1 font-medium">汇聚全司业务优化智慧，打造数智化转型价值高地</p>
        </div>
        <button 
          onClick={onCreate}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg shadow-orange-100"
        >
          <Plus className="w-5 h-5" />
          新建案例
        </button>
      </header>

      {cases.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-3xl p-12 text-center">
          <div className="bg-neutral-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Rocket className="w-8 h-8 text-neutral-300" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-700">暂无案例</h3>
          <p className="text-neutral-400 mt-1">点击右上角按钮开始创建您的第一个案例。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((c: Case) => (
            <div key={c.id} className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm hover:shadow-md transition-all group">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    c.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {c.status === 'published' ? `v${c.version.toFixed(1)}` : '草稿'}
                  </span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(c)} className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-600">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(c.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-1 line-clamp-1">{c.title}</h3>
                <p className="text-neutral-500 text-xs line-clamp-2 mb-4">{c.subtitle}</p>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">作者</span>
                    <span className="text-xs font-semibold text-neutral-700">{c.author || '未填写'}</span>
                  </div>
                  <div className="w-[1px] h-6 bg-neutral-100" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">组织</span>
                    <span className="text-xs font-semibold text-neutral-700">{c.organization}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-neutral-50">
                  <span className="text-[10px] text-neutral-400">
                    最后修改: {new Date(c.lastModified).toLocaleDateString()}
                  </span>
                  <button 
                    onClick={() => onView(c)}
                    className="flex items-center gap-1 text-orange-500 font-bold text-xs hover:gap-2 transition-all"
                  >
                    查看画布 <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Editor Component ---
function Editor({ caseData, setCaseData, onBack, onSave, onPublish, showToast }: any) {
  const updateField = (section: string, field: string, value: any) => {
    setCaseData((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const addStep = () => {
    const newSteps = [...caseData.implementation.steps, { id: crypto.randomUUID(), title: '', description: '', imageUrl: '' }];
    updateField('implementation', 'steps', newSteps);
  };

  const removeStep = (index: number) => {
    const newSteps = caseData.implementation.steps.filter((_: any, i: number) => i !== index);
    updateField('implementation', 'steps', newSteps);
  };

  const addMetric = () => {
    const newMetrics = [...caseData.businessValue.metrics, { id: crypto.randomUUID(), label: '', value: '', subtext: '', icon: 'trending-up' }];
    updateField('businessValue', 'metrics', newMetrics);
  };

  const removeMetric = (index: number) => {
    const newMetrics = caseData.businessValue.metrics.filter((_: any, i: number) => i !== index);
    updateField('businessValue', 'metrics', newMetrics);
  };

  const addRoadmapItem = () => {
    const newItems = [...caseData.roadmap.items, { id: crypto.randomUUID(), task: '', content: '', date: '' }];
    updateField('roadmap', 'items', newItems);
  };

  const removeRoadmapItem = (index: number) => {
    const newItems = caseData.roadmap.items.filter((_: any, i: number) => i !== index);
    updateField('roadmap', 'items', newItems);
  };

  const handleImageUpload = (index: number, file: File) => {
    if (!file) return;
    
    // Check file size (limit to 1MB for localStorage safety)
    if (file.size > 1024 * 1024) {
      showToast('图片太大（超过 1MB），请上传较小的图片以确保本地保存成功。', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const newSteps = [...caseData.implementation.steps];
      newSteps[index].imageUrl = base64String;
      updateField('implementation', 'steps', newSteps);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 pb-24">
      <nav className="flex justify-between items-center mb-8 sticky top-0 bg-neutral-50/80 backdrop-blur-md py-4 z-10">
        <button onClick={onBack} className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 font-semibold transition-all">
          <ChevronLeft className="w-5 h-5" /> 返回列表
        </button>
        <div className="flex gap-3">
          <button onClick={onSave} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 font-semibold transition-all">
            <Save className="w-4 h-4" /> 保存草稿
          </button>
          <button onClick={onPublish} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600 font-semibold transition-all shadow-lg shadow-orange-100">
            <Eye className="w-4 h-4" /> 发布并预览
          </button>
        </div>
      </nav>

      <div className="space-y-8">
        {/* Basic Info */}
        <section className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <h2 className="text-lg font-bold mb-4">基础信息</h2>
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">案例标题</label>
                <input 
                  type="text" 
                  value={caseData.title || ''}
                  onChange={(e) => setCaseData({...caseData, title: e.target.value})}
                  placeholder="例如：某业务流程自动化优化案例"
                  className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">案例副标题</label>
                <input 
                  type="text" 
                  value={caseData.subtitle || ''}
                  onChange={(e) => setCaseData({...caseData, subtitle: e.target.value})}
                  placeholder="简短描述案例核心价值"
                  className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all text-neutral-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">作者姓名</label>
                <input 
                  type="text" 
                  value={caseData.author || ''}
                  onChange={(e) => setCaseData({...caseData, author: e.target.value})}
                  placeholder="请输入作者姓名"
                  className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">所属团队</label>
                <input 
                  type="text" 
                  value={caseData.team || ''}
                  onChange={(e) => setCaseData({...caseData, team: e.target.value})}
                  placeholder="请输入团队名称"
                  className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">所属组织</label>
                <select 
                  value={caseData.organization || '财服总部'}
                  onChange={(e) => setCaseData({...caseData, organization: e.target.value as any})}
                  className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all bg-white"
                >
                  <option value="财服总部">财服总部</option>
                  <option value="深圳分公司">深圳分公司</option>
                  <option value="上海分公司">上海分公司</option>
                  <option value="合肥分公司">合肥分公司</option>
                  <option value="成都分公司">成都分公司</option>
                  <option value="内江分公司">内江分公司</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Section 01: Challenges */}
        <section className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <h2 className="text-lg font-bold mb-4">01. 业务现状与挑战</h2>
          <div className="grid gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">业务背景</label>
              <textarea 
                value={caseData.challenges.background || ''}
                onChange={(e) => updateField('challenges', 'background', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">当前痛点 (每行一个)</label>
              <textarea 
                value={(caseData.challenges.painPoints || []).join('\n')}
                onChange={(e) => updateField('challenges', 'painPoints', e.target.value.split('\n'))}
                rows={4}
                className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">优化目标</label>
              <input 
                type="text" 
                value={caseData.challenges.objectives || ''}
                onChange={(e) => updateField('challenges', 'objectives', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
          </div>
        </section>

        {/* Section 02: Implementation */}
        <section className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">02. 核心实施步骤</h2>
            <button 
              onClick={addStep}
              className="flex items-center gap-1 text-xs font-bold text-orange-500 hover:text-orange-600 transition-all"
            >
              <Plus className="w-3 h-3" /> 添加步骤
            </button>
          </div>
          <div className="space-y-6">
            {caseData.implementation.steps.map((step: CaseStep, index: number) => (
              <div key={step.id} className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 relative group/step">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold text-orange-500 uppercase">步骤 {index + 1}</span>
                  <button 
                    onClick={() => removeStep(index)}
                    className="p-1 text-neutral-300 hover:text-red-500 transition-colors"
                    title="删除步骤"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <input 
                      type="text" 
                      placeholder="步骤标题"
                      value={step.title || ''}
                      onChange={(e) => {
                        const newSteps = [...caseData.implementation.steps];
                        newSteps[index].title = e.target.value;
                        updateField('implementation', 'steps', newSteps);
                      }}
                      className="w-full px-4 py-2 rounded-lg border border-neutral-200 outline-none"
                    />
                    <textarea 
                      placeholder="步骤说明"
                      value={step.description || ''}
                      onChange={(e) => {
                        const newSteps = [...caseData.implementation.steps];
                        newSteps[index].description = e.target.value;
                        updateField('implementation', 'steps', newSteps);
                      }}
                      rows={3}
                      className="w-full px-4 py-2 rounded-lg border border-neutral-200 outline-none"
                    />
                  </div>
                  <div>
                    <div className="flex gap-2 mb-2">
                      <input 
                        type="text" 
                        placeholder="图片 URL"
                        value={(step.imageUrl || '').startsWith('data:') ? '本地上传图片' : (step.imageUrl || '')}
                        disabled={(step.imageUrl || '').startsWith('data:')}
                        onChange={(e) => {
                          const newSteps = [...caseData.implementation.steps];
                          newSteps[index].imageUrl = e.target.value;
                          updateField('implementation', 'steps', newSteps);
                        }}
                        className="flex-1 px-4 py-2 rounded-lg border border-neutral-200 outline-none text-xs"
                      />
                      <label className="cursor-pointer bg-white border border-neutral-200 hover:bg-neutral-50 px-3 py-2 rounded-lg flex items-center gap-1 text-xs font-semibold transition-all">
                        <Upload className="w-3 h-3 text-orange-500" />
                        上传
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(index, file);
                          }}
                        />
                      </label>
                      {step.imageUrl.startsWith('data:') && (
                        <button 
                          onClick={() => {
                            const newSteps = [...caseData.implementation.steps];
                            newSteps[index].imageUrl = '';
                            updateField('implementation', 'steps', newSteps);
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="aspect-video bg-neutral-200 rounded-lg overflow-hidden relative group">
                      {step.imageUrl ? (
                        <img src={step.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400">
                          <ImageIcon className="w-6 h-6 mb-1 opacity-20" />
                          <span className="text-[10px]">暂无图片</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 03: Business Value */}
        <section className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">03. 预期业务价值</h2>
            <button 
              onClick={addMetric}
              className="flex items-center gap-1 text-xs font-bold text-orange-500 hover:text-orange-600 transition-all"
            >
              <Plus className="w-3 h-3" /> 添加指标
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {caseData.businessValue.metrics.map((metric: MetricCard, index: number) => (
              <div key={metric.id} className="p-4 bg-orange-50 rounded-xl border border-orange-100 relative group/metric">
                <button 
                  onClick={() => removeMetric(index)}
                  className="absolute top-2 right-2 p-1 text-orange-200 hover:text-red-500 transition-colors"
                  title="删除指标"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
                <div className="grid gap-2">
                  <input 
                    type="text" 
                    placeholder="指标名称"
                    value={metric.label || ''}
                    onChange={(e) => {
                      const newMetrics = [...caseData.businessValue.metrics];
                      newMetrics[index].label = e.target.value;
                      updateField('businessValue', 'metrics', newMetrics);
                    }}
                    className="bg-transparent border-b border-orange-200 outline-none font-bold text-orange-900"
                  />
                  <input 
                    type="text" 
                    placeholder="核心数据 (如 85%)"
                    value={metric.value || ''}
                    onChange={(e) => {
                      const newMetrics = [...caseData.businessValue.metrics];
                      newMetrics[index].value = e.target.value;
                      updateField('businessValue', 'metrics', newMetrics);
                    }}
                    className="bg-transparent border-b border-orange-200 outline-none text-2xl font-black text-orange-500"
                  />
                  <textarea 
                    placeholder="详细说明"
                    value={metric.subtext || ''}
                    onChange={(e) => {
                      const newMetrics = [...caseData.businessValue.metrics];
                      newMetrics[index].subtext = e.target.value;
                      updateField('businessValue', 'metrics', newMetrics);
                    }}
                    rows={2}
                    className="bg-transparent border-b border-orange-200 outline-none text-xs text-orange-700"
                  />
                </div>
              </div>
            ))}
          </div>
          <input 
            type="text" 
            placeholder="底部说明文字"
            value={caseData.businessValue.footerNote || ''}
            onChange={(e) => updateField('businessValue', 'footerNote', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-neutral-200 outline-none text-xs text-neutral-400"
          />
        </section>

        {/* Section 04: Roadmap */}
        <section className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">04. 下一步工作计划</h2>
            <button 
              onClick={addRoadmapItem}
              className="flex items-center gap-1 text-xs font-bold text-orange-500 hover:text-orange-600 transition-all"
            >
              <Plus className="w-3 h-3" /> 添加计划
            </button>
          </div>
          <div className="space-y-3">
            {caseData.roadmap.items.map((item: RoadmapItem, index: number) => (
              <div key={item.id} className="flex gap-3 items-start p-3 bg-neutral-50 rounded-lg group/roadmap">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input 
                    type="text" 
                    placeholder="任务名称"
                    value={item.task || ''}
                    onChange={(e) => {
                      const newItems = [...caseData.roadmap.items];
                      newItems[index].task = e.target.value;
                      updateField('roadmap', 'items', newItems);
                    }}
                    className="px-3 py-1 rounded border border-neutral-200 outline-none font-bold text-sm"
                  />
                  <input 
                    type="text" 
                    placeholder="主要内容"
                    value={item.content || ''}
                    onChange={(e) => {
                      const newItems = [...caseData.roadmap.items];
                      newItems[index].content = e.target.value;
                      updateField('roadmap', 'items', newItems);
                    }}
                    className="px-3 py-1 rounded border border-neutral-200 outline-none text-sm"
                  />
                  <input 
                    type="text" 
                    placeholder="时间 (YYYY.MM)"
                    value={item.date || ''}
                    onChange={(e) => {
                      const newItems = [...caseData.roadmap.items];
                      newItems[index].date = e.target.value;
                      updateField('roadmap', 'items', newItems);
                    }}
                    className="px-3 py-1 rounded border border-neutral-200 outline-none text-neutral-500 text-sm"
                  />
                </div>
                <button 
                  onClick={() => removeRoadmapItem(index)}
                  className="mt-1.5 p-1 text-neutral-300 hover:text-red-500 transition-colors"
                  title="删除计划"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// --- Value Canvas Visualization (The PPT View) ---
function CanvasView({ caseData, onBack, onEdit, showToast }: any) {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleExportPptx = async () => {
    try {
      setIsExporting(true);
      showToast('正在生成 PPTX...');
      await exportToPptx(caseData);
      showToast('导出成功！');
    } catch (error) {
      console.error('Export failed', error);
      showToast('导出失败，请重试', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-50 z-50 overflow-auto flex flex-col font-sans selection:bg-orange-100 selection:text-orange-900">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-neutral-200/50 px-8 py-4 flex justify-between items-center shrink-0 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-6">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack} 
            className="p-2.5 hover:bg-neutral-100 rounded-full transition-all text-neutral-500 hover:text-neutral-900"
          >
            <X className="w-5 h-5" />
          </motion.button>
          <div className="space-y-0.5">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-neutral-900 tracking-tight">{caseData.title}</h1>
              <span className="px-2 py-0.5 bg-orange-500 text-white text-[10px] font-mono font-bold rounded uppercase tracking-wider shadow-sm shadow-orange-200">
                v{caseData.version.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium tracking-wide">
              <span>{caseData.subtitle}</span>
              <span className="text-neutral-300">|</span>
              <span>{caseData.organization} · {caseData.team} · {caseData.author}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onEdit} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-xs font-bold transition-all hover:shadow-sm active:scale-95">
            <Edit3 className="w-3.5 h-3.5" /> 编辑画布
          </button>
          <button 
            onClick={handleExportPptx} 
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600 text-xs font-bold transition-all disabled:opacity-50 shadow-lg shadow-orange-200 active:scale-95"
          >
            <Presentation className="w-3.5 h-3.5" /> {isExporting ? '导出中...' : '导出 PPTX'}
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 text-white hover:bg-black text-xs font-bold transition-all shadow-lg shadow-neutral-200 active:scale-95">
            <Save className="w-3.5 h-3.5" /> 打印 PDF
          </button>
        </div>
      </div>

      {/* Canvas Content */}
      <div className="flex-1 p-8 flex gap-6 min-h-[850px] max-w-[1600px] mx-auto w-full">
        {/* Left: Challenges */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-1/4 flex flex-col gap-6 h-full"
        >
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-neutral-200/50 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center border border-orange-100">
                  <Search className="w-5 h-5 text-orange-500" />
                </div>
                <h2 className="text-lg font-bold text-neutral-900 tracking-tight">01. 业务现状与痛点</h2>
              </div>
              <div className="px-3 py-1 rounded-full bg-neutral-50 border border-neutral-100 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                Context
              </div>
            </div>
            
            <div className="flex-1 overflow-auto pr-2 custom-scrollbar space-y-10">
              <section>
                <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-neutral-300" /> Background
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed font-medium pl-4 border-l-2 border-orange-500/20">{caseData.challenges.background}</p>
              </section>
              
              <section>
                <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-neutral-300" /> Pain Points
                </h3>
                <ul className="space-y-4 pl-1">
                  {caseData.challenges.painPoints.map((point: string, i: number) => (
                    <li key={i} className="flex gap-4 items-start group">
                      <div className="w-6 h-6 bg-neutral-50 text-neutral-400 group-hover:bg-orange-500 group-hover:text-white rounded-lg flex items-center justify-center shrink-0 text-[10px] font-mono font-bold transition-all shadow-sm border border-neutral-100">
                        {i + 1}
                      </div>
                      <span className="text-sm text-neutral-700 font-bold leading-snug pt-0.5">{point}</span>
                    </li>
                  ))}
                </ul>
              </section>
              
              <section className="pt-6">
                <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-neutral-300" /> Objectives
                </h3>
                <div className="bg-gradient-to-br from-neutral-900 to-black text-white p-6 rounded-3xl shadow-xl shadow-neutral-200 relative overflow-hidden group">
                  <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500 text-orange-500">
                    <Zap className="w-24 h-24" />
                  </div>
                  <div className="relative z-10">
                    <div className="w-8 h-8 rounded-xl bg-orange-500/20 flex items-center justify-center mb-4 border border-orange-500/30">
                      <Target className="w-4 h-4 text-orange-500" />
                    </div>
                    <p className="text-sm font-bold italic leading-relaxed text-neutral-100">“{caseData.challenges.objectives}”</p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </motion.div>

        {/* Middle: Implementation */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-2/5 flex flex-col gap-6 h-full"
        >
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-neutral-200/50 flex-1 flex flex-col relative overflow-hidden min-h-0">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center border border-orange-100">
                  <Zap className="w-5 h-5 text-orange-500" />
                </div>
                <h2 className="text-lg font-bold text-neutral-900 tracking-tight">02. 核心实施路径</h2>
              </div>
              <div className="px-3 py-1 rounded-full bg-neutral-50 border border-neutral-100 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                Strategy
              </div>
            </div>

            <div className="flex-1 overflow-auto pr-2 custom-scrollbar relative">
              <div className="flex flex-col gap-12 relative">
                {/* Timeline Line */}
                <div className="absolute left-[calc(50%-1px)] top-4 bottom-4 w-[2px] bg-neutral-50 hidden md:block" />
                
                {caseData.implementation.steps.map((step: CaseStep, i: number) => (
                  <div key={step.id} className="relative flex gap-8 items-center group/step">
                    <div className="w-1/2 text-right pr-4">
                      <div className="inline-flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-mono font-bold text-orange-500 tracking-widest uppercase">Step 0{i+1}</span>
                        <div className="w-2 h-[1px] bg-orange-200" />
                      </div>
                      <h3 className="text-base font-bold text-neutral-900 mb-2 group-hover/step:text-orange-500 transition-colors">{step.title}</h3>
                      <p className="text-xs text-neutral-500 leading-relaxed font-medium line-clamp-3 group-hover/step:line-clamp-none transition-all">{step.description}</p>
                    </div>
                    
                    <div 
                      onClick={() => step.imageUrl && setSelectedImage(step.imageUrl)}
                      className={`w-1/2 aspect-video rounded-2xl overflow-hidden border border-neutral-100 shadow-sm bg-neutral-50 flex items-center justify-center relative group-hover/step:shadow-md transition-all ${step.imageUrl ? 'cursor-zoom-in' : ''}`}
                    >
                      {step.imageUrl ? (
                        <img src={step.imageUrl} alt="" className="w-full h-full object-cover group-hover/step:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <ImageIcon className="w-8 h-8 text-neutral-200" />
                          <span className="text-[10px] text-neutral-300 font-bold uppercase tracking-widest">No Image</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover/step:bg-black/5 transition-colors" />
                    </div>

                    {/* Step Dot */}
                    <div className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-4 border-white bg-orange-500 shadow-md z-10 hidden md:block group-hover/step:scale-125 transition-transform" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right: Value & Roadmap */}
        <div className="w-[35%] flex flex-col gap-6">
          {/* 03. Business Value */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex-[1.2] min-h-0 bg-neutral-900 rounded-[2rem] p-8 shadow-2xl flex flex-col relative overflow-hidden group/canvas-section"
          >
            {/* Background Accents */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[100px] -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 blur-[80px] -ml-24 -mb-24" />
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                </div>
                <h2 className="text-lg font-bold text-white tracking-tight">03. 预期业务价值</h2>
              </div>
              <div className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-[10px] font-bold text-orange-500 uppercase tracking-widest">
                Impact
              </div>
            </div>

            <div className="flex-1 overflow-auto pr-2 custom-scrollbar mb-6 relative z-10">
              <div className="grid grid-cols-1 gap-4">
                {caseData.businessValue.metrics.map((metric: MetricCard) => (
                  <div key={metric.id} className="bg-white/[0.03] border border-white/10 rounded-3xl p-5 hover:bg-white/[0.08] hover:border-white/20 transition-all group/metric relative overflow-hidden">
                    {/* Metric Icon Background Accent */}
                    <div className="absolute -right-4 -bottom-4 opacity-0 group-hover/metric:opacity-5 transition-opacity">
                      {metric.icon === 'clock' && <Clock className="w-24 h-24" />}
                      {metric.icon === 'calendar' && <Calendar className="w-24 h-24" />}
                      {metric.icon === 'zap' && <Zap className="w-24 h-24" />}
                      {metric.icon === 'trending-up' && <TrendingUp className="w-24 h-24" />}
                    </div>

                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-white/5 text-neutral-400 group-hover/metric:text-orange-500 group-hover/metric:bg-orange-500/10 transition-colors">
                          {metric.icon === 'clock' && <Clock className="w-3.5 h-3.5" />}
                          {metric.icon === 'calendar' && <Calendar className="w-3.5 h-3.5" />}
                          {metric.icon === 'zap' && <Zap className="w-3.5 h-3.5" />}
                          {metric.icon === 'trending-up' && <TrendingUp className="w-3.5 h-3.5" />}
                        </div>
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em]">{metric.label}</span>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-mono font-black text-white tracking-tighter group-hover/metric:text-orange-500 transition-colors">
                        {metric.value}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-3 font-medium leading-relaxed group-hover/metric:text-neutral-300 transition-colors">{metric.subtext}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-auto pt-6 border-t border-white/10 relative z-10">
              <div className="flex gap-3 items-start bg-white/5 p-4 rounded-2xl border border-white/5">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                <p className="text-[10px] text-neutral-400 italic font-medium leading-relaxed">{caseData.businessValue.footerNote}</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex-1 min-h-0 bg-white rounded-[2rem] p-8 shadow-sm border border-neutral-200/50 flex flex-col group/canvas-section"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center border border-orange-100">
                  <Rocket className="w-5 h-5 text-orange-500" />
                </div>
                <h2 className="text-lg font-bold text-neutral-900 tracking-tight">04. 下一步工作计划</h2>
              </div>
              <div className="px-3 py-1 rounded-full bg-neutral-50 border border-neutral-100 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                Roadmap
              </div>
            </div>

            <div className="flex-1 overflow-auto pr-2 custom-scrollbar relative">
              {/* Vertical Line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-[1px] bg-neutral-100" />
              
              <div className="space-y-8 relative">
                {caseData.roadmap.items.map((item: RoadmapItem) => (
                  <div key={item.id} className="flex gap-6 items-start group/roadmap-item">
                    <div className="relative z-10 mt-1.5">
                      <div className="w-6 h-6 rounded-full bg-white border-2 border-neutral-100 flex items-center justify-center group-hover/roadmap-item:border-orange-500 transition-colors shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-neutral-200 group-hover/roadmap-item:bg-orange-500 transition-colors" />
                      </div>
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-neutral-900 tracking-tight group-hover/roadmap-item:text-orange-500 transition-colors">
                          {item.task}
                        </span>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-neutral-50 rounded-md border border-neutral-100">
                          <Calendar className="w-2.5 h-2.5 text-neutral-400" />
                          <span className="text-[10px] font-mono font-bold text-neutral-500 tracking-tight">{item.date}</span>
                        </div>
                      </div>
                      <p className="text-xs text-neutral-500 leading-relaxed font-medium bg-neutral-50/50 p-3 rounded-xl border border-neutral-100/50 group-hover/roadmap-item:bg-white group-hover/roadmap-item:shadow-sm transition-all">
                        {item.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-neutral-200/50 px-10 py-6 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.4em]">OpenClaw Value Canvas Framework v1.0</span>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-neutral-300 text-[10px] font-bold tracking-[0.2em] uppercase">Confidential</div>
          <div className="text-neutral-900 text-[10px] font-bold tracking-[0.2em] uppercase">Q&A Session</div>
        </div>
      </div>

      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={selectedImage}
              alt="Full view"
              className="max-w-full max-h-full rounded-xl shadow-2xl object-contain"
              referrerPolicy="no-referrer"
            />
            <button 
              className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors p-2"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-8 h-8" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e5e5;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d4d4d4;
        }
        @media print {
          .fixed { position: relative !important; }
          button { display: none !important; }
          .bg-neutral-50 { background: white !important; }
          .shadow-sm, .shadow-xl, .shadow-lg, .shadow-2xl { box-shadow: none !important; border: 1px solid #eee !important; }
          .rounded-[2rem], .rounded-3xl { border-radius: 1rem !important; }
          .min-h-[850px] { min-h-0 !important; }
          .max-w-[1600px] { max-w-none !important; }
        }
      `}} />
    </div>
  );
}

