/**
 * @fileoverview Client-side providers wrapper
 *
 * Wraps the app with all client-side context providers.
 */

'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
