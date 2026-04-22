import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Award,
    Eye,
    FileBadge2,
    Loader2,
    Move,
    Save,
    Upload,
    WandSparkles,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dosen', href: '#' },
    { title: 'Sertifikat', href: '/database/sertifikat' },
];

interface EventItem {
    id: number;
    nama: string;
    tipe: string;
    semester?: {
        nama: string;
    } | null;
}

interface TextLayer {
    id: 'nama' | 'nim';
    label: string;
    x: number;
    y: number;
    fontSize: number;
}

interface TemplateConfigResponse {
    config: {
        event_id: number;
        nama: {
            x: number;
            y: number;
            font_size: number;
        };
        nim: {
            x: number;
            y: number;
            font_size: number;
        };
        sample?: {
            nama?: string;
            nim?: string;
        };
    };
    has_template: boolean;
    has_saved_config: boolean;
}

interface StageProps {
    imageUrl: string;
    pageSize: { width: number; height: number };
    layers: TextLayer[];
    sample: { nama: string; nim: string };
    onChangeLayer?: (id: TextLayer['id'], patch: Partial<TextLayer>) => void;
}

const defaultLayers: TextLayer[] = [
    { id: 'nama', label: 'Nama', x: 50, y: 47, fontSize: 32 },
    { id: 'nim', label: 'NIM', x: 50, y: 56, fontSize: 18 },
];

const defaultSample = {
    nama: 'Contoh Nama Lengkap',
    nim: '2200012345',
};

function TemplateStage({ imageUrl, pageSize, layers, sample, onChangeLayer }: StageProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    const layerText = (layerId: TextLayer['id']) => {
        return layerId === 'nama' ? sample.nama : sample.nim;
    };

    return (
        <div
            ref={containerRef}
            className="relative overflow-hidden rounded-2xl border bg-white shadow-sm"
            style={{
                aspectRatio: pageSize.width && pageSize.height ? `${pageSize.width} / ${pageSize.height}` : '1 / 1.414',
            }}
        >
            <img src={imageUrl} alt="Preview template sertifikat" className="h-full w-full object-cover" />

            {layers.map((layer) => (
                <motion.div
                    key={layer.id}
                    drag={Boolean(onChangeLayer)}
                    dragMomentum={false}
                    onDragEnd={(event) => {
                        if (!onChangeLayer || !containerRef.current) {
                            return;
                        }

                        const element = event.target as HTMLElement;
                        const parentRect = containerRef.current.getBoundingClientRect();
                        const elementRect = element.getBoundingClientRect();
                        const centerX = elementRect.left + elementRect.width / 2 - parentRect.left;
                        const centerY = elementRect.top + elementRect.height / 2 - parentRect.top;

                        onChangeLayer(layer.id, {
                            x: Math.min(100, Math.max(0, (centerX / parentRect.width) * 100)),
                            y: Math.min(100, Math.max(0, (centerY / parentRect.height) * 100)),
                        });
                    }}
                    className={`absolute z-10 rounded-lg border border-dashed px-3 py-2 text-center ${
                        onChangeLayer ? 'cursor-move border-primary bg-primary/10' : 'border-emerald-500/60 bg-white/80 backdrop-blur'
                    }`}
                    style={{
                        left: `${layer.x}%`,
                        top: `${layer.y}%`,
                        transform: 'translate(-50%, -50%)',
                        fontSize: `${layer.fontSize}px`,
                        fontFamily: 'Georgia, Times New Roman, serif',
                        fontWeight: layer.id === 'nama' ? 700 : 500,
                        whiteSpace: 'nowrap',
                    }}
                >
                    <span>{layerText(layer.id)}</span>
                    <span className="absolute -left-1.5 -top-2 rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-white">
                        {layer.label}
                    </span>
                </motion.div>
            ))}
        </div>
    );
}

export default function SertifikatPage() {
    const [events, setEvents] = useState<EventItem[]>([]);
    const [eventId, setEventId] = useState('');
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [templateBlobUrl, setTemplateBlobUrl] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [pageSize, setPageSize] = useState({ width: 1240, height: 877 });
    const [layers, setLayers] = useState<TextLayer[]>(defaultLayers);
    const [sample, setSample] = useState(defaultSample);
    const [activeTab, setActiveTab] = useState<'upload' | 'coordinates'>('upload');
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [loadingSetup, setLoadingSetup] = useState(false);
    const [hasSavedConfig, setHasSavedConfig] = useState(false);

    const currentEvent = useMemo(
        () => events.find((event) => event.id.toString() === eventId) ?? null,
        [events, eventId]
    );

    useEffect(() => {
        api.get('/events', { params: { per_page: 200 } }).then((response) => {
            const items = response.data.data ?? [];
            setEvents(items);

            if (items.length > 0) {
                setEventId(items[0].id.toString());
            }
        });
    }, []);

    useEffect(() => {
        return () => {
            if (templateBlobUrl) {
                URL.revokeObjectURL(templateBlobUrl);
            }
        };
    }, [templateBlobUrl]);

    useEffect(() => {
        if (!eventId) {
            return;
        }

        const loadSetup = async () => {
            setLoadingSetup(true);
            setPdfFile(null);

            try {
                const configResponse = await api.get<TemplateConfigResponse>('/sertifikat/get-config', {
                    params: { event_id: eventId },
                });

                const config = configResponse.data.config;
                setLayers([
                    {
                        id: 'nama',
                        label: 'Nama',
                        x: config.nama?.x ?? defaultLayers[0].x,
                        y: config.nama?.y ?? defaultLayers[0].y,
                        fontSize: config.nama?.font_size ?? defaultLayers[0].fontSize,
                    },
                    {
                        id: 'nim',
                        label: 'NIM',
                        x: config.nim?.x ?? defaultLayers[1].x,
                        y: config.nim?.y ?? defaultLayers[1].y,
                        fontSize: config.nim?.font_size ?? defaultLayers[1].fontSize,
                    },
                ]);
                setSample({
                    nama: config.sample?.nama || defaultSample.nama,
                    nim: config.sample?.nim || defaultSample.nim,
                });
                setHasSavedConfig(Boolean(configResponse.data.has_saved_config));

                if (configResponse.data.has_template) {
                    const previewResponse = await api.get('/sertifikat/preview-template', {
                        params: { event_id: eventId },
                        responseType: 'blob',
                    });

                    const nextBlobUrl = URL.createObjectURL(previewResponse.data);
                    setTemplateBlobUrl((previous) => {
                        if (previous) {
                            URL.revokeObjectURL(previous);
                        }
                        return nextBlobUrl;
                    });
                } else {
                    setTemplateBlobUrl((previous) => {
                        if (previous) {
                            URL.revokeObjectURL(previous);
                        }
                        return null;
                    });
                    setPreviewImage(null);
                }
            } catch (error) {
                console.error(error);
                toast.error('Gagal memuat konfigurasi sertifikat event.');
            } finally {
                setLoadingSetup(false);
            }
        };

        loadSetup();
    }, [eventId]);

    useEffect(() => {
        if (!templateBlobUrl) {
            setPreviewImage(null);
            return;
        }

        const renderPdfPreview = async () => {
            try {
                const loadingTask = pdfjsLib.getDocument(templateBlobUrl);
                const pdf = await loadingTask.promise;
                const page = await pdf.getPage(1);
                const viewport = page.getViewport({ scale: 1.8 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');

                if (!context) {
                    throw new Error('Canvas context tidak tersedia.');
                }

                canvas.width = viewport.width;
                canvas.height = viewport.height;

                await page.render({ canvasContext: context, viewport }).promise;

                setPageSize({ width: viewport.width, height: viewport.height });
                setPreviewImage(canvas.toDataURL('image/png'));
            } catch (error) {
                console.error(error);
                toast.error('Preview template PDF gagal dirender.');
            }
        };

        renderPdfPreview();
    }, [templateBlobUrl]);

    const updateLayer = (id: TextLayer['id'], patch: Partial<TextLayer>) => {
        setLayers((current) => current.map((layer) => (layer.id === id ? { ...layer, ...patch } : layer)));
    };

    const handleUpload = async () => {
        if (!eventId) {
            toast.error('Pilih event terlebih dahulu.');
            return;
        }

        if (!pdfFile) {
            toast.error('Pilih file PDF template terlebih dahulu.');
            return;
        }

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('event_id', eventId);
            formData.append('template', pdfFile);

            await api.post('/sertifikat/upload-template', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const previewResponse = await api.get('/sertifikat/preview-template', {
                params: { event_id: eventId },
                responseType: 'blob',
            });

            const nextBlobUrl = URL.createObjectURL(previewResponse.data);
            setTemplateBlobUrl((previous) => {
                if (previous) {
                    URL.revokeObjectURL(previous);
                }
                return nextBlobUrl;
            });

            toast.success('Template sertifikat berhasil diupload.');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Upload template gagal.');
        } finally {
            setUploading(false);
        }
    };

    const handleSaveConfig = async () => {
        if (!eventId) {
            toast.error('Pilih event terlebih dahulu.');
            return;
        }

        if (!templateBlobUrl) {
            toast.error('Upload template sertifikat terlebih dahulu.');
            return;
        }

        const namaLayer = layers.find((layer) => layer.id === 'nama');
        const nimLayer = layers.find((layer) => layer.id === 'nim');

        if (!namaLayer || !nimLayer) {
            toast.error('Layer nama atau NIM belum tersedia.');
            return;
        }

        setSaving(true);

        try {
            await api.post('/sertifikat/save-config', {
                event_id: eventId,
                nama_x: namaLayer.x,
                nama_y: namaLayer.y,
                nama_font_size: namaLayer.fontSize,
                nim_x: nimLayer.x,
                nim_y: nimLayer.y,
                nim_font_size: nimLayer.fontSize,
                sample_nama: sample.nama,
                sample_nim: sample.nim,
            });

            setHasSavedConfig(true);
            toast.success('Konfigurasi sertifikat berhasil disimpan.');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Gagal menyimpan konfigurasi.');
        } finally {
            setSaving(false);
        }
    };

    const handleGenerate = async () => {
        if (!eventId) {
            toast.error('Pilih event terlebih dahulu.');
            return;
        }

        setGenerating(true);

        try {
            const response = await api.post('/sertifikat/generate', { event_id: eventId });
            toast.success(response.data.message || 'Sertifikat berhasil digenerate.');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Generate sertifikat gagal.');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sertifikat" />

            <div className="space-y-6 p-5">
                <section className="overflow-hidden rounded-3xl border bg-gradient-to-r from-primary/10 via-background to-emerald-500/10 p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                                <Award className="h-3.5 w-3.5" />
                                Sertifikat Otomatis
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">Penerbitan sertifikat per event</h1>
                                <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                                    Upload template PDF, atur koordinat nama dan NIM lewat tab editor, lalu generate
                                    sertifikat ke folder Google Drive `Asisten / Semester / Event / Sertifikat / Mata
                                    Kuliah / Kelas-NIM-Nama`.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-3 rounded-2xl border bg-background/85 p-4 text-sm shadow-sm sm:grid-cols-3">
                            <div>
                                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Event</div>
                                <div className="mt-1 font-semibold">{currentEvent?.nama || 'Belum dipilih'}</div>
                            </div>
                            <div>
                                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                    Semester
                                </div>
                                <div className="mt-1 font-semibold">{currentEvent?.semester?.nama || '-'}</div>
                            </div>
                            <div>
                                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Status</div>
                                <div className="mt-1 font-semibold">
                                    {hasSavedConfig ? 'Konfigurasi tersimpan' : 'Perlu konfigurasi'}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
                    <aside className="space-y-6">
                        <div className="rounded-3xl border bg-card p-5 shadow-sm">
                            <div className="mb-5 flex items-center gap-3">
                                <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                                    <FileBadge2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="font-semibold">Pengaturan Sertifikat</h2>
                                    <p className="text-sm text-muted-foreground">
                                        Pilih event dan siapkan template penerbitan.
                                    </p>
                                </div>
                            </div>

                            <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-muted/30 p-1">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('upload')}
                                    className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                                        activeTab === 'upload'
                                            ? 'bg-background text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Upload Template
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('coordinates')}
                                    className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                                        activeTab === 'coordinates'
                                            ? 'bg-background text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Atur Koordinat
                                </button>
                            </div>

                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <Label>Filter Event</Label>
                                    <Select value={eventId} onValueChange={setEventId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih event" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {events.map((event) => (
                                                <SelectItem key={event.id} value={event.id.toString()}>
                                                    {event.nama}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {activeTab === 'upload' ? (
                                    <>
                                        <div className="space-y-2">
                                            <Label>Template Sertifikat PDF</Label>
                                            <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-muted/20 px-4 text-center transition hover:border-primary/50 hover:bg-primary/5">
                                                <div className="rounded-full bg-primary/10 p-3 text-primary">
                                                    <Upload className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <div className="font-medium">
                                                        {pdfFile?.name || 'Pilih atau drop file PDF'}
                                                    </div>
                                                    <div className="mt-1 text-xs text-muted-foreground">
                                                        Gunakan template sertifikat halaman pertama dalam format PDF.
                                                    </div>
                                                </div>
                                                <input
                                                    type="file"
                                                    accept="application/pdf"
                                                    className="hidden"
                                                    onChange={(event) => setPdfFile(event.target.files?.[0] || null)}
                                                />
                                            </label>
                                        </div>

                                        <Button onClick={handleUpload} disabled={!pdfFile || !eventId || uploading}>
                                            {uploading ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <Upload className="mr-2 h-4 w-4" />
                                            )}
                                            Upload Template
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <div className="rounded-2xl border bg-muted/20 p-4">
                                            <h3 className="font-semibold">Contoh Data Preview</h3>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Ubah nama dan NIM contoh, lalu drag posisinya langsung di preview utama.
                                            </p>
                                            <div className="mt-4 space-y-3">
                                                <div className="space-y-2">
                                                    <Label htmlFor="sidebar-sample-nama">Nama</Label>
                                                    <Input
                                                        id="sidebar-sample-nama"
                                                        value={sample.nama}
                                                        onChange={(event) =>
                                                            setSample((current) => ({
                                                                ...current,
                                                                nama: event.target.value,
                                                            }))
                                                        }
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="sidebar-sample-nim">NIM</Label>
                                                    <Input
                                                        id="sidebar-sample-nim"
                                                        value={sample.nim}
                                                        onChange={(event) =>
                                                            setSample((current) => ({
                                                                ...current,
                                                                nim: event.target.value,
                                                            }))
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {layers.map((layer) => (
                                            <div key={layer.id} className="rounded-2xl border p-4">
                                                <div className="mb-4 flex items-center justify-between">
                                                    <div>
                                                        <h3 className="font-semibold">Layer {layer.label}</h3>
                                                        <p className="text-xs text-muted-foreground">
                                                            Atur posisi dan ukuran font langsung dari sini.
                                                        </p>
                                                    </div>
                                                    <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                                        {layer.x.toFixed(1)}%, {layer.y.toFixed(1)}%
                                                    </div>
                                                </div>

                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <div className="space-y-2">
                                                        <Label>X (%)</Label>
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            max={100}
                                                            step={0.1}
                                                            value={layer.x}
                                                            onChange={(event) =>
                                                                updateLayer(layer.id, {
                                                                    x: Number(event.target.value),
                                                                })
                                                            }
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Y (%)</Label>
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            max={100}
                                                            step={0.1}
                                                            value={layer.y}
                                                            onChange={(event) =>
                                                                updateLayer(layer.id, {
                                                                    y: Number(event.target.value),
                                                                })
                                                            }
                                                        />
                                                    </div>
                                                    <div className="space-y-2 sm:col-span-2">
                                                        <Label>Font Size</Label>
                                                        <Input
                                                            type="number"
                                                            min={8}
                                                            max={72}
                                                            step={1}
                                                            value={layer.fontSize}
                                                            onChange={(event) =>
                                                                updateLayer(layer.id, {
                                                                    fontSize: Number(event.target.value),
                                                                })
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        <Button onClick={handleSaveConfig} disabled={saving || !previewImage} variant="outline">
                                            {saving ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <Save className="mr-2 h-4 w-4" />
                                            )}
                                            Simpan Konfigurasi
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="rounded-3xl border bg-card p-5 shadow-sm">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="rounded-2xl bg-emerald-500/10 p-2 text-emerald-600">
                                    <WandSparkles className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="font-semibold">Aksi Penerbitan</h2>
                                    <p className="text-sm text-muted-foreground">
                                        Simpan konfigurasi lalu terbitkan seluruh sertifikat event.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3 rounded-2xl border bg-muted/20 p-4 text-sm">
                                <div className="flex items-start gap-3">
                                    <Eye className="mt-0.5 h-4 w-4 text-primary" />
                                    <span>Preview utama menampilkan hasil penempatan nama dan NIM secara langsung.</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Move className="mt-0.5 h-4 w-4 text-primary" />
                                    <span>
                                        Di tab koordinat, posisi nama dan NIM bisa digeser lalu fine-tune dengan angka
                                        koordinat sambil melihat preview yang sama.
                                    </span>
                                </div>
                            </div>

                            <div className="mt-5 grid gap-3">
                                <Button
                                    onClick={handleGenerate}
                                    disabled={generating || !previewImage}
                                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                                >
                                    {generating ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <FileBadge2 className="mr-2 h-4 w-4" />
                                    )}
                                    Generate Sertifikat
                                </Button>
                            </div>
                        </div>
                    </aside>

                    <section className="rounded-3xl border bg-card p-5 shadow-sm">
                        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                                <h2 className="text-xl font-semibold">Preview Template Sertifikat</h2>
                                <p className="text-sm text-muted-foreground">
                                    Nama dan NIM di bawah ini menjadi acuan live preview sebelum sertifikat digenerate
                                    massal.
                                </p>
                            </div>
                            {loadingSetup && (
                                <div className="inline-flex items-center gap-2 rounded-full border bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Memuat template event
                                </div>
                            )}
                        </div>

                        <div className="mb-5 grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="sample-nama">Preview Nama</Label>
                                <Input
                                    id="sample-nama"
                                    value={sample.nama}
                                    onChange={(event) =>
                                        setSample((current) => ({ ...current, nama: event.target.value }))
                                    }
                                    placeholder="Masukkan contoh nama"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sample-nim">Preview NIM</Label>
                                <Input
                                    id="sample-nim"
                                    value={sample.nim}
                                    onChange={(event) =>
                                        setSample((current) => ({ ...current, nim: event.target.value }))
                                    }
                                    placeholder="Masukkan contoh NIM"
                                />
                            </div>
                        </div>

                        {!previewImage ? (
                            <div className="flex min-h-[520px] flex-col items-center justify-center rounded-3xl border border-dashed bg-muted/10 p-10 text-center">
                                <div className="rounded-full bg-primary/10 p-4 text-primary">
                                    <FileBadge2 className="h-10 w-10" />
                                </div>
                                <h3 className="mt-4 text-lg font-semibold">Belum ada template untuk event ini</h3>
                                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                                    Pilih event lalu upload PDF template sertifikat. Setelah itu Anda bisa membuka
                                    tab pengaturan koordinat dan generate sertifikat otomatis.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <TemplateStage
                                    imageUrl={previewImage}
                                    pageSize={pageSize}
                                    layers={layers}
                                    sample={sample}
                                    onChangeLayer={activeTab === 'coordinates' ? updateLayer : undefined}
                                />
                                <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                                    <span>
                                        Posisi nama: {layers.find((layer) => layer.id === 'nama')?.x.toFixed(1)}%,{' '}
                                        {layers.find((layer) => layer.id === 'nama')?.y.toFixed(1)}%
                                    </span>
                                    <span>
                                        Posisi NIM: {layers.find((layer) => layer.id === 'nim')?.x.toFixed(1)}%,{' '}
                                        {layers.find((layer) => layer.id === 'nim')?.y.toFixed(1)}%
                                    </span>
                                    <span>
                                        {hasSavedConfig
                                            ? 'Konfigurasi event ini sudah tersimpan.'
                                            : 'Konfigurasi event ini belum disimpan.'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}
