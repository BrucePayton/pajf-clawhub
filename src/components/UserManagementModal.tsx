import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, UserPlus, Users, Trash2, Shield, User, Mail, Lock } from 'lucide-react';
import { apiService } from '../services/apiService';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated?: () => void;
}

interface UserData {
  id: string;
  username: string;
  email?: string;
  role: string;
  created_at?: string;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  onUserCreated
}) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    role: 'user'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const userList = await apiService.getUsers();
      setUsers(userList);
    } catch (err) {
      setError('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      setFormData({ username: '', password: '', email: '', role: 'user' });
      setError('');
      setSuccess('');
      setShowForm(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.username || !formData.password) {
      setError('用户名和密码必填');
      return;
    }

    const result = await apiService.registerUser(
      formData.username,
      formData.password,
      formData.email || undefined,
      formData.role
    );

    if (result.success) {
      setSuccess('用户创建成功');
      setFormData({ username: '', password: '', email: '', role: 'user' });
      setShowForm(false);
      fetchUsers();
      onUserCreated?.();
    } else {
      setError(result.message || '创建失败');
    }
  };

  const handleDelete = async (id: string, username: string) => {
    if (!confirm(`确定要删除用户 "${username}" 吗？`)) return;

    const result = await apiService.deleteUser(id);
    if (result.success) {
      setSuccess('用户已删除');
      fetchUsers();
    } else {
      setError(result.message || '删除失败');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-brand-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900">用户管理</h2>
              <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">User Management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Action Bar */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-neutral-500">
              共 <span className="font-bold text-neutral-900">{users.length}</span> 个用户
            </p>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary text-sm"
              >
                <UserPlus className="w-4 h-4" />
                创建用户
              </button>
            )}
          </div>

          {/* Create User Form */}
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-6 bg-neutral-50 rounded-xl border border-neutral-200"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-neutral-900">创建新用户</h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setFormData({ username: '', password: '', email: '', role: 'user' });
                    setError('');
                    setSuccess('');
                  }}
                  className="p-1 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">
                      用户名 *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="input-modern pl-10"
                        placeholder="输入用户名"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">
                      密码 *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="input-modern pl-10"
                        placeholder="输入密码"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">
                      邮箱
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="input-modern pl-10"
                        placeholder="输入邮箱（可选）"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">
                      角色
                    </label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="input-modern pl-10 appearance-none"
                      >
                        <option value="user">普通用户</option>
                        <option value="admin">管理员</option>
                      </select>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-500 p-3 rounded-xl text-xs font-bold text-center border border-red-100">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 text-green-500 p-3 rounded-xl text-xs font-bold text-center border border-green-100">
                    {success}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                  >
                    创建用户
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 bg-white border border-neutral-200 rounded-xl text-neutral-600 hover:bg-neutral-50 font-bold text-sm transition-all"
                  >
                    取消
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* User List */}
          {loading ? (
            <div className="text-center py-12 text-neutral-400">加载中...</div>
          ) : (
            <div className="border border-neutral-200 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-[10px] font-black text-neutral-400 uppercase tracking-wider">用户名</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black text-neutral-400 uppercase tracking-wider">邮箱</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black text-neutral-400 uppercase tracking-wider">角色</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black text-neutral-400 uppercase tracking-wider">创建时间</th>
                    <th className="px-4 py-3 text-right text-[10px] font-black text-neutral-400 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center text-brand-600 font-bold text-xs">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-sm text-neutral-900">{user.username}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-500">
                        {user.email || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          user.role === 'admin'
                            ? 'bg-brand-50 text-brand-600'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}>
                          {user.role === 'admin' ? '管理员' : '普通用户'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-neutral-400">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => handleDelete(user.id, user.username)}
                            className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="删除用户"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-neutral-400">
                        暂无用户
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
