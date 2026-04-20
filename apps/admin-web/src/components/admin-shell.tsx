'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { navigationItems } from '../lib/navigation';

type AdminShellProps = {
  children: ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
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
            <p className="status-title">حالة التأسيس</p>
            <p className="status-copy">واجهة الإدارة جاهزة للربط مع API المستقل في المرحلة التالية.</p>
          </div>
        </div>
      </aside>

      <main className="content-panel">{children}</main>
    </div>
  );
}
