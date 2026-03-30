import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Upload, Save, Trash2, TrendingUp, Calendar, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import useAuthStore from '../stores/authStore'
import useWatchlistStore from '../stores/watchlistStore'
import { updateProfile, uploadAvatar, deleteAccount } from '../api/user'

function StatCard({ icon: Icon, label, value, color = 'var(--accent-blue)' }) {
  return (
    <div className="card" style={{ flex: 1, textAlign: 'center', minWidth: 120 }}>
      <Icon size={20} color={color} style={{ marginBottom: 8 }} />
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
    </div>
  )
}

export default function Profile() {
  const { user, setUser, logout } = useAuthStore()
  const { items: watchlist } = useWatchlistStore()
  const navigate = useNavigate()
  const fileRef = useRef(null)

  const [form, setForm] = useState({
    name: user?.name || user?.displayName || '',
    email: user?.email || '',
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const { data } = await updateProfile({ name: form.name, email: form.email })
      setUser(data.user || data)
      toast.success('Profile updated')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatarChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('avatar', file)
      const { data } = await uploadAvatar(fd)
      setUser({ ...user, avatar: data.avatar || data.url })
      toast.success('Avatar updated')
    } catch {
      toast.error('Failed to upload avatar')
    } finally {
      setUploading(false)
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== 'DELETE') { toast.error('Type DELETE to confirm'); return }
    setDeleting(true)
    try {
      await deleteAccount()
      toast.success('Account deleted')
      logout()
      navigate('/login')
    } catch {
      toast.error('Failed to delete account')
    } finally {
      setDeleting(false)
    }
  }

  // Top 3 watchlist performers
  const topPerformers = [...watchlist]
    .filter((i) => i.changePercent != null)
    .sort((a, b) => parseFloat(b.changePercent || 0) - parseFloat(a.changePercent || 0))
    .slice(0, 3)

  const accountCreated = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : '—'

  const lastLogin = user?.lastLogin
    ? new Date(user.lastLogin).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : '—'

  return (
    <div className="page-enter" style={{ maxWidth: 760 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Profile</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Manage your account settings</p>
      </div>

      {/* Avatar + Edit */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div
              onClick={() => fileRef.current?.click()}
              style={{ width: 80, height: 80, borderRadius: '50%', cursor: 'pointer', position: 'relative', border: '2px solid var(--border)', overflow: 'hidden', transition: 'var(--transition)' }}
              title="Click to change avatar"
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-green)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'rgba(74,158,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={32} color="var(--accent-blue)" />
                </div>
              )}
              {uploading && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                </div>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              style={{ position: 'absolute', bottom: -2, right: -2, background: 'var(--accent-blue)', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <Upload size={12} color="#fff" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
          </div>

          {/* Form fields */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Display Name</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
            </div>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ gap: 6 }}>
              {saving ? (
                <><div style={{ width: 13, height: 13, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />Saving...</>
              ) : (
                <><Save size={13} />Save Changes</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <StatCard icon={TrendingUp} label="Stocks Watched" value={watchlist.length} color="var(--accent-green)" />
        <StatCard icon={Calendar} label="Account Created" value={accountCreated} color="var(--accent-blue)" />
        <StatCard icon={Clock} label="Last Login" value={lastLogin} color="var(--text-secondary)" />
      </div>

      {/* Watchlist Summary */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>
          Watchlist Summary
          <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-secondary)', fontWeight: 400 }}>
            {watchlist.length} stock{watchlist.length !== 1 ? 's' : ''} tracked
          </span>
        </h3>
        {topPerformers.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No watchlist data yet</p>
        ) : (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {topPerformers.map((item, i) => {
              const ticker = item.ticker || item.symbol
              const cp = parseFloat(item.changePercent || 0)
              return (
                <div key={i} style={{ padding: '10px 16px', background: 'rgba(30,45,74,0.5)', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 13, color: 'var(--accent-green)' }}>{ticker}</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600, color: cp >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                    {cp >= 0 ? '+' : ''}{cp.toFixed(2)}%
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="card" style={{ borderColor: 'rgba(255,71,87,0.4)', background: 'rgba(255,71,87,0.03)' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-red)', marginBottom: 10 }}>Danger Zone</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <button onClick={() => setShowDeleteModal(true)} className="btn btn-danger" style={{ gap: 6 }}>
          <Trash2 size={14} />
          Delete Account
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div className="card" style={{ maxWidth: 420, width: '100%', border: '1px solid rgba(255,71,87,0.4)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Delete Account</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
              This will permanently delete your account, watchlist, and all data. Type <strong style={{ color: 'var(--accent-red)', fontFamily: 'JetBrains Mono, monospace' }}>DELETE</strong> to confirm.
            </p>
            <input
              className="form-input"
              placeholder="Type DELETE to confirm"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              style={{ marginBottom: 16, borderColor: deleteConfirm === 'DELETE' ? 'var(--accent-red)' : 'var(--border)' }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirm('') }}
                className="btn btn-outline"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== 'DELETE' || deleting}
                className="btn btn-danger"
                style={{ flex: 1, justifyContent: 'center', opacity: deleteConfirm !== 'DELETE' ? 0.5 : 1 }}
              >
                {deleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
