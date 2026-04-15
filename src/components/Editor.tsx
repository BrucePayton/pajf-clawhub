import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Save, Globe, Target, Zap, TrendingUp, Calendar, Plus, Trash2, Clock, CheckCircle, Rocket, Layout, ChevronRight, Info, Upload, Image as ImageIcon, Lock, Eye, GripVertical } from 'lucide-react';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Case, CaseStep, MetricCard, RoadmapItem, CaseType } from '../types';

type CaseTypeConfig = {
  label: string;
  focusHint: string;
  challengeLabel: string;
  challengePlaceholder: string;
  implementationTitle: string;
  stepTitlePlaceholder: string;
  stepDescPlaceholder: string;
  metricTitle: string;
};

const CASE_TYPE_CONFIG: Record<CaseType, CaseTypeConfig> = {
  openclaw_app: {
    label: 'OpenClaw应用案例',
    focusHint: '侧重步骤方法，建议按实施顺序填写关键步骤。',
    challengeLabel: '业务背景',
    challengePlaceholder: '描述流程背景、当前方式与优化起点...',
    implementationTitle: '实施步骤与方法',
    stepTitlePlaceholder: '步骤标题（如：任务创建）',
    stepDescPlaceholder: '描述操作方法、输入输出与注意事项',
    metricTitle: '实施效果',
  },
  tool_app: {
    label: '小工具应用案例',
    focusHint: '侧重设计和效果，建议突出设计思路与可复用价值。',
    challengeLabel: '设计背景',
    challengePlaceholder: '描述工具设计动机、用户场景与约束...',
    implementationTitle: '设计实现过程',
    stepTitlePlaceholder: '设计阶段（如：原型设计）',
    stepDescPlaceholder: '描述设计方案、实现方式与验证过程',
    metricTitle: '效果评估',
  },
  rpa_app: {
    label: 'RPA应用案例',
    focusHint: '侧重步骤方法及上下游系统，流程关系要清晰。',
    challengeLabel: '流程背景',
    challengePlaceholder: '描述流程瓶颈、人工痛点与自动化目标...',
    implementationTitle: '自动化实施步骤',
    stepTitlePlaceholder: '流程步骤（如：数据抓取）',
    stepDescPlaceholder: '描述机器人步骤、规则与异常处理',
    metricTitle: '自动化收益',
  },
  agent_app: {
    label: 'Agent案例',
    focusHint: '侧重步骤方法及关键点，建议提炼可复用策略。',
    challengeLabel: '任务背景',
    challengePlaceholder: '描述任务目标、边界条件与挑战...',
    implementationTitle: 'Agent执行步骤',
    stepTitlePlaceholder: '步骤标题（如：意图识别）',
    stepDescPlaceholder: '描述关键策略、上下文管理与判定逻辑',
    metricTitle: '关键效果',
  },
  dashboard_app: {
    label: '看板案例',
    focusHint: '侧重数据维度、指标分析与用法，保证可读可用。',
    challengeLabel: '分析背景',
    challengePlaceholder: '描述业务分析目标、看板对象与问题...',
    implementationTitle: '看板构建步骤',
    stepTitlePlaceholder: '构建步骤（如：指标建模）',
    stepDescPlaceholder: '描述维度设计、口径定义与可视化方案',
    metricTitle: '指标分析结果',
  },
};

interface EditorProps {
  caseData: Case;
  setCaseData: (c: Case | ((prev: any) => any)) => void;
  onBack: () => void;
  onSave: () => void;
  onPublish: () => void;
  onVisibilityPreferenceChange?: (isPublic: boolean) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'loading') => void;
}

export const Editor: React.FC<EditorProps> = ({
  caseData,
  setCaseData,
  onBack,
  onSave,
  onPublish,
  onVisibilityPreferenceChange,
  showToast
}) => {
  const clearTemplateText = (value: string) => {
    if (
      value.includes('业务背景描述：') ||
      value.includes('痛点 1：[……]') ||
      value.includes('主要内容：[……]') ||
      value.includes('详细描述在该步骤中需要执行的操作。') ||
      value.includes('详细描述该步骤的关键设置或代码片段说明。') ||
      value.includes('描述任务如何启动、如何监控状态及获取结果。')
    ) {
      return '';
    }
    return value;
  };

  const caseType: CaseType = caseData.caseType || 'openclaw_app';
  const caseTypeConfig = CASE_TYPE_CONFIG[caseType];
  const meta = caseData.caseTypeMeta || {};

  const setMeta = (partial: Record<string, any>) => {
    setCaseData({
      ...caseData,
      caseTypeMeta: {
        ...meta,
        ...partial,
      },
    });
  };

  const compressImageToDataUrl = (file: File, maxEdge: number, quality: number): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('图片读取失败'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('图片解析失败'));
        img.onload = () => {
          const longerEdge = Math.max(img.width, img.height) || 1;
          const scale = Math.min(1, maxEdge / longerEdge);
          const targetWidth = Math.max(1, Math.round(img.width * scale));
          const targetHeight = Math.max(1, Math.round(img.height * scale));

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('图片压缩失败'));
            return;
          }

          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });

  const handleImageUpload = async (index: number, file: File) => {
    if (!file) return;

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast('图片超过 10MB，请压缩后再上传', 'info');
      return;
    }

    try {
      let base64String = await compressImageToDataUrl(file, 1600, 0.82);
      // 兜底：如果仍然偏大，再压缩一次以降低请求体体积
      if (base64String.length > 900 * 1024) {
        base64String = await compressImageToDataUrl(file, 1280, 0.72);
      }

      const newSteps = [...(caseData.implementation?.steps || [])];
      newSteps[index].imageUrl = base64String;
      setCaseData((prev: any) => ({
        ...prev,
        implementation: {
          ...prev.implementation,
          steps: newSteps
        }
      }));
    } catch (error) {
      console.error('Failed to process image:', error);
      showToast('图片处理失败，请重试。', 'error');
    }
  };
  const addStep = () => {
    const newStep: CaseStep = { id: Date.now().toString(), title: '', description: '', imageUrl: '' };
    setCaseData((prev: any) => ({ ...prev, implementation: { ...prev.implementation, steps: [...(prev.implementation?.steps || []), newStep] } }));
  };

  const removeStep = (id: string) => {
    setCaseData((prev: any) => ({ ...prev, implementation: { ...prev.implementation, steps: (prev.implementation?.steps || []).filter((s: any) => s.id !== id) } }));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const currentSteps = [...(caseData.implementation?.steps ?? [])];
    const oldIndex = currentSteps.findIndex((s) => s.id === String(active.id));
    const newIndex = currentSteps.findIndex((s) => s.id === String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(currentSteps, oldIndex, newIndex);
    setCaseData({
      ...caseData,
      implementation: {
        ...caseData.implementation,
        steps: reordered,
      },
    });
  };

  const SortableStepCard: React.FC<{ step: CaseStep; index: number }> = ({ step, index }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: step.id });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <motion.div
        ref={setNodeRef}
        style={style}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`p-5 bg-neutral-50/50 rounded-2xl border border-neutral-200/60 flex gap-5 items-start group ${isDragging ? 'shadow-xl ring-2 ring-brand-200 bg-white' : ''}`}
      >
        <div className="flex flex-col items-center gap-2 shrink-0">
          <div className="w-10 h-10 bg-white border border-neutral-200/60 rounded-xl flex items-center justify-center font-bold text-neutral-400">
            {index + 1}
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg bg-neutral-100 text-neutral-400 hover:text-brand-600 hover:bg-brand-50 cursor-grab active:cursor-grabbing"
            title="拖拽调整顺序"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-2">
            <input
              type="text"
              value={step.title}
              onChange={(e) => {
                const newSteps = [...(caseData.implementation?.steps ?? [])];
                newSteps[index].title = e.target.value;
                setCaseData({ ...caseData, implementation: { ...caseData.implementation, steps: newSteps } });
              }}
              onFocus={(e) => {
                const next = clearTemplateText(e.currentTarget.value);
                if (next !== e.currentTarget.value) {
                  const newSteps = [...(caseData.implementation?.steps ?? [])];
                  newSteps[index].title = next;
                  setCaseData({ ...caseData, implementation: { ...caseData.implementation, steps: newSteps } });
                }
              }}
              className={`w-full px-4 py-2 bg-white border border-neutral-200/60 rounded-lg focus:border-brand-500 transition-all outline-none font-bold text-sm ${
                clearTemplateText(step.title) === '' && step.title ? 'text-neutral-300' : ''
              }`}
              placeholder={caseTypeConfig.stepTitlePlaceholder}
            />
            <textarea
              value={step.description}
              onChange={(e) => {
                const newSteps = [...(caseData.implementation?.steps ?? [])];
                newSteps[index].description = e.target.value;
                setCaseData({ ...caseData, implementation: { ...caseData.implementation, steps: newSteps } });
              }}
              onFocus={(e) => {
                const next = clearTemplateText(e.currentTarget.value);
                if (next !== e.currentTarget.value) {
                  const newSteps = [...(caseData.implementation?.steps ?? [])];
                  newSteps[index].description = next;
                  setCaseData({ ...caseData, implementation: { ...caseData.implementation, steps: newSteps } });
                }
              }}
              className={`w-full px-4 py-2 bg-white border border-neutral-200/60 rounded-lg focus:border-brand-500 transition-all outline-none text-xs min-h-[60px] resize-none ${
                clearTemplateText(step.description) === '' && step.description ? 'text-neutral-300' : 'text-neutral-500'
              }`}
              placeholder={caseTypeConfig.stepDescPlaceholder}
            />
          </div>
          <div className="flex flex-col gap-2 items-center">
            <div className="relative group/img w-24 h-16 bg-white border border-dashed border-neutral-200 rounded-lg overflow-hidden flex items-center justify-center">
              {step.imageUrl ? (
                <>
                  <img src={step.imageUrl} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <label className="p-1.5 bg-white/20 hover:bg-white/40 rounded-lg cursor-pointer transition-colors">
                      <Upload className="w-3 h-3 text-white" />
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(index, e.target.files[0])} />
                    </label>
                    <button
                      onClick={() => {
                        const newSteps = [...(caseData.implementation?.steps ?? [])];
                        newSteps[index].imageUrl = '';
                        setCaseData({ ...caseData, implementation: { ...caseData.implementation, steps: newSteps } });
                      }}
                      className="p-1.5 bg-white/20 hover:bg-red-500/40 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3 h-3 text-white" />
                    </button>
                  </div>
                </>
              ) : (
                <label className="flex flex-col items-center gap-1 cursor-pointer hover:text-brand-500 transition-colors">
                  <ImageIcon className="w-4 h-4 text-neutral-300" />
                  <span className="text-[8px] font-bold text-neutral-400 uppercase">上传图片</span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(index, e.target.files[0])} />
                </label>
              )}
            </div>
            <button
              onClick={() => removeStep(step.id)}
              className="p-2 text-neutral-300 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  const addMetric = () => {
    const newMetric: MetricCard = { id: Date.now().toString(), label: '', value: '', subtext: '', icon: 'trending-up' };
    setCaseData((prev: any) => ({ ...prev, businessValue: { ...prev.businessValue, metrics: [...(prev.businessValue?.metrics || []), newMetric] } }));
  };

  const removeMetric = (id: string) => {
    setCaseData((prev: any) => ({ ...prev, businessValue: { ...prev.businessValue, metrics: (prev.businessValue?.metrics || []).filter((m: any) => m.id !== id) } }));
  };

  const addRoadmapItem = () => {
    const newItem: RoadmapItem = { id: Date.now().toString(), task: '', content: '', date: '' };
    setCaseData((prev: any) => ({ ...prev, roadmap: { ...prev.roadmap, items: [...(prev.roadmap?.items || []), newItem] } }));
  };

  const removeRoadmapItem = (id: string) => {
    setCaseData((prev: any) => ({ ...prev, roadmap: { ...prev.roadmap, items: (prev.roadmap?.items || []).filter((i: any) => i.id !== id) } }));
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-neutral-200/60 px-8 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="p-2.5 hover:bg-neutral-100 rounded-xl transition-all text-neutral-400 hover:text-neutral-900 active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-8 w-px bg-neutral-200/60" />
          <div>
            <div className="flex items-center gap-3 mb-0.5">
              <h1 className="text-lg font-bold text-neutral-900 tracking-tight">{caseData.title || '未命名案例'}</h1>
              <span className="px-1.5 py-0.5 bg-neutral-100 text-neutral-500 rounded-md text-[10px] font-bold uppercase tracking-wider">v{(caseData.version ?? 0).toFixed(1)}</span>
            </div>
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Globe className="w-3 h-3" />
              {caseData.organization || '未指定组织'} · {caseTypeConfig.label}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-neutral-50 rounded-xl border border-neutral-200">
            <label className="flex items-center gap-2 cursor-pointer">
              <button
                type="button"
                onClick={() => {
                  const nextPublic = !caseData.isPublic;
                  setCaseData({ ...caseData, isPublic: nextPublic });
                  onVisibilityPreferenceChange?.(nextPublic);
                }}
                className={`relative w-11 h-6 rounded-full transition-colors ${caseData.isPublic ? 'bg-brand-500' : 'bg-neutral-300'}`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${caseData.isPublic ? 'translate-x-5' : 'translate-x-0.5'}`}
                />
              </button>
              <span className="text-xs font-bold text-neutral-600 flex items-center gap-1.5">
                {caseData.isPublic ? (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    公开
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    私密
                  </>
                )}
              </span>
            </label>
          </div>
          <button
            onClick={onSave}
            className="btn-secondary text-sm"
          >
            <Save className="w-4 h-4" />
            保存草稿
          </button>
          <button
            onClick={onPublish}
            className="btn-primary text-sm"
          >
            <Rocket className="w-4 h-4" />
            发布更新
          </button>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-5xl mx-auto w-full space-y-8">
        <section className="card-modern p-8 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
              <Info className="w-5 h-5 text-brand-500" />
            </div>
            <h2 className="text-lg font-bold text-neutral-900">基本信息</h2>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">案例名称</label>
              <input 
                type="text" 
                value={caseData.title}
                onChange={(e) => setCaseData({ ...caseData, title: e.target.value })}
                className="input-modern"
                placeholder="输入案例标题..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">副标题</label>
              <input 
                type="text" 
                value={caseData.subtitle}
                onChange={(e) => setCaseData({ ...caseData, subtitle: e.target.value })}
                className="input-modern"
                placeholder="输入副标题..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">作者姓名</label>
              <input 
                type="text" 
                value={caseData.author}
                onChange={(e) => setCaseData({ ...caseData, author: e.target.value })}
                className="input-modern"
                placeholder="输入作者姓名..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">员工UM号</label>
              <input 
                type="text" 
                value={caseData.umNumber}
                onChange={(e) => setCaseData({ ...caseData, umNumber: e.target.value })}
                className="input-modern"
                placeholder="输入UM号..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">所属团队</label>
              <input 
                type="text" 
                value={caseData.team}
                onChange={(e) => setCaseData({ ...caseData, team: e.target.value })}
                className="input-modern"
                placeholder="输入团队名称..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">所属组织</label>
              <select 
                value={caseData.organization}
                onChange={(e) => setCaseData({ ...caseData, organization: e.target.value as any })}
                className="input-modern appearance-none"
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
        </section>

        <section className="card-modern p-8 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-neutral-900">核心挑战</h2>
          </div>
          <p className="text-xs text-neutral-500 -mt-2">{caseTypeConfig.focusHint}</p>
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">{caseTypeConfig.challengeLabel}</label>
              <textarea 
                value={caseData.challenges?.background ?? ''}
                onChange={(e) => setCaseData({ ...caseData, challenges: { ...caseData.challenges, background: e.target.value } })}
                onFocus={(e) => {
                  const next = clearTemplateText(e.currentTarget.value);
                  if (next !== e.currentTarget.value) {
                    setCaseData({ ...caseData, challenges: { ...caseData.challenges, background: next } });
                  }
                }}
                className="input-modern min-h-[100px] resize-none"
                placeholder={caseTypeConfig.challengePlaceholder}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">核心目标</label>
              <textarea 
                value={caseData.challenges?.objectives ?? ''}
                onChange={(e) => setCaseData({ ...caseData, challenges: { ...caseData.challenges, objectives: e.target.value } })}
                onFocus={(e) => {
                  const next = clearTemplateText(e.currentTarget.value);
                  if (next !== e.currentTarget.value) {
                    setCaseData({ ...caseData, challenges: { ...caseData.challenges, objectives: next } });
                  }
                }}
                className="input-modern min-h-[80px] resize-none"
                placeholder="描述项目目标..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">关键痛点 (以逗号分隔)</label>
              <input 
                type="text" 
                value={(caseData.challenges?.painPoints ?? []).join(', ')}
                onChange={(e) => setCaseData({ ...caseData, challenges: { ...caseData.challenges, painPoints: e.target.value.split(',').map(s => s.trim()) } })}
                className="input-modern"
                placeholder="痛点1, 痛点2, 痛点3..."
              />
            </div>
          </div>
        </section>

        <section className="card-modern p-8 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Layout className="w-5 h-5 text-blue-500" />
              </div>
              <h2 className="text-lg font-bold text-neutral-900">{caseTypeConfig.implementationTitle}</h2>
            </div>
            <button 
              onClick={addStep}
              className="px-4 py-2 bg-neutral-50 text-neutral-600 rounded-xl font-bold hover:bg-neutral-100 transition-all flex items-center gap-2 text-sm border border-neutral-200/60"
            >
              <Plus className="w-4 h-4" />
              添加步骤
            </button>
          </div>
          <div className="space-y-4">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={(caseData.implementation?.steps ?? []).map((s) => s.id)} strategy={verticalListSortingStrategy}>
                {(caseData.implementation?.steps ?? []).map((step, index) => (
                  <SortableStepCard key={step.id} step={step} index={index} />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </section>

        <section className="card-modern p-8 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-brand-500" />
              </div>
              <h2 className="text-lg font-bold text-neutral-900">{caseTypeConfig.metricTitle}</h2>
            </div>
            <button 
              onClick={addMetric}
              className="px-4 py-2 bg-neutral-50 text-neutral-600 rounded-xl font-bold hover:bg-neutral-100 transition-all flex items-center gap-2 text-sm border border-neutral-200/60"
            >
              <Plus className="w-4 h-4" />
              添加指标
            </button>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {(caseData.businessValue?.metrics ?? []).map((metric, index) => (
              <motion.div 
                key={metric.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 bg-neutral-50/50 rounded-2xl border border-neutral-200/60 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {['trending-up', 'zap', 'clock', 'calendar'].map((iconName) => (
                      <button
                        key={iconName}
                        onClick={() => {
                          const newMetrics = [...(caseData.businessValue?.metrics ?? [])];
                          newMetrics[index].icon = iconName as any;
                          setCaseData({ ...caseData, businessValue: { ...caseData.businessValue, metrics: newMetrics } });
                        }}
                        className={`p-2 rounded-lg transition-all ${metric.icon === iconName ? 'bg-brand-500 text-white shadow-md shadow-brand-100' : 'bg-white text-neutral-400 hover:bg-neutral-100 border border-neutral-200/60'}`}
                      >
                        {iconName === 'trending-up' && <TrendingUp className="w-4 h-4" />}
                        {iconName === 'zap' && <Zap className="w-4 h-4" />}
                        {iconName === 'clock' && <Clock className="w-4 h-4" />}
                        {iconName === 'calendar' && <Calendar className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => removeMetric(metric.id)}
                    className="p-2 text-neutral-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  <input 
                    type="text" 
                    value={metric.label}
                    onChange={(e) => {
                      const newMetrics = [...(caseData.businessValue?.metrics ?? [])];
                      newMetrics[index].label = e.target.value;
                      setCaseData({ ...caseData, businessValue: { ...caseData.businessValue, metrics: newMetrics } });
                    }}
                    className="w-full px-4 py-2 bg-white border border-neutral-200/60 rounded-lg focus:border-brand-500 transition-all outline-none font-bold text-xs uppercase tracking-wider text-neutral-400"
                    placeholder="指标名称"
                  />
                  <input 
                    type="text" 
                    value={metric.value}
                    onChange={(e) => {
                      const newMetrics = [...(caseData.businessValue?.metrics ?? [])];
                      newMetrics[index].value = e.target.value;
                      setCaseData({ ...caseData, businessValue: { ...caseData.businessValue, metrics: newMetrics } });
                    }}
                    className="w-full px-4 py-2 bg-white border border-neutral-200/60 rounded-lg focus:border-brand-500 transition-all outline-none font-bold text-xl text-brand-600"
                    placeholder="指标数值"
                  />
                  <input 
                    type="text" 
                    value={metric.subtext}
                    onChange={(e) => {
                      const newMetrics = [...(caseData.businessValue?.metrics ?? [])];
                      newMetrics[index].subtext = e.target.value;
                      setCaseData({ ...caseData, businessValue: { ...caseData.businessValue, metrics: newMetrics } });
                    }}
                    className="w-full px-4 py-2 bg-white border border-neutral-200/60 rounded-lg focus:border-brand-500 transition-all outline-none text-[10px] text-neutral-500"
                    placeholder="辅助说明"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {(caseType === 'tool_app' || caseType === 'rpa_app' || caseType === 'agent_app' || caseType === 'dashboard_app') && (
          <section className="card-modern p-8 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-orange-500" />
              </div>
              <h2 className="text-lg font-bold text-neutral-900">类型关键补充</h2>
            </div>

            {caseType === 'tool_app' && (
              <div className="grid grid-cols-1 gap-4">
                <textarea
                  value={meta.designHighlights ?? ''}
                  onChange={(e) => setMeta({ designHighlights: e.target.value })}
                  className="input-modern min-h-[90px] resize-none"
                  placeholder="设计要点：架构设计、交互设计、可维护性考虑..."
                />
                <textarea
                  value={meta.effectSummary ?? ''}
                  onChange={(e) => setMeta({ effectSummary: e.target.value })}
                  className="input-modern min-h-[90px] resize-none"
                  placeholder="效果总结：性能提升、效率提升、用户反馈..."
                />
              </div>
            )}

            {caseType === 'rpa_app' && (
              <div className="grid grid-cols-1 gap-4">
                <input
                  value={(meta.upstreamSystems ?? []).join(', ')}
                  onChange={(e) => setMeta({ upstreamSystems: e.target.value.split(',').map((x: string) => x.trim()).filter(Boolean) })}
                  className="input-modern"
                  placeholder="上游系统（逗号分隔）：如 CRM, OA"
                />
                <input
                  value={(meta.downstreamSystems ?? []).join(', ')}
                  onChange={(e) => setMeta({ downstreamSystems: e.target.value.split(',').map((x: string) => x.trim()).filter(Boolean) })}
                  className="input-modern"
                  placeholder="下游系统（逗号分隔）：如 财务系统, 数据仓库"
                />
              </div>
            )}

            {caseType === 'agent_app' && (
              <div className="grid grid-cols-1 gap-4">
                <input
                  value={(meta.keyPoints ?? []).join(', ')}
                  onChange={(e) => setMeta({ keyPoints: e.target.value.split(',').map((x: string) => x.trim()).filter(Boolean) })}
                  className="input-modern"
                  placeholder="关键点（逗号分隔）：如 提示词设计, 记忆策略, 风险控制"
                />
              </div>
            )}

            {caseType === 'dashboard_app' && (
              <div className="grid grid-cols-1 gap-4">
                <input
                  value={(meta.dataDimensions ?? []).join(', ')}
                  onChange={(e) => setMeta({ dataDimensions: e.target.value.split(',').map((x: string) => x.trim()).filter(Boolean) })}
                  className="input-modern"
                  placeholder="数据维度（逗号分隔）：如 时间, 组织, 产品"
                />
                <input
                  value={(meta.analysisMethods ?? []).join(', ')}
                  onChange={(e) => setMeta({ analysisMethods: e.target.value.split(',').map((x: string) => x.trim()).filter(Boolean) })}
                  className="input-modern"
                  placeholder="指标分析方式（逗号分隔）：如 趋势分析, 结构分析"
                />
                <textarea
                  value={meta.usageGuide ?? ''}
                  onChange={(e) => setMeta({ usageGuide: e.target.value })}
                  className="input-modern min-h-[90px] resize-none"
                  placeholder="用法说明：看板入口、筛选路径、下钻方式..."
                />
              </div>
            )}
          </section>
        )}

        <section className="card-modern p-8 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-amber-500" />
              </div>
              <h2 className="text-lg font-bold text-neutral-900">未来规划</h2>
            </div>
            <button 
              onClick={addRoadmapItem}
              className="px-4 py-2 bg-neutral-50 text-neutral-600 rounded-xl font-bold hover:bg-neutral-100 transition-all flex items-center gap-2 text-sm border border-neutral-200/60"
            >
              <Plus className="w-4 h-4" />
              添加规划
            </button>
          </div>
          <div className="space-y-3">
            {(caseData.roadmap?.items ?? []).map((item, index) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-neutral-50/50 rounded-2xl border border-neutral-200/60 flex gap-4 items-center"
              >
                <input 
                  type="text" 
                  value={item.task}
                  onChange={(e) => {
                    const newItems = [...(caseData.roadmap?.items ?? [])];
                    newItems[index].task = e.target.value;
                    setCaseData({ ...caseData, roadmap: { ...caseData.roadmap, items: newItems } });
                  }}
                  className="w-40 px-4 py-2 bg-white border border-neutral-200/60 rounded-lg focus:border-brand-500 transition-all outline-none font-bold text-sm"
                  placeholder="任务名称"
                />
                <input 
                  type="text" 
                  value={item.content}
                  onChange={(e) => {
                    const newItems = [...(caseData.roadmap?.items ?? [])];
                    newItems[index].content = e.target.value;
                    setCaseData({ ...caseData, roadmap: { ...caseData.roadmap, items: newItems } });
                  }}
                  className="flex-1 px-4 py-2 bg-white border border-neutral-200/60 rounded-lg focus:border-brand-500 transition-all outline-none text-sm"
                  placeholder="规划任务描述..."
                />
                <input 
                  type="text" 
                  value={item.date}
                  onChange={(e) => {
                    const newItems = [...(caseData.roadmap?.items ?? [])];
                    newItems[index].date = e.target.value;
                    setCaseData({ ...caseData, roadmap: { ...caseData.roadmap, items: newItems } });
                  }}
                  className="w-28 px-4 py-2 bg-white border border-neutral-200/60 rounded-lg focus:border-brand-500 transition-all outline-none font-bold text-xs"
                  placeholder="日期"
                />
                <button 
                  onClick={() => removeRoadmapItem(item.id)}
                  className="p-2 text-neutral-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};
