import AppLogoIcon from './app-logo-icon';
import { cn } from '@/lib/utils';

export default function AppLogo({ className, iconOnly = false }: { className?: string; iconOnly?: boolean }) {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg shadow-lg shadow-primary/20">
                <AppLogoIcon className="size-5 fill-none stroke-current" />
            </div>
            {!iconOnly && (
                <div className="grid flex-1 text-left text-sm leading-tight text-foreground">
                    <span className="truncate font-bold tracking-tight">SiLabku</span>
                    <span className="truncate text-[10px] font-medium opacity-60">Sains Data ITERA</span>
                </div>
            )}
        </div>
    );
}
