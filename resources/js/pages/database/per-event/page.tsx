import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Users, Filter, FileText, Download, Search } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Database Asisten', href: '/database-asisten' },
    { title: 'Per Event', href: '/database-asisten/per-event' }
];

export default function AssistantPerEventPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [filters, setFilters] = useState({ event_id: '', search: '' });
    const [assistants, setAssistants] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const fetchEvents = useCallback(() => {
        api.get('/events').then(r => {
            setEvents(r.data.data);
            if (r.data.data.length > 0) {
                setFilters(f => ({ ...f, event_id: r.data.data[0].id.toString() }));
            }
        });
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const fetchAssistants = useCallback(() => {
        if (!filters.event_id) return;
        setLoading(true);
        api.get('/database/asisten', { params: { ...filters, page, per_page: 20 } })
            .then(r => {
                setAssistants(r.data.data);
                setTotal(r.data.meta.total);
            })
            .finally(() => setLoading(false));
    }, [filters, page]);

    useEffect(() => {
        fetchAssistants();
    }, [fetchAssistants]);

    const currentEvent = events.find(e => e.id.toString() === filters.event_id);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Asisten Per Event" />
            <div className="p-5 max-w-6xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-primary">
                        <Users className="h-6 w-6" /> Daftar Asisten Per Periode
                    </h1>
                    <p className="text-muted-foreground text-sm">Lihat daftar asisten yang bertugas pada event rekrutmen tertentu.</p>
                </header>

                <div className="flex flex-col md:flex-row gap-4 items-end mb-6 bg-card p-5 rounded-xl border border-primary/10 shadow-sm">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                        <div className="grid gap-1.5">
                            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                <Filter className="h-3 w-3" /> EVENT
                            </label>
                            <Select value={filters.event_id} onValueChange={v => { setFilters(f => ({ ...f, event_id: v })); setPage(1); }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Event" />
                                </SelectTrigger>
                                <SelectContent>
                                    {events.map(e => <SelectItem key={e.id} value={e.id.toString()}>{e.nama}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-1.5">
                            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                <Search className="h-3 w-3" /> PENCARIAN
                            </label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Cari nama atau NIM..." 
                                    className="pl-9" 
                                    value={filters.search} 
                                    onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }} 
                                />
                            </div>
                        </div>
                    </div>
                    {currentEvent && (
                        <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                            <Button variant="outline" className="w-full md:w-auto bg-background border-primary/20 text-primary hover:bg-primary/5">
                                <Download className="h-4 w-4 mr-2" /> Export PDF/Excel
                            </Button>
                        </div>
                    )}
                </div>

                <Card className="border-primary/10 shadow-sm overflow-hidden">
                    <CardHeader className="border-b bg-card">
                        <CardTitle>{currentEvent?.nama || 'Memilih Event...'}</CardTitle>
                        <CardDescription>
                            {currentEvent ? `${currentEvent.semester?.nama} • ${total} Penugasan Terdaftar` : 'Silakan pilih event untuk melihat asisten.'}
                        </CardDescription>
                    </CardHeader>
                    
                    {loading ? (
                        <div className="p-20 text-center text-muted-foreground flex flex-col items-center gap-3">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <p>Memuat data asisten...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 border-b">
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
                                                <div className="font-bold text-foreground">
                                                    {amk.application.user.profile?.nama_lengkap || amk.application.user.name}
                                                </div>
                                                <div className="text-xs text-muted-foreground font-mono">
                                                    {amk.application.user.nim}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className="bg-background border-primary/20 text-primary text-[10px] px-2 py-0.5">
                                                    {amk.event_mata_kuliah.mata_kuliah.nama} ({amk.event_mata_kuliah.kelas.nama})
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:bg-green-50" asChild title="Hubungi via WhatsApp">
                                                        <a href={`https://wa.me/${amk.application.user.profile?.no_wa}`} target="_blank" rel="noreferrer">
                                                            <Users className="h-4 w-4" />
                                                        </a>
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50" asChild title="Kirim Email">
                                                        <a href={`mailto:${amk.application.user.email}`}>
                                                            <FileText className="h-4 w-4" />
                                                        </a>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {assistants.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-20 text-center text-muted-foreground">
                                                <div className="flex flex-col items-center gap-3">
                                                    <Users className="h-10 w-10 opacity-20" />
                                                    <p className="font-medium">Belum ada asisten yang terdaftar untuk periode atau kata kunci ini.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            
                            {/* Pagination */}
                            <div className="border-t p-4 flex items-center justify-between text-xs text-muted-foreground bg-muted/20">
                                <div>
                                    Menampilkan {assistants.length > 0 ? (page - 1) * 20 + 1 : 0} - 
                                    {Math.min(page * 20, total)} dari {total} asisten
                                </div>
                                <div className="flex gap-2">
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="h-8 shadow-sm" 
                                        disabled={page <= 1} 
                                        onClick={() => setPage(p => p - 1)}
                                    >
                                        Sebelumnya
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="h-8 shadow-sm" 
                                        disabled={assistants.length < 20} 
                                        onClick={() => setPage(p => p + 1)}
                                    >
                                        Selanjutnya
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </AppLayout>
    );
}
