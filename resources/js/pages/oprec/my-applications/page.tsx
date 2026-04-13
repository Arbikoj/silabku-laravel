import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Calendar, CheckCircle2, Clock, Info, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Open Recruitment', href: '#' },
    { title: 'Pendaftaran Saya', href: '/oprec/my-applications' },
];

export default function MyApplicationsPage() {
    const [apps, setApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/applications/my').then((r) => {
            setApps(r.data);
            setLoading(false);
        });
    }, []);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved':
                return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case 'rejected':
                return <XCircle className="h-5 w-5 text-red-500" />;
            default:
                return <Clock className="h-5 w-5 animate-pulse text-amber-500" />;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Status Pendaftaran Saya" />
            <div className="p-5">
                <header className="mb-8">
                    <h1 className="text-2xl font-bold">Pendaftaran Saya</h1>
                    <p className="text-muted-foreground">Lacak status pengajuan asisten Anda di sini.</p>
                </header>

                <div className="space-y-4">
                    {loading
                        ? [1, 2].map((i) => <div key={i} className="bg-muted h-32 animate-pulse rounded-xl" />)
                        : apps.map((app) => (
                              <Card key={app.id} className="border-muted/50 overflow-hidden shadow-sm transition-all hover:shadow-md">
                                  <CardHeader className="bg-muted/20 flex flex-row items-center justify-between border-b py-4">
                                      <div className="flex items-center gap-3">
                                          <div className="bg-background text-primary flex h-10 w-10 items-center justify-center rounded-lg border">
                                              <Calendar className="h-6 w-6" />
                                          </div>
                                          <div>
                                              <CardTitle className="text-md">{app.event.nama}</CardTitle>
                                              <div className="text-muted-foreground text-xs">{app.event.semester.nama}</div>
                                          </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                          {getStatusIcon(app.status)}
                                          <Badge
                                              variant={
                                                  app.status === 'approved' ? 'default' : app.status === 'rejected' ? 'destructive' : 'secondary'
                                              }
                                              className="capitalize"
                                          >
                                              {app.status}
                                          </Badge>
                                      </div>
                                  </CardHeader>
                                  <CardContent className="pt-4 pb-4">
                                      <div className="space-y-4">
                                          <div className="text-muted-foreground decoration-primary/30 text-xs font-semibold tracking-wider uppercase underline underline-offset-4">
                                              Rincian Mata Kuliah & Status
                                          </div>
                                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                              {app.application_mata_kuliah.map((amk: any, i: number) => (
                                                  <div
                                                      key={i}
                                                      className="bg-background/50 hover:bg-muted/10 flex flex-col gap-2 rounded-lg border p-3 transition-colors"
                                                  >
                                                      <div className="flex items-start justify-between gap-4">
                                                          <div>
                                                              <div className="mb-1 text-sm leading-tight font-semibold">
                                                                  {amk.event_mata_kuliah.mata_kuliah.nama}
                                                              </div>
                                                              <div className="text-muted-foreground text-xs">
                                                                  Kelas {amk.event_mata_kuliah.kelas.nama}
                                                              </div>
                                                          </div>
                                                          <Badge
                                                              variant={
                                                                  amk.status === 'approved'
                                                                      ? 'default'
                                                                      : amk.status === 'rejected'
                                                                        ? 'destructive'
                                                                        : 'secondary'
                                                              }
                                                              className="flex shrink-0 items-center gap-1.5 px-2.5 py-0.5 capitalize"
                                                          >
                                                              {amk.status === 'approved' && <CheckCircle2 className="h-3.5 w-3.5" />}
                                                              {amk.status === 'rejected' && <XCircle className="h-3.5 w-3.5" />}
                                                              {amk.status === 'pending' && <Clock className="h-3.5 w-3.5" />}
                                                              {amk.status}
                                                          </Badge>
                                                      </div>
                                                      {amk.catatan && (
                                                          <div className="mt-1 flex items-start gap-2 rounded border border-amber-100/50 bg-amber-50/50 p-2 text-xs text-amber-800">
                                                              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                                              <span className="italic">{amk.catatan}</span>
                                                          </div>
                                                      )}
                                                  </div>
                                              ))}
                                          </div>

                                          {app.catatan && (
                                              <div className="mt-4 flex w-full gap-2 rounded-lg border border-amber-100 bg-amber-50 p-3">
                                                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
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
                        <div className="text-muted-foreground bg-muted/10 rounded-3xl border-2 border-dashed py-20 text-center">
                            <Clock className="mx-auto mb-4 h-12 w-12 opacity-20" />
                            <p className="font-serif italic">Anda belum memiliki riwayat pendaftaran.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
