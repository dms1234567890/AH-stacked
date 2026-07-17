import type { Metadata } from 'next';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryProvider } from '@/lib/QueryProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Prime Academic Manager',
  description: 'Academic Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <QueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}