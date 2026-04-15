import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { cn, getCourseColor } from '@/lib/utils';
import { BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Plus, Calendar, Filter } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ScheduleGrid } from '@/components/schedule-grid';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Jadwal', href: '/jadwal' }];

interface Laboratorium { id: number; name: string; }
interface MataKuliah { id: number; nama: string; kode: string; color: string; }
interface Kelas { 
    id: number; 
    nama: string; 
    mata_kuliah_id: number;
    mata_kuliah: MataKuliah;
}
interface Semester { id: number; nama: string; }
interface ScheduleEntry {
    id: number;
    hari: string;
    jam_mulai: string;
    jam_selesai: string;
    mata_kuliah: MataKuliah;
    kelas: Kelas;
    keterangan?: string;
}

const DEFAULT_FORM = {
    laboratorium_id: '',
    semester_id: '',
    kelas_id: '',
    hari: 'Senin',
    jam_mulai: '07:30',
    jam_selesai: '09:30',
    keterangan: ''
};

function ScheduleModal({ open, onClose, onSaved, initial, labs, semesters, classes, allSchedules }: {
    open: boolean; onClose: () => void; onSaved: () => void; initial?: any;
    labs: Laboratorium[]; semesters: Semester[]; classes: Kelas[];
    allSchedules: ScheduleEntry[];
}) {
    const [form, setForm] = useState(DEFAULT_FORM);
    const [conflict, setConflict] = useState<ScheduleEntry | null>(null);

    useEffect(() => {
        if (open) {
            if (initial) {
                setForm({
                    laboratorium_id: String(initial.laboratorium_id || ''),
                    semester_id: String(initial.semester_id || ''),
                    kelas_id: String(initial.kelas_id || ''),
                    hari: initial.hari,
                    jam_mulai: initial.jam_mulai.slice(0, 5),
                    jam_selesai: initial.jam_selesai.slice(0, 5),
                    keterangan: initial.keterangan || ''
                });
            } else {
                setForm(DEFAULT_FORM);
            }
        }
    }, [initial, open]);

    useEffect(() => {
        if (!open) return;
        
        const currentMulai = form.jam_mulai;
        const currentSelesai = form.jam_selesai;
        const currentDay = form.hari;
        const currentLab = form.laboratorium_id;

        if (currentMulai && currentSelesai && currentDay && currentLab) {
            const found = allSchedules.find(s => {
                if (initial && s.id === initial.id) return false;
                
                if (String(s.laboratorium_id || '') !== currentLab) {
                    return false;
                }
                
                if (s.hari !== currentDay) return false;

                const sMulai = s.jam_mulai.slice(0, 5);
                const sSelesai = s.jam_selesai.slice(0, 5);

                return (currentMulai < sSelesai) && (currentSelesai > sMulai);
            });
            setConflict(found || null);
        } else {
            setConflict(null);
        }
    }, [form.jam_mulai, form.jam_selesai, form.hari, form.laboratorium_id, allSchedules, initial, open]);

    const submit = async () => {
        try {
            if (initial) await api.put(`/jadwal-praktikum/${initial.id}`, form);
            else await api.post('/jadwal-praktikum', form);
            toast.success('Jadwal berhasil disimpan');
            onSaved(); 
            handleClose();
        } catch (e: any) {
            toast.error(e.response?.data?.message ?? 'Gagal menyimpan');
        }
    };

    const handleClose = () => {
        setForm(DEFAULT_FORM);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>{initial ? 'Edit Jadwal' : 'Tambah Jadwal'}</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-2">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1">
                            <Label>Laboratorium</Label>
                            <Select value={form.laboratorium_id} onValueChange={v => setForm(f => ({ ...f, laboratorium_id: v }))}>
                                <SelectTrigger><SelectValue placeholder="Pilih Lab" /></SelectTrigger>
                                <SelectContent>{labs.map(l => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-1">
                            <Label>Semester</Label>
                            <Select value={form.semester_id} onValueChange={v => setForm(f => ({ ...f, semester_id: v }))}>
                                <SelectTrigger><SelectValue placeholder="Pilih Semester" /></SelectTrigger>
                                <SelectContent>{semesters.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.nama}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid gap-1">
                        <Label>Praktikum (Mata Kuliah - Kelas)</Label>
                        <Select value={form.kelas_id} onValueChange={v => setForm(f => ({ ...f, kelas_id: v }))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih Praktikum" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                {classes.map(c => {
                                    const color = getCourseColor(c.mata_kuliah?.color, c.mata_kuliah?.id);
                                    const isScheduled = allSchedules.some(s => s.kelas.id === c.id && (!initial || s.id !== initial.id));
                                    
                                    return (
                                        <SelectItem key={c.id} value={String(c.id)} disabled={isScheduled}>
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 rounded shadow-sm border border-black/10 shrink-0" style={{ backgroundColor: color }} />
                                                <div className="flex flex-col gap-0.5 leading-none">
                                                    <span className={cn("font-medium", isScheduled && "text-muted-foreground")}>
                                                        {c.mata_kuliah?.nama || 'Unknown'} {isScheduled && '(Terjadwal)'}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground uppercase">{c.mata_kuliah?.kode} - {c.nama}</span>
                                                </div>
                                            </div>
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="grid gap-1">
                            <Label>Hari</Label>
                            <Select value={form.hari} onValueChange={v => setForm(f => ({ ...f, hari: v }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-1">
                            <Label>Jam Mulai</Label>
                            <Input type="time" value={form.jam_mulai} onChange={e => setForm(f => ({ ...f, jam_mulai: e.target.value }))} />
                        </div>
                        <div className="grid gap-1">
                            <Label>Jam Selesai</Label>
                            <Input type="time" value={form.jam_selesai} onChange={e => setForm(f => ({ ...f, jam_selesai: e.target.value }))} />
                        </div>
                    </div>
                    {conflict && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex flex-col gap-1">
                            <span className="text-xs font-bold text-destructive flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                                JADWAL BENTROK
                            </span>
                            <p className="text-[11px] text-destructive-foreground leading-tight">
                                Waktu ini sudah ditempati oleh <strong>{conflict.mata_kuliah?.nama} ({conflict.kelas?.nama})</strong>. 
                                Silakan pilih waktu atau hari lain.
                            </p>
                        </div>
                    )}
                    <div className="grid gap-1">
                        <Label>Keterangan (Opsional)</Label>
                        <Input value={form.keterangan} onChange={e => setForm(f => ({ ...f, keterangan: e.target.value }))} placeholder="Contoh: Modul 1-5" />
                    </div>
                </div>
                <DialogFooter className="gap-2">
                    {initial && (
                        <Button variant="destructive" className="mr-auto" onClick={async () => {
                            if (confirm('Hapus jadwal ini?')) {
                                await api.delete(`/jadwal-praktikum/${initial.id}`);
                                toast.success('Jadwal dihapus'); 
                                onSaved(); 
                                handleClose();
                            }
                        }}>Hapus</Button>
                    )}
                    <Button variant="ghost" onClick={handleClose}>Batal</Button>
                    <Button onClick={submit} disabled={!!conflict}>
                        {conflict ? 'Jadwal Bentrok' : 'Simpan Jadwal'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function JadwalPage() {
    const { auth, active_semester } = usePage<{ auth: any, active_semester: any }>().props;
    const [labs, setLabs] = useState<Laboratorium[]>([]);
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [classes, setClasses] = useState<Kelas[]>([]);
    const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
    
    const [selectedLab, setSelectedLab] = useState<string>('');
    const [selectedSemester, setSelectedSemester] = useState<string>('');
    const [loading, setLoading] = useState(false);
    
    const [modalOpen, setModalOpen] = useState(false);
    const [editData, setEditData] = useState<any>(null);

    // Initial data fetch
    useEffect(() => {
        Promise.all([
            api.get('/laboratorium/all'),
            api.get('/semesters', { params: { per_page: 100 } }),
            api.get('/kelas/all')
        ]).then(([l, s, c]) => {
            setLabs(l.data);
            setSemesters(s.data.data);
            setClasses(c.data);
            
            if (l.data.length > 0) setSelectedLab(String(l.data[0].id));
            if (active_semester) setSelectedSemester(String(active_semester.id));
            else if (s.data.data.length > 0) setSelectedSemester(String(s.data.data[0].id));
        });
    }, [active_semester]);

    const fetchSchedules = () => {
        if (!selectedLab || !selectedSemester) return;
        setLoading(true);
        api.get('/jadwal-praktikum', { params: { laboratorium_id: selectedLab, semester_id: selectedSemester } })
            .then(r => setSchedules(r.data))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchSchedules();
    }, [selectedLab, selectedSemester]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Jadwal Praktikum" />
            <ScheduleModal 
                open={modalOpen} 
                onClose={() => setModalOpen(false)} 
                onSaved={fetchSchedules} 
                initial={editData}
                labs={labs}
                semesters={semesters}
                classes={classes}
                allSchedules={schedules}
            />
            
            <div className="p-6 flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Jadwal Praktikum</h1>
                            <p className="text-sm text-muted-foreground">Kelola waktu penggunaan laboratorium</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-muted/40 p-1.5 rounded-xl border border-border/50">
                        <div className="flex items-center gap-2 px-2 text-muted-foreground">
                            <Filter className="w-4 h-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">Filter</span>
                        </div>
                        <Select value={selectedLab} onValueChange={setSelectedLab}>
                            <SelectTrigger className="w-[180px] h-9 bg-background border-none shadow-none ring-0">
                                <SelectValue placeholder="Pilih Lab" />
                            </SelectTrigger>
                            <SelectContent>
                                {labs.map(l => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                            <SelectTrigger className="w-[180px] h-9 bg-background border-none shadow-none ring-0">
                                <SelectValue placeholder="Pilih Semester" />
                            </SelectTrigger>
                            <SelectContent>
                                {semesters.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.nama}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <div className="w-px h-6 bg-border mx-1" />
                        {(auth.user.role === 'admin' || auth.user.role === 'dosen') && (
                            <Button size="sm" onClick={() => { setEditData(null); setModalOpen(true); }} className="h-8 rounded-lg shadow-sm">
                                <Plus className="w-4 h-4 mr-1.5" /> Tambah
                            </Button>
                        )}
                    </div>
                </div>

                <div className="relative">
                    {loading && (
                        <div className="absolute inset-0 z-50 bg-background/50 backdrop-blur-[1px] flex items-center justify-center rounded-lg">
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs font-medium">Memperbarui Jadwal...</span>
                            </div>
                        </div>
                    )}
                    <ScheduleGrid 
                        schedules={schedules} 
                        onEntryClick={(entry) => {
                            if (auth.user.role === 'admin' || auth.user.role === 'dosen') {
                                setEditData(entry); setModalOpen(true);
                            }
                        }} 
                    />
                </div>
                
                <div className="flex items-center gap-6 text-[11px] text-muted-foreground bg-muted/20 p-4 rounded-lg border border-dashed">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-muted/40 border border-muted-foreground/30" />
                        <span>Kosong (Tersedia)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-primary/20 border border-primary/40" />
                        <span>Terisi (Praktikum)</span>
                    </div>
                    {(auth.user.role === 'admin' || auth.user.role === 'dosen') && (
                        <div className="ml-auto italic">
                            * Klik pada kotak jadwal untuk mengubah atau menghapus data.
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
