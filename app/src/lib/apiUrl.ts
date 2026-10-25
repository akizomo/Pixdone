import { Capacitor } from '@capacitor/core';

// The web app is served from the same origin as the API, so relative paths work.
// The native app loads its bundle from capacitor://localhost (iOS) / https://localhost
// (Android), so API calls must target the deployed origin explicitly.
const NATIVE_API_ORIGIN = import.meta.env.VITE_NATIVE_API_ORIGIN ?? 'https://pixdone.vercel.app';

export function apiUrl(path: string): string {
  return Capacitor.isNativePlatform() ? `${NATIVE_API_ORIGIN}${path}` : path;
}
