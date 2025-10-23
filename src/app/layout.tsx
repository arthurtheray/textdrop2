import type { Metadata } from 'next';
import { Inter, Fira_Code } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'cyrillic'],
});

const fira = Fira_Code({
  variable: '--font-fira',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Textdrop — личный обмен текстом',
  description:
    'Сервис для быстрого обмена текстами между устройствами с возможностью приватных заметок под секретным ключом.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${inter.variable} ${fira.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
