export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full text-center bg-card p-8 rounded-2xl border border-border">
        <div className="text-6xl mb-6">📋</div>
        <h1 className="text-2xl font-serif mb-4">
          Usa el enlace que te compartieron
        </h1>
        <p className="text-muted-foreground mb-8">
          Cada formulario de Casa Vida tiene su propio enlace o código QR.
          Si llegaste aquí sin uno, visita el sitio principal de la iglesia.
        </p>
        <a
          href="https://casavidactg.com"
          className="inline-block px-6 py-3 bg-primary text-primary-foreground font-medium rounded-full hover:bg-primary/90 transition-colors"
        >
          Ir a casavidactg.com
        </a>
      </div>
    </div>
  );
}
