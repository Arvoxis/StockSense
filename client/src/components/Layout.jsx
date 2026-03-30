import React, { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const location = useLocation()

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((v) => !v)} />
      <div
        style={{
          flex: 1,
          marginLeft: sidebarCollapsed ? 0 : 'var(--sidebar-width)',
          transition: 'margin-left 0.25s ease',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        <Topbar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((v) => !v)} />
        <main
          key={location.pathname}
          className="page-enter"
          style={{
            flex: 1,
            padding: '24px',
            overflowY: 'auto',
            minHeight: 'calc(100vh - var(--topbar-height))',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
