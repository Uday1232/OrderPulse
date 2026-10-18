import type { Metadata } from 'next';
import { ThemeRegistry } from '../theme/ThemeRegistry';
import { QueryClientProvider } from '../context/QueryClientProvider';
import { SocketProvider } from '../context/SocketContext';
import { NotificationProvider } from '../components/NotificationProvider';
import { Navbar } from '../components/Navbar';
import { RealtimeAlert } from '../components/RealtimeAlert';

export const metadata: Metadata = {
  title: 'StorePulse POS - Multi-Store Restaurant Order Management',
  description: 'Production-ready restaurant POS platform and multi-store management system with real-time tracking, Redis caching, and analytics.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#0D1117', color: '#F3F4F6' }}>
        <ThemeRegistry>
          <QueryClientProvider>
            <SocketProvider>
              <NotificationProvider>
                <Navbar />
                <main style={{ minHeight: 'calc(100vh - 70px)' }}>{children}</main>
                <RealtimeAlert />
              </NotificationProvider>
            </SocketProvider>
          </QueryClientProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
