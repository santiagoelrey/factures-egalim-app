'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, FileText, BarChart3, UtensilsCrossed, Settings } from 'lucide-react';
import SyncButton from './SyncButton';

export default function Header() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <>
            {/* Desktop Top Navigation */}
            <div className="hidden md:block sticky top-0 z-50">
                <nav className="bg-white border-b border-gray-200">
                    <div className="max-w-6xl mx-auto px-4 md:px-8">
                        <div className="flex h-16 items-center justify-between">
                            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-gray-900 hover:opacity-90 transition-opacity">
                                <span className="bg-blue-600 text-white p-1 rounded-lg">EG</span>
                                <span>Factures Egalim</span>
                            </Link>

                            <div className="flex items-center gap-3">
                                <div className="flex gap-1 lg:gap-2">
                                    <Link
                                        href="/"
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/')
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                    >
                                        <FileText className="w-4 h-4" />
                                        <span>Factures</span>
                                    </Link>

                                    <Link
                                        href="/stock"
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/stock')
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                    >
                                        <Package className="w-4 h-4" />
                                        <span>Stock</span>
                                    </Link>

                                    <Link
                                        href="/menu"
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/menu')
                                            ? 'bg-orange-50 text-orange-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                    >
                                        <UtensilsCrossed className="w-4 h-4" />
                                        <span>Menus</span>
                                    </Link>

                                    <Link
                                        href="/reporting"
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/reporting')
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                    >
                                        <BarChart3 className="w-4 h-4" />
                                        <span>Indicateurs</span>
                                    </Link>

                                    <Link
                                        href="/settings"
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/settings')
                                            ? 'bg-gray-100 text-gray-900'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                    >
                                        <Settings className="w-4 h-4" />
                                        <span>Paramètres</span>
                                    </Link>
                                </div>

                                <div className="pl-3 border-l border-gray-200">
                                    <SyncButton />
                                </div>
                            </div>
                        </div>
                    </div>
                </nav>
            </div>

            {/* Mobile Top Header (with Logo and Sync Button) */}
            <header className="block md:hidden sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 shadow-xs">
                <div className="flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 font-bold text-lg text-gray-900">
                        <span className="bg-blue-600 text-white px-2 py-0.5 rounded-lg text-sm">EG</span>
                        <span className="text-base tracking-tight">Factures Egalim</span>
                    </Link>
                    <div>
                        <SyncButton compact={false} />
                    </div>
                </div>
            </header>

            {/* Mobile Bottom Navigation */}
            <nav className="block md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)] shadow-lg">
                <div className="grid grid-cols-5 h-16 items-center">
                    <Link
                        href="/"
                        className={`flex flex-col items-center justify-center h-full py-1 gap-1 transition-colors ${
                            isActive('/')
                                ? 'text-blue-600 font-semibold'
                                : 'text-gray-500 hover:text-gray-900 font-medium'
                        }`}
                    >
                        <FileText className="w-5 h-5" />
                        <span className="text-[10px] leading-tight">Factures</span>
                    </Link>

                    <Link
                        href="/stock"
                        className={`flex flex-col items-center justify-center h-full py-1 gap-1 transition-colors ${
                            isActive('/stock')
                                ? 'text-blue-600 font-semibold'
                                : 'text-gray-500 hover:text-gray-900 font-medium'
                        }`}
                    >
                        <Package className="w-5 h-5" />
                        <span className="text-[10px] leading-tight">Stock</span>
                    </Link>

                    <Link
                        href="/menu"
                        className={`flex flex-col items-center justify-center h-full py-1 gap-1 transition-colors ${
                            isActive('/menu')
                                ? 'text-blue-600 font-semibold'
                                : 'text-gray-500 hover:text-gray-900 font-medium'
                        }`}
                    >
                        <UtensilsCrossed className="w-5 h-5" />
                        <span className="text-[10px] leading-tight">Menus</span>
                    </Link>

                    <Link
                        href="/reporting"
                        className={`flex flex-col items-center justify-center h-full py-1 gap-1 transition-colors ${
                            isActive('/reporting')
                                ? 'text-blue-600 font-semibold'
                                : 'text-gray-500 hover:text-gray-900 font-medium'
                        }`}
                    >
                        <BarChart3 className="w-5 h-5" />
                        <span className="text-[10px] leading-tight">Indicateurs</span>
                    </Link>

                    <Link
                        href="/settings"
                        className={`flex flex-col items-center justify-center h-full py-1 gap-1 transition-colors ${
                            isActive('/settings')
                                ? 'text-blue-600 font-semibold'
                                : 'text-gray-500 hover:text-gray-900 font-medium'
                        }`}
                    >
                        <Settings className="w-5 h-5" />
                        <span className="text-[10px] leading-tight">Paramètres</span>
                    </Link>
                </div>
            </nav>
        </>
    );
}
