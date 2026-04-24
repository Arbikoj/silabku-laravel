import AppLogo from '@/components/app-logo';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({ children, title, description }: PropsWithChildren<AuthLayoutProps>) {
    return (
        <div className="relative min-h-screen flex items-center justify-center p-6 md:p-10 bg-background overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(var(--primary-rgb),0.05)_0,transparent_50%),radial-gradient(circle_at_80%_80%,rgba(79,70,229,0.05)_0,transparent_50%)]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] -z-20 bg-[radial-gradient(circle_at_center,rgba(var(--primary-rgb),0.03)_0,transparent_70%)] blur-3xl opacity-50" />

            <div className="w-full max-w-[400px]">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-6">
                        <Link href={route('home')} className="transition-transform hover:scale-105 active:scale-95">
                            <AppLogo className="h-10 w-auto fill-primary" />
                        </Link>
                        
                        <div className="space-y-1.5 text-center px-4">
                            <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
                            <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
                        </div>
                    </div>
                    
                    <div className="bg-card border p-8 rounded-[2rem] shadow-2xl shadow-primary/5 transition-all">
                        {children}
                    </div>
                    
                    {/* Footer for Auth Pages */}
                    <p className="text-center text-xs text-muted-foreground">
                        &copy; {new Date().getFullYear()} Silabku ITERA. <br />
                        Sistem Pengelolaan Data Asisten Praktikum.
                    </p>
                </div>
            </div>
        </div>
    );
}
