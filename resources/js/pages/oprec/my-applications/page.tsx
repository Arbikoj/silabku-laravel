import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Clock, CheckCircle2, XCircle, Info, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Open Recruitment', href: '#' }, { title: 'Pendaftaran Saya', href: '/oprec/my-applications' }];

export default function MyApplicationsPage() {
    const [apps, setApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/applications/my').then(r => {
            setApps(r.data);
            setLoading(false);
        });
    }, []);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case 'rejected': return <XCircle className="h-5 w-5 text-red-500" />;
            default: return <Clock className="h-5 w-5 text-amber-500 animate-pulse" />;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Status Pendaftaran Saya" />
            <div className="p-5 max-w-4xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-2xl font-bold">Pendaftaran Saya</h1>
                    <p className="text-muted-foreground">Lacak status pengajuan asisten Anda di sini.</p>
                </header>

                <div className="space-y-4">
                    {loading ? (
                        [1, 2].map(i => <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />)
                    ) : apps.map(app => (
                        <Card key={app.id} className="overflow-hidden border-muted/50 shadow-sm transition-all hover:shadow-md">
                            <CardHeader className="flex flex-row items-center justify-between py-4 bg-muted/20 border-b">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-background border flex items-center justify-center text-primary">
                                        <Calendar className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-md">{app.event.nama}</CardTitle>
                                        <div className="text-xs text-muted-foreground">{app.event.semester.nama}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getStatusIcon(app.status)}
                                    <Badge variant={app.status === 'approved' ? 'default' : app.status === 'rejected' ? 'destructive' : 'secondary'} className="capitalize">
                                        {app.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 pb-4">
                                <div className="space-y-4">
                                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider underline decoration-primary/30 underline-offset-4">Rincian Mata Kuliah & Status</div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {app.application_mata_kuliah.map((amk: any, i: number) => (
                                            <div key={i} className="flex flex-col gap-2 p-3 rounded-lg border bg-background/50 hover:bg-muted/10 transition-colors">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div>
                                                        <div className="font-semibold text-sm leading-tight mb-1">{amk.event_mata_kuliah.mata_kuliah.nama}</div>
                                                        <div className="text-xs text-muted-foreground">Kelas {amk.event_mata_kuliah.kelas.nama}</div>
                                                    </div>
                                                    <Badge variant={amk.status === 'approved' ? 'default' : amk.status === 'rejected' ? 'destructive' : 'secondary'} className="capitalize shrink-0 flex items-center gap-1.5 px-2.5 py-0.5">
                                                        {amk.status === 'approved' && <CheckCircle2 className="h-3.5 w-3.5" />}
                                                        {amk.status === 'rejected' && <XCircle className="h-3.5 w-3.5" />}
                                                        {amk.status === 'pending' && <Clock className="h-3.5 w-3.5" />}
                                                        {amk.status}
                                                    </Badge>
                                                </div>
                                                {amk.catatan && (
                                                    <div className="mt-1 flex gap-2 items-start bg-amber-50/50 p-2 rounded text-xs border border-amber-100/50 text-amber-800">
                                                        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                                        <span className="italic">{amk.catatan}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {app.catatan && (
                                        <div className="w-full bg-amber-50 rounded-lg p-3 border border-amber-100 flex gap-2 mt-4">
                                            <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                            <div className="text-xs text-amber-800">
                                                <span className="font-bold">Catatan Pendaftaran Utama:</span> {app.catatan}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {!loading && apps.length === 0 && (
                        <div className="py-20 text-center text-muted-foreground bg-muted/10 rounded-3xl border-2 border-dashed">
                            <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p className="font-serif italic">Anda belum memiliki riwayat pendaftaran.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
