import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { X, UserPlus, Users, Trash2, Shield, User, Mail, Lock, IdCard, Building2, Briefcase } from 'lucide-react';
import { apiService } from '../services/apiService';

interface UserManagementPanelProps {
  showClose?: boolean;
  onClose?: () => void;
  onUserCreated?: () => void;
}

interface UserData {
  id: string;
  username: string;
  um_number?: string;
  real_name?: string;
  team?: string;
  organization?: string;
  email?: string;
  role: string;
  created_at?: string;
}

export const UserManagementPanel: React.FC<UserManagementPanelProps> = ({
  showClose = false,
  onClose,
  onUserCreated,
}) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    realName: '',
    umNumber: '',
    team: '',
    organization: '财服总部',
    password: '',
    email: '',
    role: 'user',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      setError('');
      const userList = await apiService.getUsers();
      setUsers(userList);
    } catch (err: any) {
      setError(err?.message || '获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    setFormData({ realName: '', umNumber: '', team: '', organization: '财服总部', password: '', email: '', role: 'user' });
    setError('');
    setSuccess('');
    setShowForm(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.realName.trim() || !formData.umNumber.trim() || !formData.team.trim() || !formData.organization.trim() || !formData.password.trim()) {
      setError('姓名、UM号、所属团队、所属组织和密码必填');
      return;
    }

    const result = await apiService.registerUser({
      realName: formData.realName.trim(),
      umNumber: formData.umNumber.trim(),
      team: formData.team.trim(),
      organization: formData.organization.trim(),
      password: formData.password.trim(),
      email: formData.email.trim() || undefined,
      role: formData.role,
    });

    if (result.success) {
      setSuccess('用户创建成功');
      setFormData({ realName: '', umNumber: '', team: '', organization: '财服总部', password: '', email: '', role: 'user' });
      setShowForm(false);
      fetchUsers();
      onUserCreated?.();
    } else {
      setError(result.message || '创建失败');
    }
  };

  const handleDelete = async (id: string, displayName: string) => {
    if (!confirm(`确定要删除用户 "${displayName}" 吗？`)) return;

    const result = await apiService.deleteUser(id);
    if (result.success) {
      setSuccess('用户已删除');
      fetchUsers();
    } else {
      setError(result.message || '删除失败');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden"
    >
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
        {showClose && onClose && (
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-6">
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
                  setFormData({ realName: '', umNumber: '', team: '', organization: '财服总部', password: '', email: '', role: 'user' });
                  setError('');
                  setSuccess('');
                }}
                className="p-1 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">用户姓名 *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      value={formData.realName}
                      onChange={(e) => setFormData({ ...formData, realName: e.target.value })}
                      className="input-modern pl-10"
                      placeholder="输入姓名"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">员工UM号 *</label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      value={formData.umNumber}
                      onChange={(e) => setFormData({ ...formData, umNumber: e.target.value })}
                      className="input-modern pl-10"
                      placeholder="输入UM号（登录账号）"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">所属团队 *</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      value={formData.team}
                      onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                      className="input-modern pl-10"
                      placeholder="输入所属团队"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">所属组织 *</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <select
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      className="input-modern pl-10 appearance-none"
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

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">密码 *</label>
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
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">邮箱</label>
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
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">角色</label>
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
                <button type="submit" className="btn-primary flex-1">
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

        {loading ? (
          <div className="text-center py-12 text-neutral-400">加载中...</div>
        ) : (
          <div className="border border-neutral-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-black text-neutral-400 uppercase tracking-wider">姓名</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black text-neutral-400 uppercase tracking-wider">UM号</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black text-neutral-400 uppercase tracking-wider">团队</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black text-neutral-400 uppercase tracking-wider">组织</th>
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
                          {(user.real_name || user.username || '-').charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-sm text-neutral-900">{user.real_name || user.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600 whitespace-nowrap">{user.um_number || user.username || '-'}</td>
                    <td className="px-4 py-3 text-sm text-neutral-600 whitespace-nowrap">{user.team || '-'}</td>
                    <td className="px-4 py-3 text-sm text-neutral-600 whitespace-nowrap">{user.organization || '-'}</td>
                    <td className="px-4 py-3 text-sm text-neutral-500">{user.email || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        user.role === 'admin' ? 'bg-brand-50 text-brand-600' : 'bg-neutral-100 text-neutral-600'
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
                          onClick={() => handleDelete(user.id, user.real_name || user.username)}
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
                    <td colSpan={9} className="px-4 py-12 text-center text-neutral-400">
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
  );
};
