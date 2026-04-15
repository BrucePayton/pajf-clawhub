import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, KeyRound } from 'lucide-react';

interface ChangePasswordModalProps {
  onClose: () => void;
  onSubmit: (currentPassword: string, newPassword: string) => Promise<void>;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onClose, onSubmit }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setError('请填写完整密码信息');
      return;
    }
    if (newPassword.length < 6) {
      setError('新密码至少 6 位');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致');
      return;
    }
    setError('');
    setSubmitting(true);
    await onSubmit(currentPassword, newPassword);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-brand-600" />
          </div>
          <h2 className="text-xl font-black text-neutral-900">修改密码</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">当前密码</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input-modern pl-10"
                placeholder="输入当前密码"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">新密码</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-modern pl-10"
                placeholder="至少 6 位"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">确认新密码</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-modern pl-10"
                placeholder="再次输入新密码"
              />
            </div>
          </div>
          {error && <p className="text-xs text-red-500 font-bold">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-xl border border-neutral-200 text-neutral-600 font-bold text-sm">
              取消
            </button>
            <button type="submit" disabled={submitting} className="flex-1 py-2 rounded-xl bg-brand-500 text-white font-bold text-sm disabled:opacity-50">
              {submitting ? '提交中...' : '确认修改'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
