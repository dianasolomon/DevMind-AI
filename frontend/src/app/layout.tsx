import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DevMind AI – AI Codebase Understanding Assistant',
  description: 'Instant codebase architecture comprehension, vector AST indexing, and contextual developer assistant.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090d16] text-slate-100 antialiased selection:bg-violet-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
