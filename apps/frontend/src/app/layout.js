import { AuthProvider } from '@/contexts/AuthContext';
import { QueryProvider } from '@/lib/QueryProvider';
import './globals.css';
export const metadata = {
    title: 'Prime Academic Manager',
    description: 'Academic Management System',
};
export default function RootLayout({ children, }) {
    return (<html lang="en" suppressHydrationWarning>
      <body>
        <QueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>);
}
//# sourceMappingURL=layout.js.map