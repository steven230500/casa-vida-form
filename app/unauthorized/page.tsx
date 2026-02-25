import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-4 text-center">
      <div className="rounded-full bg-red-100 p-4 text-red-600 mb-6 dark:bg-red-900/30">
        <ShieldAlert className="w-12 h-12" />
      </div>
      <h1 className="text-3xl font-bold mb-3">Acceso Denegado</h1>
      <p className="text-muted-foreground mb-8 text-lg max-w-md">
        No tienes los permisos necesarios para acceder a esta sección. Si crees
        que esto es un error, por favor contacta al administrador.
      </p>
      <Link
        href="/"
        className="rounded-xl bg-primary text-primary-foreground px-6 py-3 font-medium transition-colors hover:bg-primary/90"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
