import React, { useEffect, useState } from 'react';
import api from '../api/api';

type UserRow = {
  firebaseUid: string;
  email: string;
  displayName: string;
  entryCount: number;
  restricted: boolean;
  warned: boolean;
};

export default function AdminPanel() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    api.get('/admin/users').then((r) => setUsers(r.data.users)).catch((e) => {
      console.error(e);
      setUsers([]);
    }).finally(()=>setLoading(false));
  }, []);

  const toggleRestrict = async (uid: string, current: boolean) => {
    await api.post(`/admin/users/${encodeURIComponent(uid)}/restrict`, { restricted: !current });
    setUsers((prev) => prev.map(u => u.firebaseUid === uid ? { ...u, restricted: !current } : u));
  };

  const toggleWarn = async (uid: string, current: boolean) => {
    await api.post(`/admin/users/${encodeURIComponent(uid)}/warn`, { warned: !current });
    setUsers((prev) => prev.map(u => u.firebaseUid === uid ? { ...u, warned: !current } : u));
  };

  if (loading) return <div className="p-6">Loading users…</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Admin Panel</h2>
      <p className="mb-6">Manage users: restrict writing/reading or send warning notices.</p>
      <div className="mb-4">
        <button onClick={async () => {
          setImporting(true);
          try {
            await api.post('/admin/import-firebase');
            const r = await api.get('/admin/users');
            setUsers(r.data.users);
          } catch (e) { console.error(e); }
          setImporting(false);
        }} className="px-4 py-2 rounded bg-blue-600 text-white">{importing ? 'Importing…' : 'Import users from Firebase'}</button>
      </div>

      <div className="overflow-x-auto bg-white/5 p-4 rounded">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="pb-2">Name</th>
              <th className="pb-2">Email</th>
              <th className="pb-2">Entries</th>
              <th className="pb-2">Warn</th>
              <th className="pb-2">Restrict</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.firebaseUid} className="border-t">
                <td className="py-3">{u.displayName || '—'}</td>
                <td className="py-3">{u.email}</td>
                <td className="py-3">{u.entryCount}</td>
                <td className="py-3">
                  <button onClick={() => toggleWarn(u.firebaseUid, u.warned)} className={`px-3 py-1 rounded ${u.warned ? 'bg-yellow-500 text-white' : 'bg-gray-200'}`}>
                    {u.warned ? 'Warned' : 'Warn'}
                  </button>
                </td>
                <td className="py-3">
                  <button onClick={() => toggleRestrict(u.firebaseUid, u.restricted)} className={`px-3 py-1 rounded ${u.restricted ? 'bg-red-600 text-white' : 'bg-gray-200'}`}>
                    {u.restricted ? 'Restricted' : 'Restrict'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
