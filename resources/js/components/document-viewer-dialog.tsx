import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CenteredSpinner } from '@/components/centered-spinner';
import { ExternalLink } from 'lucide-react';
import { ReactNode, useEffect, useState } from 'react';

type DocumentViewerDialogProps = {
    title: string;
    src: string;
    trigger: ReactNode;
    fileType?: 'pdf' | 'image';
};

export function DocumentViewerDialog({ title, src, trigger, fileType = 'pdf' }: DocumentViewerDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            setLoading(true);
        }
    }, [open, src]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="flex h-[96vh] w-[96vw] max-w-[96vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-[96vw]">
                <DialogHeader className="flex flex-row items-center justify-between gap-3 border-b px-6 py-4 pr-14">
                    <DialogTitle>{title}</DialogTitle>
                    <Button asChild type="button" variant="outline" size="sm" className="shrink-0">
                        <a href={src} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-4 w-4" /> Buka tab baru
                        </a>
                    </Button>
                </DialogHeader>

                <div className="bg-muted/30 relative flex-1 overflow-hidden">
                    {open && loading && (
                        <div className="bg-background/70 absolute inset-0 z-20 backdrop-blur-sm">
                            <CenteredSpinner className="h-full py-0" iconClassName="text-primary h-8 w-8" />
                        </div>
                    )}

                    {!open ? null : fileType === 'image' ? (
                        <div className="absolute inset-0 flex items-center justify-center p-4">
                            <img src={src} alt={title} className="max-h-full max-w-full object-contain" onLoad={() => setLoading(false)} />
                        </div>
                    ) : (
                        <iframe src={src} className="absolute inset-0 h-full w-full border-0" title={title} onLoad={() => setLoading(false)} />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
