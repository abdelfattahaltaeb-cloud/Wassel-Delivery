'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { navigationItems } from '../lib/navigation';
import type { SessionUser } from '../lib/auth';

type AdminShellProps = {
  user: SessionUser;
  children: ReactNode;
};

export function AdminShell({ user, children }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <aside className="sidebar-card">
        <div>
          <p className="eyebrow">Wassel Delivery</p>
          <h1 className="sidebar-title">مركز التحكم التشغيلي</h1>
          <p className="sidebar-copy">
            منصة داخلية مستقلة لإدارة الطلبات والتشغيل والتتبع والتسويات.
          </p>
        </div>

        <nav className="sidebar-nav" aria-label="Primary">
          {navigationItems.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? 'nav-item nav-item-active' : 'nav-item'}
              >
                <span className="nav-item-label">{item.label}</span>
                <span className="nav-item-description">{item.description}</span>
              </Link>
            );
          })}
        </nav>

        <div className="status-panel">
          <span className="status-dot" />
          <div>
            <p className="status-title">جلسة تشغيلية نشطة</p>
            <p className="status-copy">
              {user.firstName} {user.lastName} · {user.roles.join(' / ')}
            </p>
            <a className="secondary-link inline-link" href="/logout">
              تسجيل الخروج
            </a>
          </div>
        </div>
      </aside>

      <main className="content-panel">{children}</main>
    </div>
  );
}
