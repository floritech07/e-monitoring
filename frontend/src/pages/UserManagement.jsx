import { useState } from 'react';
import { Users, Edit2, Trash2, Plus, Shield, Eye, Wrench } from 'lucide-react';

const ROLES = {
  admin: { label: 'Administrateur', color: 'var(--danger)', icon: Shield },
  operator: { label: 'Opérateur', color: 'var(--warning)', icon: Wrench },
  readonly: { label: 'Lecture seule', color: 'var(--success)', icon: Eye },
};

const defaultUsers = [
  { id: 1, name: 'Mamadou Fassara', email: 'admin@sbee.bj', role: 'admin', active: true, lastLogin: '2026-03-17 09:14' },
  { id: 2, name: 'Aïcha Kpognon', email: 'aiche.k@sbee.bj', role: 'operator', active: true, lastLogin: '2026-03-16 16:45' },
  { id: 3, name: 'Jean-Paul Hounkpévi', email: 'jp.h@sbee.bj', role: 'readonly', active: false, lastLogin: '2026-03-10 11:00' },
];

export default function UserManagement() {
  const [users, setUsers] = useState(defaultUsers);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'readonly' });

  function addUser() {
    if (!form.name || !form.email) return;
    setUsers(u => [...u, { id: Date.now(), ...form, active: true, lastLogin: '—' }]);
    setForm({ name: '', email: '', role: 'readonly' });
    setShowForm(false);
  }

  function removeUser(id) {
    setUsers(u => u.filter(x => x.id !== id));
  }

  function toggleActive(id) {
    setUsers(u => u.map(x => x.id === id ? { ...x, active: !x.active } : x));
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Gestion des utilisateurs</div>
          <div className="page-subtitle">{users.length} utilisateur(s) enregistré(s)</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(s => !s)}>
          <Plus size={13} /> Nouvel utilisateur
        </button>
      </div>

      {/* Add user form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title"><Plus size={13} /> Ajouter un utilisateur</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <div className="settings-label" style={{ marginBottom: 4 }}>Nom complet</div>
              <input type="text" placeholder="Prénom Nom" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ width: 200 }} />
            </div>
            <div>
              <div className="settings-label" style={{ marginBottom: 4 }}>Email</div>
              <input type="email" placeholder="email@sbee.bj" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={{ width: 200 }} />
            </div>
            <div>
              <div className="settings-label" style={{ marginBottom: 4 }}>Rôle</div>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <button className="btn btn-primary btn-sm" onClick={addUser}>Créer</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Annuler</button>
          </div>
        </div>
      )}

      {/* Users table */}
      <div className="card" style={{ padding: 0 }}>
        <table className="vm-table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th>Dernière connexion</th>
              <th style={{ width: 80 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => {
              const role = ROLES[user.role];
              const RoleIcon = role.icon;
              return (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'var(--bg-active)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 600, color: role.color, flexShrink: 0
                      }}>
                        {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="vm-name">{user.name}</div>
                    </div>
                  </td>
                  <td><span className="mono text-sm text-muted">{user.email}</span></td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: role.color, fontSize: 12, fontWeight: 500 }}>
                      <RoleIcon size={12} /> {role.label}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${user.active ? 'online' : 'offline'}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => toggleActive(user.id)}
                    >
                      {user.active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td><span className="text-muted text-sm">{user.lastLogin}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-sm" title="Modifier"><Edit2 size={12} /></button>
                      <button className="btn btn-sm" style={{ color: 'var(--danger)' }} title="Supprimer" onClick={() => removeUser(user.id)}><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
