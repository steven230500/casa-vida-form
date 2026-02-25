import Link from "next/link";

export default function SuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-black">
      <div className="max-w-md w-full text-center bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800">
        <div className="text-6xl mb-6">✅</div>
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          ¡Respuesta enviada con éxito!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Muchas gracias por tomarte el tiempo para completar este formulario.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
