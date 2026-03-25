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
  Database,
  Settings,
  Image as ImageIcon,
  Wrench,
  Bot,
  Workflow,
  PanelLeft,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Case, CaseStep, MetricCard, RoadmapItem, DbConfig, CaseType, CaseTypeMeta } from './types';
import { exportToPptx } from './services/pptxService';
import { apiService, User } from './services/apiService';
import { Toast, ConfirmDialog } from './components/Common';
import { LoginModal } from './components/LoginModal';
import { DbConfigModal } from './components/DbConfigModal';
import { Dashboard } from './components/Dashboard';
import { Editor } from './components/Editor';
import { CanvasView } from './components/CanvasView';
import { UserManagementPanel } from './components/UserManagementPanel';
import metadata from '../metadata.json';

// Helper to generate IDs safely in non-secure contexts (HTTP/IP)
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Default initial case template
const createCaseTypeMeta = (caseType: CaseType): CaseTypeMeta => {
  if (caseType === 'tool_app') {
    return {
      designHighlights: '设计思路：模块拆分、交互路径、性能考虑。',
      effectSummary: '效果说明：上线后效率和体验改善情况。',
    };
  }
  if (caseType === 'rpa_app') {
    return {
      upstreamSystems: ['源系统A'],
      downstreamSystems: ['目标系统B'],
    };
  }
  if (caseType === 'agent_app') {
    return {
      keyPoints: ['关键点1：提示词策略', '关键点2：容错机制'],
    };
  }
  if (caseType === 'dashboard_app') {
    return {
      dataDimensions: ['时间维度', '组织维度'],
      analysisMethods: ['同比/环比', '趋势分析'],
      usageGuide: '使用说明：按筛选条件查看核心指标并下钻分析。',
    };
  }
  return {};
};

const createCaseTypeSeed = (caseType: CaseType) => {
  if (caseType === 'tool_app') {
    return {
      title: '平安财服 小工具应用价值案例',
      subtitle: '以轻量工具设计提升效率与体验',
      objective: '通过小工具优化重复环节并提升操作体验。',
      stepTitles: ['需求梳理与方案设计', '工具实现与联调', '效果验证与优化'],
      metricLabel: '使用效率提升',
      metricValue: '75%',
    };
  }
  if (caseType === 'agent_app') {
    return {
      title: '平安财服 Agent 应用价值案例',
      subtitle: '沉淀可复用的智能体执行策略',
      objective: '通过 Agent 自动决策与执行提升处理质量。',
      stepTitles: ['任务拆解与提示策略', 'Agent执行与校验', '结果复盘与策略沉淀'],
      metricLabel: '任务完成率',
      metricValue: '88%',
    };
  }
  if (caseType === 'rpa_app') {
    return {
      title: '平安财服 RPA 应用价值案例',
      subtitle: '构建稳定可扩展的流程自动化能力',
      objective: '通过 RPA 打通上下游流程并减少人工介入。',
      stepTitles: ['流程建模与规则定义', '机器人执行与监控', '异常处理与持续优化'],
      metricLabel: '人效提升',
      metricValue: '80%',
    };
  }
  if (caseType === 'dashboard_app') {
    return {
      title: '平安财服 看板应用价值案例',
      subtitle: '以数据维度和指标分析驱动业务决策',
      objective: '通过看板实现指标可视化分析与高效使用。',
      stepTitles: ['指标口径与维度建模', '看板搭建与联调', '使用推广与反馈优化'],
      metricLabel: '决策响应速度提升',
      metricValue: '70%',
    };
  }
  return {
    title: '平安财服 OpenClaw 应用价值案例',
    subtitle: '记录业务优化点滴，沉淀数智化转型价值',
    objective: '优化目标：此处描述通过使用 OpenClaw 期望达到的状态。',
    stepTitles: ['环境配置/任务创建', '脚本编写/参数设置', '任务运行/结果监控'],
    metricLabel: '效率提升',
    metricValue: '85%',
  };
};

const createNewCase = (caseType: CaseType = 'openclaw_app'): Case => {
  const seed = createCaseTypeSeed(caseType);
  return {
    id: generateId(),
    title: seed.title,
    subtitle: seed.subtitle,
    status: 'draft',
    version: 0.1,
    lastModified: Date.now(),
    author: '',
    umNumber: '',
    team: '',
    organization: '财服总部',
    caseType,
    caseTypeMeta: createCaseTypeMeta(caseType),
    challenges: {
      background: '业务背景描述：此处描述当前的业务流程或背景，如业务目标、涉及系统等。',
      painPoints: ['痛点 1：[……]', '痛点 2：[……]', '痛点 3：[……]'],
      objectives: seed.objective,
    },
    implementation: {
      steps: [
        { id: '1', title: seed.stepTitles[0], description: '详细描述在该步骤中需要执行的操作。', imageUrl: '' },
        { id: '2', title: seed.stepTitles[1], description: '详细描述该步骤的关键设置或代码片段说明。', imageUrl: '' },
        { id: '3', title: seed.stepTitles[2], description: '描述任务如何启动、如何监控状态及获取结果。', imageUrl: '' },
      ],
    },
    businessValue: {
      metrics: [
        { id: '1', label: seed.metricLabel, value: seed.metricValue, subtext: '原流程耗时：4 小时 → 优化后：36 分钟', icon: 'trending-up' },
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
  };
};

export default function App() {
  type MenuKey = 'overview' | 'openclaw_app' | 'tool_app' | 'agent_app' | 'rpa_app' | 'dashboard_app' | 'user_management';

  const [cases, setCases] = useState<Case[]>([]);
  const [activeView, setActiveView] = useState<'dashboard' | 'editor' | 'canvas'>('dashboard');
  const [currentCase, setCurrentCase] = useState<Case | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showDbConfig, setShowDbConfig] = useState(false);
  const [menuKey, setMenuKey] = useState<MenuKey>('overview');
  const [dbConfig, setDbConfig] = useState<DbConfig>({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'claw_cases'
  });
  const lastLoadedTimeRef = React.useRef(0);
  const activeViewRef = React.useRef(activeView);
  const showLoginModalRef = React.useRef(showLoginModal);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const mapMenuToCaseType = (key: MenuKey): CaseType | undefined => {
    if (key === 'openclaw_app' || key === 'tool_app' || key === 'agent_app' || key === 'rpa_app' || key === 'dashboard_app') {
      return key;
    }
    return undefined;
  };

  const refreshCasesOnce = useCallback(async (userId?: string, caseType?: CaseType) => {
    try {
      const data = await apiService.getCases(userId, caseType);
      setCases(data);
      // 手动刷新后更新时间戳，避免紧接着被 socket 再次触发重复拉取
      lastLoadedTimeRef.current = Date.now();
    } catch (error) {
      console.error('Failed to refresh cases:', error);
      setCases([]);
      lastLoadedTimeRef.current = Date.now();
    }
  }, []);

  const ensureBootstrapAndLoad = useCallback(async (userId?: string, caseType?: CaseType) => {
    let currentCases = await apiService.getCases(userId, caseType);
    if (currentCases.length === 0) {
      await apiService.bootstrapCases();
      currentCases = await apiService.getCases(userId, caseType);
    }
    setCases(currentCases);
    lastLoadedTimeRef.current = Date.now();
  }, []);

  // Auth Persistence
  useEffect(() => {
    document.title = metadata.name;
    const savedUser = localStorage.getItem('internal_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser?.token) {
          setUser(parsedUser);
        } else {
          localStorage.removeItem('internal_user');
        }
      } catch (_error) {
        localStorage.removeItem('internal_user');
      }
    }
    setIsAuthReady(true);
  }, []);

  // Load from API with Real-time Sync
  // Update refs when values change
  React.useEffect(() => {
    activeViewRef.current = activeView;
  }, [activeView]);

  React.useEffect(() => {
    showLoginModalRef.current = showLoginModal;
  }, [showLoginModal]);

  useEffect(() => {
    if (!isAuthReady) return;

    // Initial load with backend bootstrap
    ensureBootstrapAndLoad(user?.uid, mapMenuToCaseType(menuKey));

    // Listen for updates from other users
    const unsubscribe = apiService.onCasesUpdated(() => {
      // 防抖：3 秒内不重复刷新
      if (Date.now() - lastLoadedTimeRef.current < 3000) return;

      // 只在 dashboard 视图时刷新
      if (activeViewRef.current !== 'dashboard') return;

      // 登录中避免刷新导致弹窗闪动或输入状态丢失
      if (showLoginModalRef.current) return;

      refreshCasesOnce(user?.uid, mapMenuToCaseType(menuKey));
    });

    return () => unsubscribe();
  }, [isAuthReady, user, menuKey, refreshCasesOnce, ensureBootstrapAndLoad]);

  useEffect(() => {
    if (!isAuthReady) return;
    ensureBootstrapAndLoad(user?.uid, mapMenuToCaseType(menuKey));
    if (menuKey === 'user_management' && user?.role !== 'admin') {
      setMenuKey('overview');
    }
  }, [menuKey, isAuthReady, user, ensureBootstrapAndLoad]);

  // Load DB Config
  useEffect(() => {
    if (showDbConfig) {
      apiService.getDbConfig().then(data => {
        if (data) {
          setDbConfig({ ...data, password: '' });
        }
      });
    }
  }, [showDbConfig]);

  const handleCreate = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    const currentType = mapMenuToCaseType(menuKey) || 'openclaw_app';
    const newCase = { ...createNewCase(currentType), ownerId: user.uid, author: user.displayName || '', caseType: currentType };

    // Create in DB immediately as requested
    try {
      const success = await apiService.saveCase(newCase, user);
      if (success) {
        setCurrentCase(newCase);
        setActiveView('editor');
        showToast('新案例已创建并同步至数据库');
      } else {
        showToast('创建失败，请检查数据库连接', 'error');
      }
    } catch (error: any) {
      if (error?.message === 'CASE_PAYLOAD_TOO_LARGE') {
        showToast('内容体积过大，请减少步骤图片数量或更换更小图片。', 'error');
      } else if (error?.message === 'CASE_FORBIDDEN') {
        showToast('无权修改他人案例', 'error');
      } else if (error?.message === 'CASE_UNAUTHORIZED') {
        showToast('请先登录再操作', 'error');
      } else {
        showToast('创建失败，请检查网络或数据库连接', 'error');
      }
    }
  };

  const handleDelete = (id: string) => {
    const target = cases.find(c => c.id === id);
    if (!target) return;
    
    if (!user) {
      showToast('请先登录后再删除案例', 'error');
      return;
    }

    if (target.ownerId !== user.uid) {
      showToast('您没有权限删除此案例', 'error');
      return;
    }

    if (target.isPublic === true) {
      showToast('仅允许删除自己私密案例', 'error');
      return;
    }

    setConfirmDelete(id);
  };

  const handleLikeCase = async (id: string) => {
    const result = await apiService.likeCase(id, user);
    if (!result.success) {
      showToast(result.message || '点赞失败', 'error');
      return;
    }
    if (result.duplicated) {
      showToast('你已经点过赞了', 'error');
    } else {
      showToast('点赞成功');
    }
    await refreshCasesOnce(user?.uid);
  };

  const confirmDeleteCase = async () => {
    if (confirmDelete) {
      const target = cases.find(c => c.id === confirmDelete);
      if (!user) {
        showToast('请先登录后再删除案例', 'error');
        setConfirmDelete(null);
        return;
      }
      if (!target || target.ownerId !== user.uid || target.isPublic === true) {
        showToast('仅允许删除自己私密案例', 'error');
        setConfirmDelete(null);
        return;
      }

      try {
        const success = await apiService.deleteCase(confirmDelete, user);
        if (success) {
          setConfirmDelete(null);
          showToast('删除成功');
        } else {
          showToast('删除失败', 'error');
        }
      } catch (error: any) {
        if (error?.message === 'CASE_UNAUTHORIZED') {
          showToast('请先登录后再删除案例', 'error');
        } else if (error?.message === 'CASE_DELETE_FORBIDDEN') {
          showToast('仅允许删除自己私密案例', 'error');
        } else {
          showToast('删除失败，请检查网络或权限', 'error');
        }
      }
    }
  };

  const handleSave = async () => {
    if (!currentCase) return;

    if (!user) {
      setShowLoginModal(true);
      showToast('请先登录以保存案例', 'error');
      return;
    }

    const updatedCase = {
      ...currentCase,
      lastModified: Date.now(),
      ownerId: currentCase?.ownerId || user.uid
    };

    console.log('Saving case:', updatedCase);
    try {
      const success = await apiService.saveCase(updatedCase, user);
      if (success) {
        await refreshCasesOnce(user.uid);
        showToast('保存成功');
        setActiveView('dashboard');
      } else {
        showToast('保存失败，请检查网络或数据库连接', 'error');
      }
    } catch (error: any) {
      if (error?.message === 'CASE_PAYLOAD_TOO_LARGE') {
        showToast('保存失败：内容体积过大，请减少步骤图片数量或更换更小图片。', 'error');
      } else if (error?.message === 'CASE_FORBIDDEN') {
        showToast('无权修改他人案例', 'error');
      } else if (error?.message === 'CASE_UNAUTHORIZED') {
        showToast('请先登录再操作', 'error');
      } else {
        showToast('保存失败，请检查网络或数据库连接', 'error');
      }
    }
  };

  const handlePublish = async () => {
    if (!currentCase) return;

    if (!user) {
      setShowLoginModal(true);
      showToast('请先登录以发布案例', 'error');
      return;
    }

    const nextVersion = currentCase?.status === 'published'
      ? Math.round(((currentCase?.version ?? 0) + 0.1) * 10) / 10
      : 1.0;

    const publishedCase = {
      ...currentCase,
      status: 'published' as const,
      version: nextVersion,
      lastModified: Date.now(),
      ownerId: currentCase?.ownerId || user.uid,
      isPublic: currentCase.isPublic ?? false  // 使用 null 合并运算符，保持用户设置的状态
    };

    console.log('Publishing case:', publishedCase);
    try {
      const success = await apiService.saveCase(publishedCase, user);
      if (success) {
        setCurrentCase(publishedCase);
        setActiveView('canvas');
        showToast(publishedCase.isPublic ? '发布成功！案例已公开' : '发布成功！案例已保存为私密');
      } else {
        showToast('发布失败，请检查网络或数据库连接', 'error');
      }
    } catch (error: any) {
      if (error?.message === 'CASE_PAYLOAD_TOO_LARGE') {
        showToast('发布失败：内容体积过大，请减少步骤图片数量或更换更小图片。', 'error');
      } else if (error?.message === 'CASE_FORBIDDEN') {
        showToast('无权修改他人案例', 'error');
      } else if (error?.message === 'CASE_UNAUTHORIZED') {
        showToast('请先登录再操作', 'error');
      } else {
        showToast('发布失败，请检查网络或数据库连接', 'error');
      }
    }
  };

  const handleLogin = async (u: string, p: string) => {
    const result = await apiService.login(u, p);
    if (result.success && result.user) {
      setUser(result.user);
      localStorage.setItem('internal_user', JSON.stringify(result.user));
      setShowLoginModal(false);
      showToast('登录成功');

      // Reload cases with new user context after a short delay
      setTimeout(() => {
        refreshCasesOnce(result.user?.uid, mapMenuToCaseType(menuKey));
      }, 500);
    } else {
      showToast(result.message || '用户名或密码错误', 'error');
    }
  };

  const handleLogout = async () => {
    setUser(null);
    localStorage.removeItem('internal_user');
    setMenuKey('overview');
    showToast('已退出登录');

    // 立即刷新案例列表（仅公开案例）
    try {
      await refreshCasesOnce(undefined, mapMenuToCaseType(menuKey));
    } catch (err) {
      console.error('Failed to reload cases after logout:', err);
      setCases([]);
    }
  };

  const handleSaveDbConfig = async (config: DbConfig) => {
    const result = await apiService.saveDbConfig(config);
    if (result.success) {
      showToast('数据库配置已保存并连接成功');
      setDbConfig(config);
      return true;
    } else {
      showToast(result.message || '配置保存失败', 'error');
      return false;
    }
  };

  const handleResetDbConfig = async () => {
    const success = await apiService.resetDbConfig();
    if (success) {
      showToast('数据库连接已断开');
      setShowDbConfig(false);
    } else {
      showToast('重置失败', 'error');
    }
  };

  const handleTestDbConfig = async (config: DbConfig) => {
    return await apiService.testDbConnection(config);
  };

  const handleExportPptx = async (caseData: Case) => {
    try {
      showToast('正在生成 PPTX...');
      await exportToPptx(caseData);
      showToast('PPTX 导出成功');
    } catch (error) {
      console.error('PPTX export error:', error);
      showToast('导出失败，请重试', 'error');
    }
  };

  const moduleMeta: Record<MenuKey, { pageTitle: string; pageSubtitle: string; emptyTitle: string; emptySubtitle: string; showOverviewInsights?: boolean }> = {
    overview: {
      pageTitle: '总览',
      pageSubtitle: '从平台维度查看案例规模、组织表现和整体排名。',
      emptyTitle: '当前平台暂无案例数据',
      emptySubtitle: '请先创建或初始化案例后查看总览分析',
      showOverviewInsights: true,
    },
    openclaw_app: {
      pageTitle: 'OpenClaw应用案例',
      pageSubtitle: '统一展示 OpenClaw 类型案例，聚焦步骤方法与实施效果。',
      emptyTitle: '当前暂无 OpenClaw 应用案例',
      emptySubtitle: '可在本模块中创建并沉淀新的 OpenClaw 案例',
    },
    tool_app: {
      pageTitle: '小工具应用案例',
      pageSubtitle: '统一展示小工具案例，强调设计思路、使用效果与复用价值。',
      emptyTitle: '当前暂无小工具应用案例',
      emptySubtitle: '可在本模块中创建并沉淀新的小工具案例',
    },
    agent_app: {
      pageTitle: 'Agent案例',
      pageSubtitle: '统一展示 Agent 案例，强调步骤方法、关键点与可复用策略。',
      emptyTitle: '当前暂无 Agent 案例',
      emptySubtitle: '可在本模块中创建并沉淀新的 Agent 案例',
    },
    rpa_app: {
      pageTitle: 'RPA案例',
      pageSubtitle: '统一展示 RPA 案例，强调上下游系统关联与自动化步骤。',
      emptyTitle: '当前暂无 RPA 案例',
      emptySubtitle: '可在本模块中创建并沉淀新的 RPA 案例',
    },
    dashboard_app: {
      pageTitle: '看板案例',
      pageSubtitle: '统一展示看板案例，强调数据维度、指标分析与用法说明。',
      emptyTitle: '当前暂无看板案例',
      emptySubtitle: '可在本模块中创建并沉淀新的看板案例',
    },
    user_management: {
      pageTitle: '用户管理',
      pageSubtitle: '在右侧主区域中统一管理平台账号、角色与新增用户。',
      emptyTitle: '',
      emptySubtitle: '',
    },
  };

  const menuItems: Array<{ key: MenuKey; label: string; icon: React.ReactNode }> = [
    { key: 'overview', label: '总览', icon: <LayoutDashboard className="w-4 h-4" /> },
    { key: 'openclaw_app', label: 'OpenClaw应用案例', icon: <Rocket className="w-4 h-4" /> },
    { key: 'tool_app', label: '小工具应用案例', icon: <Wrench className="w-4 h-4" /> },
    { key: 'agent_app', label: 'Agent案例', icon: <Bot className="w-4 h-4" /> },
    { key: 'rpa_app', label: 'RPA案例', icon: <Workflow className="w-4 h-4" /> },
    { key: 'dashboard_app', label: '看板案例', icon: <PanelLeft className="w-4 h-4" /> },
    { key: 'user_management', label: '用户管理', icon: <Users className="w-4 h-4" /> },
  ];
  const visibleMenuItems = menuItems.filter((item) => item.key !== 'user_management' || user?.role === 'admin');

  const currentModuleMeta = moduleMeta[menuKey];

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900">
      {activeView === 'dashboard' && (
        <div className="flex min-h-screen">
          <aside className="w-64 border-r border-neutral-200 bg-white p-4">
            <div className="mb-4 px-2">
              <h2 className="text-sm font-black text-neutral-800">{metadata.name}</h2>
            </div>
            <nav className="space-y-1">
              {visibleMenuItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setMenuKey(item.key)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                    menuKey === item.key
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </aside>
          <main className="flex-1">
            {menuKey === 'user_management' ? (
              <div className="p-6 md:p-10">
                <div className="max-w-7xl mx-auto">
                  <div className="mb-8">
                    <p className="text-neutral-400 font-bold text-[10px] uppercase tracking-[0.2em]">{metadata.name}</p>
                    <h1 className="text-3xl font-black text-neutral-900 tracking-tight">{currentModuleMeta.pageTitle}</h1>
                    <p className="text-neutral-500 text-sm mt-1">{currentModuleMeta.pageSubtitle}</p>
                  </div>
                  {user?.role === 'admin' ? (
                    <UserManagementPanel />
                  ) : (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-700">
                      仅管理员可访问用户管理模块。
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Dashboard
                cases={cases}
                user={user}
                appName={metadata.name}
                appDescription={metadata.description}
                pageTitle={currentModuleMeta.pageTitle}
                pageSubtitle={currentModuleMeta.pageSubtitle}
                emptyTitle={currentModuleMeta.emptyTitle}
                emptySubtitle={currentModuleMeta.emptySubtitle}
                showOverviewInsights={currentModuleMeta.showOverviewInsights}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onNewCase={handleCreate}
                onEditCase={(c) => {
                  if (!user || c.ownerId !== user.uid) {
                    showToast('无权修改他人案例', 'error');
                    return;
                  }
                  setCurrentCase(c);
                  setActiveView('editor');
                }}
                onViewCanvas={(c) => {
                  setCurrentCase(c);
                  setActiveView('canvas');
                }}
                onDeleteCase={handleDelete}
                onLikeCase={handleLikeCase}
                onLogin={() => setShowLoginModal(true)}
                onLogout={handleLogout}
                onOpenDbConfig={() => setShowDbConfig(true)}
                onOpenUserManagement={() => setMenuKey('user_management')}
              />
            )}
          </main>
        </div>
      )}

      {activeView === 'editor' && currentCase && (
        <Editor 
          caseData={currentCase} 
          setCaseData={setCurrentCase}
          onBack={async () => {
            await refreshCasesOnce(user?.uid, mapMenuToCaseType(menuKey));
            setActiveView('dashboard');
          }}
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
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}
        
        {confirmDelete && (
          <ConfirmDialog 
            isOpen={!!confirmDelete}
            title="确认删除"
            message="此操作无法撤销，确定要删除这个案例吗？"
            onConfirm={confirmDeleteCase}
            onClose={() => setConfirmDelete(null)}
          />
        )}

        {showLoginModal && (
          <LoginModal 
            key="login-modal"
            onLogin={handleLogin}
            onClose={() => setShowLoginModal(false)}
          />
        )}

        {showDbConfig && (
          <DbConfigModal
            isOpen={showDbConfig}
            onClose={() => setShowDbConfig(false)}
            config={dbConfig}
            onSave={handleSaveDbConfig}
            onReset={handleResetDbConfig}
            onTest={handleTestDbConfig}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

