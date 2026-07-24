import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { UserPlus, Trash2, Key, Users, RefreshCw } from 'lucide-react';

const INITIAL_STAFF = [
  { username: 'staff', password: 'staff123', role: 'staff', full_name: 'მორიგე ოპერატორი' }
];

export default function StaffManagement({ isSupabaseConnected, currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Form states for creating a new user
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('staff');
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  // States for resetting password
  const [selectedUserForReset, setSelectedUserForReset] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      if (isSupabaseConnected) {
        const { data, error } = await supabase
          .from('user_accounts')
          .select('*')
          .order('id', { ascending: true });
        
        if (error) throw error;
        setUsers(data || []);
      } else {
        const localUsers = localStorage.getItem('local_user_accounts');
        if (localUsers) {
          setUsers(JSON.parse(localUsers));
        } else {
          // Add default demo accounts
          const defaultList = [
            { id: 1, username: 'admin', password: 'admin123', role: 'super_admin', full_name: 'სუპერ ადმინისტრატორი' },
            { id: 2, username: 'manager', password: 'manager123', role: 'manager', full_name: 'მთავარი მენეჯერი' },
            { id: 3, username: 'staff', password: 'staff123', role: 'staff', full_name: 'მორიგე ოპერატორი' }
          ];
          setUsers(defaultList);
          localStorage.setItem('local_user_accounts', JSON.stringify(defaultList));
        }
      }
    } catch (err) {
      console.error('Error fetching users:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [isSupabaseConnected]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');

    if (!username.trim() || !password.trim() || !fullName.trim()) {
      setCreateError('გთხოვთ შეავსოთ ყველა ველი');
      return;
    }

    try {
      const newUser = {
        username: username.trim().toLowerCase(),
        password: password.trim(),
        role: role,
        full_name: fullName.trim()
      };

      if (isSupabaseConnected) {
        const { error } = await supabase
          .from('user_accounts')
          .insert(newUser);
        
        if (error) throw error;
      } else {
        // Local fallback
        const updatedUsers = [...users, { id: Date.now(), ...newUser }];
        setUsers(updatedUsers);
        localStorage.setItem('local_user_accounts', JSON.stringify(updatedUsers));
      }

      setCreateSuccess(`მომხმარებელი ${fullName} წარმატებით შეიქმნა!`);
      setUsername('');
      setPassword('');
      setFullName('');
      setRole('staff');
      fetchUsers();
    } catch (err) {
      setCreateError('მომხმარებლის შექმნისას მოხდა შეცდომა (შესაძლოა სახელი უკვე დაკავებულია)');
    }
  };

  const handleDeleteUser = async (userId, userLabel) => {
    if (userId === currentUser.id || userLabel === currentUser.username) {
      alert('საკუთარ ანგარიშს ვერ წაშლით!');
      return;
    }

    if (!window.confirm(`ნამდვილად გსურთ მომხმარებლის "${userLabel}" წაშლა?`)) return;

    try {
      if (isSupabaseConnected) {
        const { error } = await supabase
          .from('user_accounts')
          .delete()
          .eq('id', userId);
        
        if (error) throw error;
      } else {
        const updatedUsers = users.filter(u => u.id !== userId);
        setUsers(updatedUsers);
        localStorage.setItem('local_user_accounts', JSON.stringify(updatedUsers));
      }
      fetchUsers();
    } catch (err) {
      alert('მომხმარებლის წაშლისას მოხდა შეცდომა: ' + err.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (!newPassword.trim()) {
      setResetError('პაროლი არ შეიძლება იყოს ცარიელი');
      return;
    }

    try {
      if (isSupabaseConnected) {
        const { error } = await supabase
          .from('user_accounts')
          .update({ password: newPassword.trim() })
          .eq('id', selectedUserForReset.id);
        
        if (error) throw error;
      } else {
        const updatedUsers = users.map(u => 
          u.id === selectedUserForReset.id ? { ...u, password: newPassword.trim() } : u
        );
        setUsers(updatedUsers);
        localStorage.setItem('local_user_accounts', JSON.stringify(updatedUsers));
      }

      setResetSuccess(`პაროლი წარმატებით შეიცვალა მომხმარებლისთვის: ${selectedUserForReset.full_name}`);
      setNewPassword('');
      setSelectedUserForReset(null);
      fetchUsers();
    } catch (err) {
      setResetError('პაროლის შეცვლისას მოხდა შეცდომა: ' + err.message);
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'super_admin': return '👑 სუპერ ადმინი';
      case 'manager': return '💼 მენეჯერი';
      case 'staff': return '🎾 თანამშრომელი';
      default: return role;
    }
  };

  return (
    <div className="staff-management animate-fade-in">
      <div className="staff-layout">
        
        {/* Create User Form */}
        <div className="staff-card glass-panel create-user-card">
          <div className="card-header-with-icon">
            <UserPlus size={20} className="text-volt" />
            <h3>ახალი თანამშრომლის შექმნა</h3>
          </div>
          <p className="text-xs text-secondary margin-bottom-md">შექმენით ახალი ანგარიში მორიგე პერსონალისთვის</p>

          <form onSubmit={handleCreateUser} className="staff-form">
            {createError && <div className="form-error">{createError}</div>}
            {createSuccess && <div className="form-success">{createSuccess}</div>}

            <div className="form-group">
              <label className="form-label">სრული სახელი</label>
              <input
                type="text"
                className="form-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="მაგ. გიორგი ბერიძე"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">მომხმარებლის სახელი (Username)</label>
              <input
                type="text"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="მაგ. g.beridze"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">პაროლი</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="ჩაწერეთ პაროლი"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">როლი</label>
              <select
                className="form-input select-role-input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="staff">თანამშრომელი (Staff)</option>
                <option value="manager">მენეჯერი (Manager)</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary width-100">
              ანგარიშის შექმნა
            </button>
          </form>
        </div>

        {/* Users list table */}
        <div className="staff-card glass-panel list-users-card">
          <div className="card-header-with-icon">
            <Users size={20} className="text-volt" />
            <h3>თანამშრომლების სია ({users.length})</h3>
            <button className="btn btn-secondary btn-xs refresh-btn" onClick={fetchUsers}>
              <RefreshCw size={12} />
            </button>
          </div>

          <div className="staff-table-wrapper">
            {loading ? (
              <div className="table-loading">იტვირთება მომხმარებლები...</div>
            ) : users.length === 0 ? (
              <div className="table-empty">მომხმარებლები არ მოიძებნა</div>
            ) : (
              <table className="staff-table">
                <thead>
                  <tr>
                    <th>სახელი და გვარი</th>
                    <th>იუზერნეიმი</th>
                    <th>როლი</th>
                    <th>მოქმედება</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td><strong>{user.full_name}</strong></td>
                      <td><code>{user.username}</code></td>
                      <td>
                        <span className={`role-tag role-${user.role}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons-flex">
                          <button
                            className="btn btn-secondary btn-xs flex-align"
                            onClick={() => {
                              setSelectedUserForReset(user);
                              setNewPassword('');
                              setResetError('');
                              setResetSuccess('');
                            }}
                          >
                            <Key size={12} className="margin-right-xs text-volt" />
                            პაროლი
                          </button>
                          
                          {user.id !== currentUser.id && user.username !== currentUser.username && (
                            <button
                              className="btn btn-danger btn-xs flex-align"
                              onClick={() => handleDeleteUser(user.id, user.username)}
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

      {/* Password Reset Modal */}
      {selectedUserForReset && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h3>
                პაროლის შეცვლა
                <span className="modal-court-badge">
                  {selectedUserForReset.username}
                </span>
              </h3>
              <button className="modal-close-btn" onClick={() => setSelectedUserForReset(null)}>
                X
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="modal-form">
              {resetError && <div className="form-error">{resetError}</div>}
              {resetSuccess && <div className="form-success">{resetSuccess}</div>}

              <p className="text-xs text-secondary margin-bottom-md">
                სტუმრის/თანამშრომლის სახელი: <strong>{selectedUserForReset.full_name}</strong>
              </p>

              <div className="form-group">
                <label className="form-label">ახალი პაროლი</label>
                <input
                  type="password"
                  className="form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="ჩაწერეთ ახალი პაროლი"
                  required
                />
              </div>

              <div className="modal-footer-actions justify-end margin-top-md">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedUserForReset(null)}
                >
                  გაუქმება
                </button>
                <button type="submit" className="btn btn-primary">
                  პაროლის განახლება
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .staff-layout {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 24px;
        }

        .card-header-with-icon {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }

        .refresh-btn {
          margin-left: auto;
          padding: 6px;
        }

        .select-role-input {
          background-color: rgba(0, 0, 0, 0.4);
        }
        .select-role-input option {
          background-color: var(--bg-secondary);
          color: white;
        }

        .staff-table-wrapper {
          overflow-x: auto;
          margin-top: 16px;
        }

        .staff-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .staff-table th {
          padding: 10px 14px;
          color: var(--text-secondary);
          font-size: 0.75rem;
          text-transform: uppercase;
          border-bottom: 1px solid var(--border-color);
        }
        .staff-table td {
          padding: 12px 14px;
          border-bottom: 1px solid var(--border-color);
          font-size: 0.85rem;
        }
        .staff-table tr:last-child td { border-bottom: none; }

        .role-tag {
          font-size: 0.7rem;
          padding: 3px 8px;
          border-radius: 20px;
          font-weight: 600;
          border: 1px solid transparent;
        }
        .role-tag.role-super_admin {
          background: rgba(204, 255, 0, 0.1);
          color: var(--color-volt);
          border-color: rgba(204, 255, 0, 0.2);
        }
        .role-tag.role-manager {
          background: rgba(14, 165, 233, 0.1);
          color: var(--color-hard);
          border-color: rgba(14, 165, 233, 0.2);
        }
        .role-tag.role-staff {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-secondary);
          border-color: var(--border-color);
        }

        .action-buttons-flex {
          display: flex;
          gap: 6px;
        }

        .form-success {
          background: rgba(16, 185, 129, 0.1);
          color: var(--color-success);
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          margin-bottom: 16px;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .justify-end {
          justify-content: flex-end;
          display: flex;
          gap: 10px;
        }
        
        .table-loading {
          padding: 24px;
          text-align: center;
          color: var(--text-secondary);
        }

        @media (max-width: 900px) {
          .staff-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
