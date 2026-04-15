import { cn } from '@/lib/utils';
import { LoaderCircle } from 'lucide-react';

type CenteredSpinnerProps = {
    className?: string;
    iconClassName?: string;
};

export function CenteredSpinner({ className, iconClassName }: CenteredSpinnerProps) {
    return (
        <div className={cn('flex items-center justify-center py-10', className)}>
            <LoaderCircle className={cn('text-muted-foreground h-8 w-8 animate-spin', iconClassName)} />
        </div>
    );
}
