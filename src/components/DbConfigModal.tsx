import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Database, Server, User, Lock, Globe, Save, RefreshCw, X, CheckCircle, AlertCircle, FileText, Download, Code } from 'lucide-react';
import { DbConfig } from '../types';

interface DbConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DbConfig;
  onSave: (config: DbConfig) => Promise<boolean>;
  onReset: () => Promise<void>;
  onTest: (config: DbConfig) => Promise<boolean>;
}

export const DbConfigModal: React.FC<DbConfigModalProps> = ({ 
  isOpen, 
  onClose, 
  config: initialConfig, 
  onSave, 
  onReset,
  onTest
}) => {
  const [config, setConfig] = useState<DbConfig>(initialConfig);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showSql, setShowSql] = useState(false);

  if (!isOpen) return null;

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    const success = await onTest(config);
    setTestResult({
      success,
      message: success ? '连接成功！' : '连接失败，请检查配置。'
    });
    setIsTesting(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const success = await onSave(config);
    if (success) onClose();
    setIsSaving(false);
  };

  const sqlSchema = `CREATE TABLE IF NOT EXISTS cases (
  id VARCHAR(255) PRIMARY KEY,
  case_data JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);`;

  const downloadSql = () => {
    const blob = new Blob([sqlSchema], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schema.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[2rem] p-10 max-w-2xl w-full shadow-2xl my-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none" />
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center shadow-sm">
              <Database className="w-7 h-7 text-brand-600" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-neutral-900 tracking-tight">数据库配置</h2>
              <p className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest">Database Configuration</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-neutral-100 rounded-xl transition-colors text-neutral-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">主机地址 / HOST</label>
              <div className="relative group">
                <Server className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-brand-500 transition-colors" />
                <input 
                  type="text" 
                  value={config.host}
                  onChange={(e) => setConfig({ ...config, host: e.target.value })}
                  className="input-modern pl-11"
                  placeholder="localhost"
                />
              </div>
              { (config.host === 'localhost' || config.host === '127.0.0.1') && (
                <p className="text-[10px] text-amber-600 font-bold px-1 uppercase tracking-wider">
                  Note: Localhost points to the server container.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">端口 / PORT</label>
              <input 
                type="number" 
                value={config.port}
                onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) })}
                className="input-modern"
                placeholder="3306"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">数据库名 / DATABASE</label>
              <div className="relative group">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-brand-500 transition-colors" />
                <input 
                  type="text" 
                  value={config.database}
                  onChange={(e) => setConfig({ ...config, database: e.target.value })}
                  className="input-modern pl-11"
                  placeholder="case_db"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">用户名 / USERNAME</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-brand-500 transition-colors" />
                <input 
                  type="text" 
                  value={config.user}
                  onChange={(e) => setConfig({ ...config, user: e.target.value })}
                  className="input-modern pl-11"
                  placeholder="root"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">密码 / PASSWORD</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-brand-500 transition-colors" />
                <input 
                  type="password" 
                  value={config.password}
                  onChange={(e) => setConfig({ ...config, password: e.target.value })}
                  className="input-modern pl-11"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex gap-4">
            <button 
              onClick={handleTest}
              disabled={isTesting}
              className="flex-1 btn-secondary h-12 text-sm"
            >
              {isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              测试连接
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 btn-primary h-12 text-sm shadow-lg shadow-brand-500/20"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              保存配置
            </button>
          </div>
          
          <button 
            onClick={onReset}
            className="w-full py-2 text-neutral-400 hover:text-brand-600 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-3 h-3" />
            禁用文件模式（仅 MySQL） / MYSQL ONLY
          </button>

          {testResult && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-2xl flex items-center gap-3 border ${testResult.success ? 'bg-brand-50 text-brand-600 border-brand-100' : 'bg-red-50 text-red-600 border-red-100'}`}
            >
              {testResult.success ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="text-xs font-bold uppercase tracking-wider">{testResult.message}</span>
            </motion.div>
          )}

          <div className="mt-6 pt-8 border-t border-neutral-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-neutral-400">
                <FileText className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">SQL 建表语句 / SCHEMA</span>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowSql(!showSql)}
                  className="text-[10px] font-black text-brand-600 hover:text-brand-700 flex items-center gap-1.5 uppercase tracking-widest transition-colors"
                >
                  <Code className="w-3.5 h-3.5" />
                  {showSql ? '隐藏 / HIDE' : '查看 / VIEW'}
                </button>
                <button 
                  onClick={downloadSql}
                  className="text-[10px] font-black text-brand-600 hover:text-brand-700 flex items-center gap-1.5 uppercase tracking-widest transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  导出 / EXPORT .SQL
                </button>
              </div>
            </div>
            
            {showSql && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-neutral-900 rounded-2xl p-6 overflow-x-auto shadow-inner"
              >
                <pre className="text-brand-400 text-[10px] font-mono leading-relaxed">
                  {sqlSchema}
                </pre>
              </motion.div>
            )}
            <p className="text-[10px] text-neutral-400 mt-4 font-bold uppercase tracking-wider text-center">
              Please execute the SQL above in your database to initialize.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
