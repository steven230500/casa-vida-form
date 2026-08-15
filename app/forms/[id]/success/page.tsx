import Link from "next/link";

export default function SuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full text-center bg-card p-8 rounded-2xl border border-border">
        <div className="text-6xl mb-6">✅</div>
        <h1 className="text-2xl font-serif mb-4">
          ¡Respuesta enviada con éxito!
        </h1>
        <p className="text-muted-foreground mb-8">
          Muchas gracias por tomarte el tiempo para completar este formulario.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-primary text-primary-foreground font-medium rounded-full hover:bg-primary/90 transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
