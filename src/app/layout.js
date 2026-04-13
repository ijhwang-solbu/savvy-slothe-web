import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata = {
  title: '작심삼일 - 3일에 한 번만',
  description: '3일에 한번만 해도 성공한 인생, 조금 이뤄도 괜찮은 벼락치기 페이스메이커',
  robots: 'index, follow',
};

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <head>
        <link rel='manifest' href='/manifest.json' />
        <meta name='theme-color' content='#000000ff' />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  );
}
