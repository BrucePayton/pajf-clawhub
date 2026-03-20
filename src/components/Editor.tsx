import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Save, Globe, Target, Zap, TrendingUp, Calendar, Plus, Trash2, Clock, CheckCircle, Rocket, Layout, ChevronRight, Info, Upload, Image as ImageIcon } from 'lucide-react';
import { Case, CaseStep, MetricCard, RoadmapItem } from '../types';

interface EditorProps {
  caseData: Case;
  setCaseData: (c: Case | ((prev: any) => any)) => void;
  onBack: () => void;
  onSave: () => void;
  onPublish: () => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

export const Editor: React.FC<EditorProps> = ({
  caseData,
  setCaseData,
  onBack,
  onSave,
  onPublish,
  showToast
}) => {
  const handleImageUpload = (index: number, file: File) => {
    if (!file) return;
    
    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast('图片太大（超过 10MB），请上传较小的图片。', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const newSteps = [...caseData.implementation.steps];
      newSteps[index].imageUrl = base64String;
      setCaseData((prev: any) => ({
        ...prev,
        implementation: {
          ...prev.implementation,
          steps: newSteps
        }
      }));
    };
    reader.readAsDataURL(file);
  };
  const addStep = () => {
    const newStep: CaseStep = { id: Date.now().toString(), title: '', description: '', imageUrl: '' };
    setCaseData((prev: any) => ({ ...prev, implementation: { ...prev.implementation, steps: [...prev.implementation.steps, newStep] } }));
  };

  const removeStep = (id: string) => {
    setCaseData((prev: any) => ({ ...prev, implementation: { ...prev.implementation, steps: prev.implementation.steps.filter((s: any) => s.id !== id) } }));
  };

  const addMetric = () => {
    const newMetric: MetricCard = { id: Date.now().toString(), label: '', value: '', subtext: '', icon: 'trending-up' };
    setCaseData((prev: any) => ({ ...prev, businessValue: { ...prev.businessValue, metrics: [...prev.businessValue.metrics, newMetric] } }));
  };

  const removeMetric = (id: string) => {
    setCaseData((prev: any) => ({ ...prev, businessValue: { ...prev.businessValue, metrics: prev.businessValue.metrics.filter((m: any) => m.id !== id) } }));
  };

  const addRoadmapItem = () => {
    const newItem: RoadmapItem = { id: Date.now().toString(), task: '', content: '', date: '' };
    setCaseData((prev: any) => ({ ...prev, roadmap: { ...prev.roadmap, items: [...prev.roadmap.items, newItem] } }));
  };

  const removeRoadmapItem = (id: string) => {
    setCaseData((prev: any) => ({ ...prev, roadmap: { ...prev.roadmap, items: prev.roadmap.items.filter((i: any) => i.id !== id) } }));
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
              <span className="px-1.5 py-0.5 bg-neutral-100 text-neutral-500 rounded-md text-[10px] font-bold uppercase tracking-wider">v{caseData.version}</span>
            </div>
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Globe className="w-3 h-3" />
              {caseData.organization || '未指定组织'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
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
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">背景描述</label>
              <textarea 
                value={caseData.challenges.background}
                onChange={(e) => setCaseData({ ...caseData, challenges: { ...caseData.challenges, background: e.target.value } })}
                className="input-modern min-h-[100px] resize-none"
                placeholder="描述业务背景..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">核心目标</label>
              <textarea 
                value={caseData.challenges.objectives}
                onChange={(e) => setCaseData({ ...caseData, challenges: { ...caseData.challenges, objectives: e.target.value } })}
                className="input-modern min-h-[80px] resize-none"
                placeholder="描述项目目标..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">关键痛点 (以逗号分隔)</label>
              <input 
                type="text" 
                value={caseData.challenges.painPoints.join(', ')}
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
              <h2 className="text-lg font-bold text-neutral-900">实施方案</h2>
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
            {caseData.implementation.steps.map((step, index) => (
              <motion.div 
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-5 bg-neutral-50/50 rounded-2xl border border-neutral-200/60 flex gap-5 items-start group"
              >
                <div className="w-10 h-10 bg-white border border-neutral-200/60 rounded-xl flex items-center justify-center font-bold text-neutral-400 shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <input 
                      type="text" 
                      value={step.title}
                      onChange={(e) => {
                        const newSteps = [...caseData.implementation.steps];
                        newSteps[index].title = e.target.value;
                        setCaseData({ ...caseData, implementation: { ...caseData.implementation, steps: newSteps } });
                      }}
                      className="w-full px-4 py-2 bg-white border border-neutral-200/60 rounded-lg focus:border-brand-500 transition-all outline-none font-bold text-sm"
                      placeholder="步骤标题"
                    />
                    <textarea 
                      value={step.description}
                      onChange={(e) => {
                        const newSteps = [...caseData.implementation.steps];
                        newSteps[index].description = e.target.value;
                        setCaseData({ ...caseData, implementation: { ...caseData.implementation, steps: newSteps } });
                      }}
                      className="w-full px-4 py-2 bg-white border border-neutral-200/60 rounded-lg focus:border-brand-500 transition-all outline-none text-xs text-neutral-500 min-h-[60px] resize-none"
                      placeholder="详细描述"
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
                                const newSteps = [...caseData.implementation.steps];
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
            ))}
          </div>
        </section>

        <section className="card-modern p-8 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-brand-500" />
              </div>
              <h2 className="text-lg font-bold text-neutral-900">业务价值</h2>
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
            {caseData.businessValue.metrics.map((metric, index) => (
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
                          const newMetrics = [...caseData.businessValue.metrics];
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
                      const newMetrics = [...caseData.businessValue.metrics];
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
                      const newMetrics = [...caseData.businessValue.metrics];
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
                      const newMetrics = [...caseData.businessValue.metrics];
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
            {caseData.roadmap.items.map((item, index) => (
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
                    const newItems = [...caseData.roadmap.items];
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
                    const newItems = [...caseData.roadmap.items];
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
                    const newItems = [...caseData.roadmap.items];
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
