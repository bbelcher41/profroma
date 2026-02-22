import './globals.css';

export const metadata = {
  title: 'Financial Statement Consolidator',
  description: 'Upload PDFs + COA and generate consolidated table + Excel export',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
