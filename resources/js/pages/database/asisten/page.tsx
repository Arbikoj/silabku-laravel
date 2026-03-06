import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Database, Search, User, Filter, Mail, Phone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Database Asisten', href: '/database-asisten' }];

export default function AssistantDatabasePage() {
    const [data, setData] = useState<any[]>([]);
    const [meta, setMeta] = useState<any>({ total: 0, current_page: 1, last_page: 1 });
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ search: '', tipe: '', semester_id: '', event_id: '' });
    const [page, setPage] = useState(1);
    const [semesters, setSemesters] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);

    const fetch = () => {
        setLoading(true);
        api.get('/database/asisten', { params: { ...filters, page, per_page: 20 } })
            .then(r => {
                setData(r.data.data);
                setMeta(r.data.meta);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetch(); }, [filters, page]);

    useEffect(() => {
        api.get('/semesters').then(r => setSemesters(r.data.data));
        api.get('/events').then(r => setEvents(r.data.data));
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Database Asisten" />
            <div className="p-5 max-w-7xl mx-auto">
                <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2"><Database className="h-6 w-6" /> Database Asisten Luar</h1>
                        <p className="text-muted-foreground text-sm">Arsip asisten yang sudah tervalidasi dan pernah bertugas di Silabku.</p>
                    </div>
                </header>

                <Card className="mb-8 border-primary/10 shadow-sm">
                    <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="grid gap-1">
                            <label className="text-xs font-bold text-muted-foreground flex items-center gap-1"><Search className="h-3 w-3" /> CARI ASISTEN</label>
                            <Input placeholder="Nama / NIM..." value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} className="h-9" />
                        </div>
                        <div className="grid gap-1">
                            <label className="text-xs font-bold text-muted-foreground flex items-center gap-1"><Filter className="h-3 w-3" /> TIPE</label>
                            <Select value={filters.tipe} onValueChange={v => setFilters(f => ({ ...f, tipe: v }))}>
                                <SelectTrigger className="h-9"><SelectValue placeholder="Semua Tipe" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">Semua Tipe</SelectItem>
                                    <SelectItem value="praktikum">Praktikum</SelectItem>
                                    <SelectItem value="tutorial">Tutorial</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-1">
                            <label className="text-xs font-bold text-muted-foreground flex items-center gap-1"><Filter className="h-3 w-3" /> EVENT</label>
                            <Select value={filters.event_id} onValueChange={v => setFilters(f => ({ ...f, event_id: v }))}>
                                <SelectTrigger className="h-9"><SelectValue placeholder="Semua Event" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">Semua Event</SelectItem>
                                    {events.map(e => <SelectItem key={e.id} value={e.id.toString()}>{e.nama}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button variant="outline" className="h-9" onClick={() => setFilters({ search: '', tipe: '', semester_id: '', event_id: '' })}>Reset Filter</Button>
                    </CardContent>
                </Card>

                <div className="border rounded-2xl overflow-hidden bg-card shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-muted">
                            <tr>
                                <th className="px-5 py-4 text-left font-semibold">Asisten</th>
                                <th className="px-5 py-4 text-left font-semibold">Mata Kuliah / Kelas</th>
                                <th className="px-5 py-4 text-left font-semibold">Periode (Event)</th>
                                <th className="px-5 py-4 text-center font-semibold">IPK</th>
                                <th className="px-5 py-4 text-right font-semibold">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-5 py-6 bg-muted/20" />
                                    </tr>
                                ))
                            ) : data.map((amk, i) => (
                                <tr key={amk.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border text-primary overflow-hidden shrink-0">
                                                {amk.application.user.profile?.foto ? (
                                                    <img src={amk.application.user.profile.foto} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    <User className="h-5 w-5 opacity-40" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold">{amk.application.user.profile?.nama_lengkap || amk.application.user.name}</div>
                                                <div className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">{amk.application.user.nim}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="font-semibold">{amk.event_mata_kuliah.mata_kuliah.nama}</div>
                                        <div className="text-xs text-muted-foreground">Kelas {amk.event_mata_kuliah.kelas.nama}</div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="text-xs">{amk.application.event.nama}</div>
                                        <div className="text-[10px] text-muted-foreground">{amk.application.event.semester.nama}</div>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <Badge variant="secondary" className="font-bold">{amk.application.user.profile?.nilai_ipk || '-'}</Badge>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" asChild>
                                                <a href={`https://wa.me/${amk.application.user.profile?.no_wa}`} target="_blank"><Phone className="h-4 w-4" /></a>
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600" asChild>
                                                <a href={`mailto:${amk.application.user.email}`}><Mail className="h-4 w-4" /></a>
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!loading && data.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center text-muted-foreground flex flex-col items-center gap-2">
                                        <Database className="h-10 w-10 opacity-10" />
                                        Belum ada data asisten yang ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                    <div>
                        Menampilkan <span className="font-bold text-foreground">{meta.from || 0}</span> - <span className="font-bold text-foreground">{meta.to || 0}</span> dari <span className="font-bold text-foreground">{meta.total}</span> asisten
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-8" disabled={page === 1} onClick={() => setPage(1)}>Awal</Button>
                        <Button variant="outline" size="sm" className="h-8" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Kembali</Button>
                        <div className="px-3 py-1 bg-muted rounded-md font-bold text-foreground">Halaman {page} / {meta.last_page}</div>
                        <Button variant="outline" size="sm" className="h-8" disabled={page === meta.last_page} onClick={() => setPage(p => p + 1)}>Lanjut</Button>
                        <Button variant="outline" size="sm" className="h-8" disabled={page === meta.last_page} onClick={() => setPage(meta.last_page)}>Akhir</Button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

