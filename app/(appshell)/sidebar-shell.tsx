'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';

const navItems = [
  { href: '/home', icon: '⌂', label: 'Home' },
  { href: '/search', icon: '⌕', label: 'Search' },
  { href: '/topics', icon: '#', label: 'Topics' },
  { href: '/tidy', icon: '✓', label: 'Tidy Up' },
  { href: '/account', icon: '⚙', label: 'Account' },
];

function isActive(pathname: string, href: string) {
  if (href === '/home') return pathname === '/home';
  if (href === '/account') return pathname.startsWith('/account');
  if (href === '/topics') return pathname.startsWith('/topics') || pathname.startsWith('/link/');
  return pathname.startsWith(href);
}

export function SidebarShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const title = useMemo(() => {
    if (pathname.startsWith('/link/')) return 'Link Detail';
    if (pathname.startsWith('/search')) return 'Search';
    if (pathname.startsWith('/topics')) return 'Topics';
    if (pathname.startsWith('/tidy')) return 'Tidy Up';
    if (pathname.startsWith('/account')) return 'Account';
    return 'Home';
  }, [pathname]);

  return (
    <div className="stash-app-shell" data-collapsed={collapsed ? 'true' : 'false'}>
      <aside className="stash-sidebar" aria-label="Primary sidebar">
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            border: '1px solid #d5c9bc',
            background: '#fff',
            boxShadow: '0 4px 12px rgba(67,46,20,.11)',
            cursor: 'pointer',
            marginBottom: 12,
          }}
        >
          {collapsed ? '☰' : '⟨'}
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 14,
            padding: '0.3rem 0.35rem',
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 10,
              background: 'linear-gradient(145deg, #f4a14b, #dc7318)',
              boxShadow: '0 6px 18px rgba(220,115,24,.33)',
            }}
          />
          {!collapsed && (
            <div>
              <p style={{ margin: 0, fontWeight: 760, letterSpacing: '.04em' }}>STASH</p>
              <p style={{ margin: 0, color: '#786d61', fontSize: '.82rem' }}>Knowledge cockpit</p>
            </div>
          )}
        </div>

        <nav style={{ display: 'grid', gap: 6 }}>
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  textDecoration: 'none',
                  color: active ? '#1f1a14' : '#635a50',
                  padding: collapsed ? '0.6rem 0.5rem' : '0.62rem 0.72rem',
                  borderRadius: 12,
                  border: active ? '1px solid #d8cabc' : '1px solid transparent',
                  background: active ? 'linear-gradient(180deg,#fff,#f3ece4)' : 'transparent',
                  boxShadow: active ? '0 7px 16px rgba(67,46,20,.11)' : 'none',
                  fontWeight: active ? 650 : 520,
                }}
              >
                <span aria-hidden>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div style={{ marginTop: 'auto', padding: collapsed ? '0.6rem 0.45rem' : '0.7rem', borderRadius: 12, border: '1px solid #dfd5ca', background: '#f7f2ec' }}>
          <p style={{ margin: 0, fontSize: '.76rem', color: '#786d61', textTransform: 'uppercase', letterSpacing: '.08em' }}>
            {collapsed ? 'M' : 'Mode'}
          </p>
          {!collapsed && <p style={{ margin: '.25rem 0 0', fontWeight: 640 }}>MVP</p>}
        </div>
      </aside>

      <section className="stash-main">
        <div className="stash-main-inner">
          <header className="stash-screen-head">
            <div>
              <h1 className="stash-screen-title">{title}</h1>
              <p className="stash-screen-subtitle">Progressive IA screens for Stash MVP.</p>
            </div>
            <span className="stash-chip">MVP</span>
          </header>
          {children}
        </div>
      </section>
    </div>
  );
}
