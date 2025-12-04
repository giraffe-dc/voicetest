"use client";

import { useEffect } from 'react';
import useWakeLock from '../hooks/useWakeLock';

export default function AppInitializer({ children }: { children: React.ReactNode }) {
  useWakeLock();

  return <>{children}</>;
}
