import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Simple header */}
      <header className="bg-white border-b border-border py-4">
        <div className="container mx-auto px-4">
          <Link href="/">
            <span className="text-xl font-bold text-primary">
              Farma<span className="text-secondary">Madyson</span>
            </span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Simple footer */}
      <footer className="py-4 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Farma Madyson. Todos los derechos reservados.
      </footer>
    </div>
  );
}
