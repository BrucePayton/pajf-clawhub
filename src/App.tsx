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
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Case, CaseStep, MetricCard, RoadmapItem, DbConfig } from './types';
import { exportToPptx } from './services/pptxService';
import { apiService, FullAnalyticsData, User } from './services/apiService';
import { Toast, ConfirmDialog } from './components/Common';
import { LoginModal } from './components/LoginModal';
import { DbConfigModal } from './components/DbConfigModal';
import { Dashboard } from './components/Dashboard';
import { Editor } from './components/Editor';
import { CanvasView } from './components/CanvasView';
import { UserManagementModal } from './components/UserManagementModal';
import metadata from '../metadata.json';

// Helper to generate IDs safely in non-secure contexts (HTTP/IP)
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Placeholder base64 images for offline use (Grayish-white)
const PLACEHOLDER_IMAGES = {
  step1: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88f8/AAb/A/8QG8oKAAAAAElFTkSuQmCC',
  step2: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88f8/AAb/A/8QG8oKAAAAAElFTkSuQmCC',
  step3: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88f8/AAb/A/8QG8oKAAAAAElFTkSuQmCC',
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
    umNumber: 'UM123456',
    team: '财务数智化小组',
    organization: '财服总部',
    ownerId: 'system',
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
    umNumber: 'UM654321',
    team: '客户服务优化团队',
    organization: '深圳分公司',
    ownerId: 'system',
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
  id: generateId(),
  title: '平安财服 OpenClaw 应用价值案例',
  subtitle: '记录业务优化点滴，沉淀数智化转型价值',
  status: 'draft',
  version: 0.1,
  lastModified: Date.now(),
  author: '',
  umNumber: '',
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
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showDbConfig, setShowDbConfig] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [dbConfig, setDbConfig] = useState<DbConfig>({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'claw_cases'
  });
  const [fullAnalytics, setFullAnalytics] = useState<FullAnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const lastLoadedTimeRef = React.useRef(0);
  const activeViewRef = React.useRef(activeView);
  const showLoginModalRef = React.useRef(showLoginModal);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadFullAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const data = await apiService.getFullAnalytics();
      setFullAnalytics(data);
    } catch (error: any) {
      setAnalyticsError(error?.message || '未知错误');
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  const refreshCasesOnce = useCallback(async (userId?: string) => {
    try {
      const data = await apiService.getCases(userId);
      if (data.length === 0) {
        setCases(INITIAL_CASES);
      } else {
        setCases(data);
      }
      // 手动刷新后更新时间戳，避免紧接着被 socket 再次触发重复拉取
      lastLoadedTimeRef.current = Date.now();
    } catch (error) {
      console.error('Failed to refresh cases:', error);
      setCases(INITIAL_CASES);
      lastLoadedTimeRef.current = Date.now();
    }
  }, []);

  // Auth Persistence
  useEffect(() => {
    document.title = metadata.name;
    const savedUser = localStorage.getItem('internal_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
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

    // Initial load
    refreshCasesOnce(user?.uid);
    loadFullAnalytics();

    // Listen for updates from other users
    const unsubscribe = apiService.onCasesUpdated(() => {
      // 防抖：3 秒内不重复刷新
      if (Date.now() - lastLoadedTimeRef.current < 3000) return;

      // 只在 dashboard 视图时刷新
      if (activeViewRef.current !== 'dashboard') return;

      // 登录中避免刷新导致弹窗闪动或输入状态丢失
      if (showLoginModalRef.current) return;

      refreshCasesOnce(user?.uid);
      loadFullAnalytics();
    });

    return () => unsubscribe();
  }, [isAuthReady, user, loadFullAnalytics, refreshCasesOnce]);

  useEffect(() => {
    if (activeView === 'dashboard') {
      loadFullAnalytics();
    }
  }, [activeView, loadFullAnalytics]);

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
    const newCase = { ...createNewCase(), ownerId: user.uid, author: user.displayName || '' };

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
    const loggedInUser = await apiService.login(u, p);
    if (loggedInUser) {
      setUser(loggedInUser);
      localStorage.setItem('internal_user', JSON.stringify(loggedInUser));
      setShowLoginModal(false);
      showToast('登录成功');

      // Reload cases with new user context after a short delay
      setTimeout(() => {
        refreshCasesOnce(loggedInUser.uid);
      }, 500);
    } else {
      showToast('用户名或密码错误', 'error');
    }
  };

  const handleLogout = async () => {
    setUser(null);
    localStorage.removeItem('internal_user');
    showToast('已退出登录');

    // 立即刷新案例列表（仅公开案例）
    try {
      await refreshCasesOnce(undefined);
    } catch (err) {
      console.error('Failed to reload cases after logout:', err);
      setCases(INITIAL_CASES);
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
      showToast('已切换回文件存储模式');
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

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900">
      {activeView === 'dashboard' && (
        <Dashboard
          cases={cases}
          user={user}
          fullAnalytics={fullAnalytics}
          analyticsLoading={analyticsLoading}
          analyticsError={analyticsError}
          appName={metadata.name}
          appDescription={metadata.description}
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
          onOpenUserManagement={() => setShowUserManagement(true)}
        />
      )}

      {activeView === 'editor' && currentCase && (
        <Editor 
          caseData={currentCase} 
          setCaseData={setCurrentCase}
          onBack={async () => {
            await refreshCasesOnce(user?.uid);
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

        {showUserManagement && (
          <UserManagementModal
            isOpen={showUserManagement}
            onClose={() => setShowUserManagement(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

