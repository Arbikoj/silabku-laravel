import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Users, Filter, ChevronRight, FileText, Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Database Asisten', href: '/database-asisten' }, { title: 'Per Event', href: '/database-asisten/per-event' }];

export default function AssistantPerEventPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string>('');
    const [assistants, setAssistants] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get('/events').then(r => {
            setEvents(r.data.data);
            if (r.data.data.length > 0) setSelectedEventId(r.data.data[0].id.toString());
        });
    }, []);

    useEffect(() => {
        if (!selectedEventId) return;
        setLoading(true);
        api.get('/database/asisten', { params: { event_id: selectedEventId, per_page: 100 } })
            .then(r => setAssistants(r.data.data))
            .finally(() => setLoading(false));
    }, [selectedEventId]);

    const currentEvent = events.find(e => e.id.toString() === selectedEventId);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Asisten Per Event" />
            <div className="p-5 max-w-6xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-primary"><Users className="h-6 w-6" /> Daftar Asisten Per Periode</h1>
                    <p className="text-muted-foreground text-sm">Lihat daftar asisten yang bertugas pada event rekrutmen tertentu.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <aside className="md:col-span-1 space-y-4">
                        <Card className="border-primary/10 shadow-sm overflow-hidden">
                            <CardHeader className="bg-muted/30 py-4">
                                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Filter className="h-3 w-3" /> Pilih Event
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 px-2">
                                <div className="space-y-1">
                                    {events.map(ev => (
                                        <button
                                            key={ev.id}
                                            onClick={() => setSelectedEventId(ev.id.toString())}
                                            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center justify-between group ${selectedEventId === ev.id.toString() ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-primary/5 text-muted-foreground'}`}
                                        >
                                            <span className="truncate">{ev.nama}</span>
                                            <ChevronRight className={`h-4 w-4 transition-transform ${selectedEventId === ev.id.toString() ? 'translate-x-0' : '-translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'}`} />
                                        </button>
                                    ))}
                                    {events.length === 0 && <p className="text-center text-xs text-muted-foreground py-4 italic">Belum ada event.</p>}
                                </div>
                            </CardContent>
                        </Card>
                        
                        {currentEvent && (
                            <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 space-y-3">
                                <div className="text-[10px] font-bold text-primary/60 uppercase">Statistik Event</div>
                                <div className="flex justify-between items-end">
                                    <span className="text-xs text-muted-foreground">Total Asisten</span>
                                    <span className="text-2xl font-black text-primary">{assistants.length}</span>
                                </div>
                                <Button variant="outline" size="sm" className="w-full bg-background border-primary/20 text-primary hover:bg-primary/5">
                                    <Download className="h-3.5 w-3.5 mr-2" /> Export PDF/Excel
                                </Button>
                            </div>
                        )}
                    </aside>

                    <main className="md:col-span-3">
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse border" />)}
                            </div>
                        ) : (
                            <Card className="border-primary/10 shadow-sm overflow-hidden">
                                <CardHeader className="border-b bg-card">
                                    <CardTitle>{currentEvent?.nama || 'Pilih Event'}</CardTitle>
                                    <CardDescription>{currentEvent?.semester?.nama} • {assistants.length} Penugasan Terdaftar</CardDescription>
                                </CardHeader>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50">
                                            <tr>
                                                <th className="px-6 py-4 text-left font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Nama / NIM</th>
                                                <th className="px-6 py-4 text-left font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Unit / Mata Kuliah</th>
                                                <th className="px-6 py-4 text-right font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Kontak</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {assistants.map(amk => (
                                                <tr key={amk.id} className="hover:bg-primary/5 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-foreground">{amk.application.user.profile?.nama_lengkap || amk.application.user.name}</div>
                                                        <div className="text-xs text-muted-foreground font-mono">{amk.application.user.nim}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant="outline" className="bg-background border-primary/20 text-primary text-[10px] px-1.5 py-0">
                                                            {amk.event_mata_kuliah.mata_kuliah.nama} ({amk.event_mata_kuliah.kelas.nama})
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:bg-green-50" asChild title="Hubungi via WhatsApp">
                                                                <a href={`https://wa.me/${amk.application.user.profile?.no_wa}`} target="_blank"><Users className="h-4 w-4" /></a>
                                                            </Button>
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50" asChild title="Kirim Email">
                                                                <a href={`mailto:${amk.application.user.email}`}><FileText className="h-4 w-4" /></a>
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {assistants.length === 0 && (
                                                <tr>
                                                    <td colSpan={3} className="px-6 py-20 text-center text-muted-foreground flex flex-col items-center gap-2">
                                                        <Users className="h-10 w-10 opacity-10" />
                                                        <p className="font-serif italic">Belum ada asisten yang terdaftar untuk periode ini.</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        )}
                    </main>
                </div>
            </div>
        </AppLayout>
    );
}
