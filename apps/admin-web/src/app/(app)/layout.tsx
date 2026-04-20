import type { ReactNode } from 'react';

import { AdminShell } from '../../components/admin-shell';
import { getSessionUserOrRedirect } from '../../lib/auth';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getSessionUserOrRedirect();

  return <AdminShell user={session.user}>{children}</AdminShell>;
}
