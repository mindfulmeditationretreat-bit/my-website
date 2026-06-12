'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

const ROLE_BADGE = {
  admin:      'bg-purple-500/20 text-purple-300 border-purple-500/30',
  instructor: 'bg-blue-500/20   text-blue-300   border-blue-500/30',
  user:       'bg-gold/10        text-gold        border-gold/30',
};

const ROLE_LABEL = { admin: 'admin', instructor: 'provider', user: 'user' };

export default function AdminUsersPage() {
  const [users, setUsers]   = useState([]);
  const [q, setQ]           = useState('');
  const [role, setRole]     = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams();
      if (q)    qs.set('q', q);
      if (role) qs.set('role', role);
      const data = await api.get(`/admin/users?${qs.toString()}`);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [role]);

  async function deleteUser(id, email) {
    if (!confirm(`Permanently delete ${email}? This cannot be undone.`)) return;
    await api.delete(`/admin/users/${id}`);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <p className="text-gold tracking-[0.3em] text-xs uppercase mb-2">Admin · Users</p>
          <h1 className="heading text-4xl font-light">User management</h1>
          <p className="text-cream/50 text-sm mt-1">{users.length} user{users.length !== 1 ? 's' : ''} found</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/dashboard/admin/users/bulk"  className="btn-outline text-sm">Bulk upload</Link>
          <Link href="/dashboard/admin/users/new"   className="btn-primary">+ New user</Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={(e) => { e.preventDefault(); load(); }} className="flex-1 flex gap-2">
            <input className="input" placeholder="Search by name or email…" value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="btn-outline whitespace-nowrap">Search</button>
          </form>
          <select className="input sm:w-44" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">All roles</option>
            <option value="user">Users</option>
            <option value="instructor">Providers</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <p className="text-cream/50 p-6">Loading…</p>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-400 text-sm mb-3">{error}</p>
            <button onClick={load} className="btn-outline text-sm">Retry</button>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-cream/40 text-sm">No users found.</p>
          </div>
        ) : (
        <>
          {/* Mobile cards (below md) */}
          <ul className="md:hidden divide-y divide-gold/[0.07]">
            {users.map((u) => (
              <li key={u.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-cream font-medium truncate">{u.fullName || '—'}</p>
                    <p className="text-cream/50 text-xs truncate">{u.email}</p>
                  </div>
                  <span className={`shrink-0 inline-flex px-2.5 py-0.5 rounded-full text-xs border ${ROLE_BADGE[u.role] || ROLE_BADGE.user}`}>
                    {ROLE_LABEL[u.role] ?? u.role}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 mt-3">
                  <div className="flex items-center gap-3 text-xs">
                    {u.active
                      ? <span className="inline-flex items-center gap-1.5 text-green-400"><span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />Active</span>
                      : <span className="inline-flex items-center gap-1.5 text-red-400"><span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />Inactive</span>}
                    <span className="text-cream/40">
                      {new Date(u.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Link href={`/dashboard/admin/users/${u.id}`} className="text-xs text-gold hover:underline">View</Link>
                    <button onClick={() => deleteUser(u.id, u.email)} className="text-xs text-cream/40 hover:text-red-400 transition">Delete</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop table (md and up) */}
          <table className="hidden md:table w-full text-sm">
            <thead>
              <tr className="border-b border-gold/10">
                <th className="text-left px-5 py-3.5 text-cream/40 text-xs uppercase tracking-widest font-normal">User</th>
                <th className="text-left px-4 py-3.5 text-cream/40 text-xs uppercase tracking-widest font-normal">Role</th>
                <th className="text-left px-4 py-3.5 text-cream/40 text-xs uppercase tracking-widest font-normal hidden md:table-cell">Joined</th>
                <th className="text-left px-4 py-3.5 text-cream/40 text-xs uppercase tracking-widest font-normal">Status</th>
                <th className="px-5 py-3.5 text-cream/40 text-xs uppercase tracking-widest font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gold/[0.07] hover:bg-white/[0.02] transition">
                  {/* User */}
                  <td className="px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="text-cream font-medium truncate">{u.fullName || '—'}</p>
                      <p className="text-cream/50 text-xs truncate">{u.email}</p>
                    </div>
                  </td>
                  {/* Role */}
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs border ${ROLE_BADGE[u.role] || ROLE_BADGE.user}`}>
                      {ROLE_LABEL[u.role] ?? u.role}
                    </span>
                  </td>
                  {/* Joined */}
                  <td className="px-4 py-3.5 text-cream/50 text-xs hidden md:table-cell">
                    {new Date(u.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3.5">
                    {u.active
                      ? <span className="inline-flex items-center gap-1.5 text-xs text-green-400"><span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />Active</span>
                      : <span className="inline-flex items-center gap-1.5 text-xs text-red-400"><span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />Inactive</span>}
                  </td>
                  {/* Actions */}
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/dashboard/admin/users/${u.id}`}
                        className="text-xs text-gold hover:underline">View</Link>
                      <button onClick={() => deleteUser(u.id, u.email)}
                        className="text-xs text-cream/40 hover:text-red-400 transition">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
        )}
      </div>
    </>
  );
}
