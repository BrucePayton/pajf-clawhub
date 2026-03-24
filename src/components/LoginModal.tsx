import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, User, LogIn } from 'lucide-react';

interface LoginModalProps {
  onLogin: (user: string, pass: string) => void;
  onClose: () => void;
  error?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLogin, onClose, error }) => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(user.trim(), pass.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="bg-white rounded-[2rem] p-10 max-w-md w-full shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 blur-[80px] rounded-full -mr-32 -mt-32 pointer-events-none" />
        
        <div className="w-20 h-20 bg-brand-50 rounded-3xl flex items-center justify-center mb-8 mx-auto shadow-sm">
          <Lock className="w-10 h-10 text-brand-600" />
        </div>
        
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-neutral-900 mb-2">管理员登录</h2>
          <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest">Administrator Login</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">用户名 / USERNAME</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-brand-500 transition-colors" />
              <input 
                type="text" 
                value={user}
                onChange={(e) => setUser(e.target.value)}
                className="input-modern pl-12 h-14"
                placeholder="admin"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">密码 / PASSWORD</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-brand-500 transition-colors" />
              <input 
                type="password" 
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                className="input-modern pl-12 h-14"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-50 text-red-500 p-3 rounded-xl text-xs font-bold text-center border border-red-100"
            >
              {error}
            </motion.div>
          )}
          
          <button 
            type="submit"
            className="btn-primary w-full h-14 text-base shadow-xl shadow-brand-500/20 mt-4"
          >
            <LogIn className="w-5 h-5" />
            立即登录
          </button>
          
          <button 
            type="button"
            onClick={onClose}
            className="w-full py-2 text-neutral-400 hover:text-neutral-600 text-[10px] font-bold uppercase tracking-widest transition-colors"
          >
            取消登录 / CANCEL
          </button>
        </form>
      </motion.div>
    </div>
  );
};
