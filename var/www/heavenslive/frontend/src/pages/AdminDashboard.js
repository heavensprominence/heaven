import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const { token, isSuperAdmin, user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [stats, setStats] = useState(null);
  const [mintAmount, setMintAmount] = useState('');
  const [mintUserId, setMintUserId] = useState('');
  const [burnAmount, setBurnAmount] = useState('');
  const [burnUserId, setBurnUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isSuperAdmin) {
      window.location.href = '/credon';
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchUsers(), fetchOrders(), fetchDisputes(), fetchStats()]);
    setLoading(false);
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      setMessage('Error fetching users');
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDisputes = async () => {
    try {
      const res = await fetch('/api/admin/disputes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setDisputes(data.disputes || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setStats(data);
    } catch (err) {
      setMessage('Error fetching stats');
    }
  };

  const suspendUser = async (userId, days, reason) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ durationDays: days, reason })
      });
      if (res.ok) {
        alert(`User suspended${days ? ` for ${days} days` : ' permanently'}`);
        fetchUsers();
      } else {
        alert('Failed to suspend user');
      }
    } catch (err) {
      alert('Error');
    }
  };

  const unsuspendUser = async (userId) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/unsuspend`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert('User unsuspended');
        fetchUsers();
      }
    } catch (err) {
      alert('Error');
    }
  };

  const updateShipping = async (orderId, trackingNumber, carrier) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/shipping`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ trackingNumber, carrier })
      });
      if (res.ok) {
        alert(`Shipping updated: ${trackingNumber} via ${carrier}`);
        fetchOrders();
      }
    } catch (err) {
      alert('Error updating shipping');
    }
  };

  const resolveDispute = async (disputeId, resolution) => {
    try {
      const res = await fetch(`/api/admin/disputes/${disputeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'resolved', resolutionNotes: resolution })
      });
      if (res.ok) {
        alert('Dispute resolved');
        fetchDisputes();
      }
    } catch (err) {
      alert('Error');
    }
  };

  const mintCurrency = async () => {
    if (!mintUserId || !mintAmount) return alert('Enter user and amount');
    try {
      const res = await fetch('/api/admin/mint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userId: mintUserId, amountCents: parseFloat(mintAmount) * 100 })
      });
      if (res.ok) {
        alert(`✅ Minted ${mintAmount} Credon-USD`);
        setMintAmount('');
        setMintUserId('');
        fetchStats();
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (err) {
      alert('Mint failed');
    }
  };

  const burnCurrency = async () => {
    if (!burnUserId || !burnAmount) return alert('Enter user and amount');
    try {
      const res = await fetch('/api/admin/burn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userId: burnUserId, amountCents: parseFloat(burnAmount) * 100 })
      });
      if (res.ok) {
        alert(`🔥 Burned ${burnAmount} Credon-USD`);
        setBurnAmount('');
        setBurnUserId('');
        fetchStats();
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (err) {
      alert('Burn failed');
    }
  };

  const handleGoLive = async () => {
    if (!window.confirm('🚀 GO LIVE: Reset ALL wallet balances to zero? This cannot be undone.')) return;
    try {
      const res = await fetch('/api/admin/go-live', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert('✅ System is now LIVE! All balances reset.');
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (err) {
      alert('Network error');
    }
  };

  if (!isSuperAdmin) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <h2>Access Denied</h2>
        <a href="credon">Return to Dashboard</a>
      </div>
    );
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', background: 'rgba(0,0,0,0.3)', padding: '15px 25px', borderRadius: '15px' }}>
        <div>
          <h1 style={{ color: '#ffd700', margin: 0 }}>👑 Admin Dashboard</h1>
          <p style={{ margin: '5px 0 0', color: '#ccc' }}>{user?.email}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleGoLive} style={{ background: '#00ff88', color: '#0b1f3f', border: 'none', padding: '8px 20px', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold' }}>🚀 GO LIVE</button>
          <button onClick={logout} style={{ background: '#ff4444', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '25px', cursor: 'pointer' }}>Logout</button>
        </div>
      </div>

      {message && <div style={{ background: '#ff444420', padding: '10px', borderRadius: '8px', marginBottom: '20px', color: '#ff8888' }}>{message}</div>}

      <div style={{ background: '#ffd70020', padding: '15px', borderRadius: '10px', marginBottom: '20px', textAlign: 'center' }}>⚠️ TESTING MODE ACTIVE</div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', borderBottom: '1px solid rgba(255,215,0,0.3)', paddingBottom: '10px' }}>
        <button onClick={() => setActiveTab('dashboard')} style={{ background: activeTab === 'dashboard' ? '#ffd700' : 'rgba(0,0,0,0.3)', color: activeTab === 'dashboard' ? '#0b1f3f' : '#ccc', border: 'none', padding: '10px 20px', borderRadius: '25px', cursor: 'pointer' }}>📊 Dashboard</button>
        <button onClick={() => setActiveTab('mint')} style={{ background: activeTab === 'mint' ? '#ffd700' : 'rgba(0,0,0,0.3)', color: activeTab === 'mint' ? '#0b1f3f' : '#ccc', border: 'none', padding: '10px 20px', borderRadius: '25px', cursor: 'pointer' }}>✨ Mint/Burn</button>
        <button onClick={() => setActiveTab('users')} style={{ background: activeTab === 'users' ? '#ffd700' : 'rgba(0,0,0,0.3)', color: activeTab === 'users' ? '#0b1f3f' : '#ccc', border: 'none', padding: '10px 20px', borderRadius: '25px', cursor: 'pointer' }}>👥 Users</button>
        <button onClick={() => setActiveTab('orders')} style={{ background: activeTab === 'orders' ? '#ffd700' : 'rgba(0,0,0,0.3)', color: activeTab === 'orders' ? '#0b1f3f' : '#ccc', border: 'none', padding: '10px 20px', borderRadius: '25px', cursor: 'pointer' }}>📦 Orders</button>
        <button onClick={() => setActiveTab('disputes')} style={{ background: activeTab === 'disputes' ? '#ffd700' : 'rgba(0,0,0,0.3)', color: activeTab === 'disputes' ? '#0b1f3f' : '#ccc', border: 'none', padding: '10px 20px', borderRadius: '25px', cursor: 'pointer' }}>⚖️ Disputes</button>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '15px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px' }}>
              <h3>Users</h3>
              <div style={{ fontSize: '2rem', color: '#ffd700' }}>{stats?.users?.total_users || 0}</div>
            </div>
            <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px' }}>
              <h3>Total Supply</h3>
              <div style={{ fontSize: '2rem', color: '#ffd700' }}>${((stats?.total_supply_cents || 0) / 100).toLocaleString()}</div>
            </div>
            <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px' }}>
              <h3>Orders</h3>
              <div style={{ fontSize: '2rem', color: '#ffd700' }}>{orders.length}</div>
            </div>
            <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px' }}>
              <h3>Disputes</h3>
              <div style={{ fontSize: '2rem', color: '#ffd700' }}>{disputes.filter(d => d.status === 'open').length}</div>
            </div>
          </div>
          <pre style={{ background: 'rgba(0,0,0,0.5)', padding: '15px', borderRadius: '10px', overflow: 'auto', fontSize: '0.8rem' }}>{JSON.stringify(stats, null, 2)}</pre>
        </div>
      )}

      {/* Mint/Burn Tab */}
      {activeTab === 'mint' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '15px' }}>
            <h3 style={{ color: '#00ff88' }}>✨ Mint Currency</h3>
            <input type="text" placeholder="User ID (email)" value={mintUserId} onChange={(e) => setMintUserId(e.target.value)} style={{ width: '100%', margin: '10px 0', padding: '10px', background: 'rgba(255,255,255,0.1)', border: '1px solid #ffd700', borderRadius: '8px', color: 'white' }} />
            <input type="number" placeholder="Amount (Credon-USD)" value={mintAmount} onChange={(e) => setMintAmount(e.target.value)} style={{ width: '100%', margin: '10px 0', padding: '10px', background: 'rgba(255,255,255,0.1)', border: '1px solid #ffd700', borderRadius: '8px', color: 'white' }} />
            <button onClick={mintCurrency} style={{ background: '#00ff88', color: '#0b1f3f', border: 'none', padding: '12px', borderRadius: '8px', width: '100%', cursor: 'pointer', fontWeight: 'bold' }}>Mint</button>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '15px' }}>
            <h3 style={{ color: '#ff8888' }}>🔥 Burn Currency</h3>
            <input type="text" placeholder="User ID (email)" value={burnUserId} onChange={(e) => setBurnUserId(e.target.value)} style={{ width: '100%', margin: '10px 0', padding: '10px', background: 'rgba(255,255,255,0.1)', border: '1px solid #ffd700', borderRadius: '8px', color: 'white' }} />
            <input type="number" placeholder="Amount (Credon-USD)" value={burnAmount} onChange={(e) => setBurnAmount(e.target.value)} style={{ width: '100%', margin: '10px 0', padding: '10px', background: 'rgba(255,255,255,0.1)', border: '1px solid #ffd700', borderRadius: '8px', color: 'white' }} />
            <button onClick={burnCurrency} style={{ background: '#ff4444', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', width: '100%', cursor: 'pointer', fontWeight: 'bold' }}>Burn</button>
          </div>
        </div>
      )}

      {/* Users Tab with Ban/Suspend */}
      {activeTab === 'users' && (
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '15px', overflowX: 'auto' }}>
          <h3>User Management</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,215,0,0.2)' }}>
                <th style={{ padding: '12px' }}>Email</th>
                <th style={{ padding: '12px' }}>Name</th>
                <th style={{ padding: '12px' }}>Balance</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px' }}>Actions</th>
               </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,215,0,0.1)' }}>
                  <td style={{ padding: '12px' }}>{u.email}</td>
                  <td style={{ padding: '12px' }}>{u.full_name || '-'}</td>
                  <td style={{ padding: '12px' }}>${(u.balance_cents / 100).toFixed(2)}</td>
                  <td style={{ padding: '12px' }}>{u.is_suspended ? <span style={{ color: '#ff8888' }}>Suspended</span> : <span style={{ color: '#88ff88' }}>Active</span>}</td>
                  <td style={{ padding: '12px' }}>
                    {!u.is_suspended ? (
                      <>
                        <button onClick={() => { const days = prompt('Suspension days (empty for permanent):'); const reason = prompt('Reason:'); suspendUser(u.id, days ? parseInt(days) : null, reason); }} style={{ background: '#ffaa00', marginRight: '5px', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>Suspend</button>
                        <button onClick={() => { if(window.confirm('Permanently ban this user?')) suspendUser(u.id, null, 'Permanent ban'); }} style={{ background: '#ff4444', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>Ban</button>
                      </>
                    ) : (
                      <button onClick={() => unsuspendUser(u.id)} style={{ background: '#00ff88', color: '#0b1f3f', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>Unsuspend</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Orders Tab with Shipping Notifications */}
      {activeTab === 'orders' && (
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '15px', overflowX: 'auto' }}>
          <h3>Orders & Shipping</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,215,0,0.2)' }}>
                <th style={{ padding: '12px' }}>ID</th>
                <th style={{ padding: '12px' }}>User</th>
                <th style={{ padding: '12px' }}>Type</th>
                <th style={{ padding: '12px' }}>Amount</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px' }}>Tracking</th>
                <th style={{ padding: '12px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} style={{ borderBottom: '1px solid rgba(255,215,0,0.1)' }}>
                  <td style={{ padding: '12px' }}>{o.id?.slice(0, 8)}</td>
                  <td style={{ padding: '12px' }}>{o.email}</td>
                  <td style={{ padding: '12px' }}>{o.type === 'memorabilia_set' ? '📜 Memorabilia' : o.type === 'premium_usb' ? '💿 USB' : '💝 Donation'}</td>
                  <td style={{ padding: '12px' }}>${o.amount_usd}</td>
                  <td style={{ padding: '12px' }}>{o.status}</td>
                  <td style={{ padding: '12px' }}>{o.shipping_tracking_number || '-'}</td>
                  <td style={{ padding: '12px' }}>
                    {o.status === 'paid' && (
                      <button onClick={() => { const tracking = prompt('Tracking number:'); const carrier = prompt('Carrier (Canada Post, etc.):'); if(tracking && carrier) updateShipping(o.id, tracking, carrier); }} style={{ background: '#ffd700', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>Add Tracking</button>
                    )}
                    {o.status === 'shipped' && <span style={{ color: '#00ff88' }}>✓ Shipped</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Disputes Tab */}
      {activeTab === 'disputes' && (
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '15px' }}>
          <h3>Dispute Resolution</h3>
          {disputes.length === 0 ? (
            <p>No disputes</p>
          ) : (
            disputes.map(d => (
              <div key={d.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', marginBottom: '15px', borderRadius: '10px' }}>
                <div><strong>{d.title}</strong> - Status: {d.status}</div>
                <div>User: {d.email}</div>
                <div>Description: {d.description}</div>
                {d.status === 'open' && (
                  <button onClick={() => { const resolution = prompt('Resolution notes:'); if(resolution) resolveDispute(d.id, resolution); }} style={{ background: '#ffd700', marginTop: '10px', padding: '5px 15px', borderRadius: '5px', cursor: 'pointer' }}>Resolve</button>
                )}
                {d.resolution_notes && <div style={{ marginTop: '10px', color: '#aaa' }}>Resolution: {d.resolution_notes}</div>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
