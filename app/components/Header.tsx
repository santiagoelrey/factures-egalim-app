'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, FileText, BarChart3, UtensilsCrossed, Settings } from 'lucide-react';

export default function Header() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-4xl mx-auto px-4 md:px-8">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl text-gray-900">
                        <span className="bg-blue-600 text-white p-1 rounded-lg">EG</span>
                        <span>Factures Egalim</span>
                    </div>

                    <div className="flex gap-1 md:gap-4">
                        <Link
                            href="/"
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/')
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <FileText className="w-4 h-4" />
                            <span className="hidden md:inline">Factures</span>
                        </Link>

                        <Link
                            href="/stock"
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/stock')
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <Package className="w-4 h-4" />
                            <span className="hidden md:inline">Stock</span>
                        </Link>

                        <Link
                            href="/menu"
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/menu')
                                ? 'bg-orange-50 text-orange-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <UtensilsCrossed className="w-4 h-4" />
                            <span className="hidden md:inline">Menus</span>
                        </Link>

                        <Link
                            href="/reporting"
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/reporting')
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <BarChart3 className="w-4 h-4" />
                            <span className="hidden md:inline">Indicateurs</span>
                        </Link>

                        <Link
                            href="/settings"
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/settings')
                                ? 'bg-gray-100 text-gray-900'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <Settings className="w-4 h-4" />
                            <span className="hidden md:inline">Paramètres</span>
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
