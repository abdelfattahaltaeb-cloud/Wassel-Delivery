import type { ReactNode } from 'react';

import { AdminShell } from '../../components/admin-shell';
import { getAdminSessionOrRedirect } from '../../lib/auth';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getAdminSessionOrRedirect();

  return <AdminShell user={session.user}>{children}</AdminShell>;
}
