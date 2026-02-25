import Link from "next/link";
import { signout } from "@/app/login/actions";
import { LogOut, LayoutDashboard, FileText } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black font-sans text-gray-900 dark:text-gray-100">
      {/* Top Navigation Bar */}
      <header className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/admin/forms" className="flex items-center space-x-2">
                <LayoutDashboard className="w-6 h-6" />
                <span className="font-bold text-lg tracking-tight">
                  Admin Panel
                </span>
              </Link>
              <nav className="ml-10 hidden md:flex space-x-8 items-center">
                <Link
                  href="/admin/forms"
                  className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors flex items-center space-x-1"
                >
                  <FileText className="w-4 h-4" />
                  <span>Forms</span>
                </Link>
                <Link
                  href="/reviewer"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 px-3 py-2 text-sm font-medium transition-colors flex items-center space-x-1 border border-blue-200 dark:border-blue-900 rounded-full bg-blue-50 dark:bg-blue-900/20"
                >
                  <span>📋 Reviewer Panel</span>
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-400 mr-2">Admin Mode</div>
              {/* Logout button */}
              <form action={signout}>
                <button
                  type="submit"
                  className="flex items-center space-x-2 text-sm text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Salir</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
