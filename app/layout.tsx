import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'IARA — Painel',
  description: 'Plataforma de criação e operação de influenciadoras virtuais de IA.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="font-sans">{children}</body>
    </html>
  );
}
