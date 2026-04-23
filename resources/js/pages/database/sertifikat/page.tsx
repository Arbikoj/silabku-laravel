import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Award, Bold, Download, Eye, FileBadge2, Italic, Loader2, Move, Save, Underline, Upload, WandSparkles } from 'lucide-react';
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
    id: 'nama' | 'nomor' | 'mata_kuliah' | 'custom';
    label: string;
    x: number;
    y: number;
    fontSize: number;
    fontFamily: 'helvetica' | 'roboto' | 'opensans' | 'montserrat';
    isBold: boolean;
    isItalic: boolean;
    isUnderline: boolean;
}

interface TemplateConfigResponse {
    config: {
        event_id: number;
        nama: {
            x: number;
            y: number;
            font_size: number;
            font_family: 'helvetica' | 'roboto' | 'opensans' | 'montserrat';
            is_bold: boolean;
            is_italic: boolean;
            is_underline: boolean;
        };
        nomor: {
            x: number;
            y: number;
            font_size: number;
            font_family: 'helvetica' | 'roboto' | 'opensans' | 'montserrat';
            is_bold: boolean;
            is_italic: boolean;
            is_underline: boolean;
        };
        mata_kuliah: {
            x: number;
            y: number;
            font_size: number;
            font_family: 'helvetica' | 'roboto' | 'opensans' | 'montserrat';
            is_bold: boolean;
            is_italic: boolean;
            is_underline: boolean;
        };
        custom: {
            x: number;
            y: number;
            font_size: number;
            font_family: 'helvetica' | 'roboto' | 'opensans' | 'montserrat';
            is_bold: boolean;
            is_italic: boolean;
            is_underline: boolean;
        };
        sample?: {
            nama?: string;
            nomor?: string;
            mata_kuliah?: string;
            custom?: string;
        };
    };
    has_template: boolean;
    has_saved_config: boolean;
}

interface CertificateRecipient {
    user_id: number;
    mata_kuliah_id: number;
    nama: string;
    nim: string;
    nomor_urut: number;
    nomor_sertifikat: string;
    mata_kuliah: string;
    kelas: string[];
}

interface CertificateDataResponse {
    items: CertificateRecipient[];
    total: number;
}

interface StageProps {
    imageUrl: string;
    pageSize: { width: number; height: number };
    layers: TextLayer[];
    onChangeLayer?: (id: TextLayer['id'], patch: Partial<TextLayer>) => void;
}

const defaultLayers: TextLayer[] = [
    { id: 'nama', label: 'Nama', x: 55.7, y: 45, fontSize: 32, fontFamily: 'helvetica', isBold: true, isItalic: false, isUnderline: false },
    { id: 'nomor', label: 'No', x: 25, y: 23.4, fontSize: 16, fontFamily: 'helvetica', isBold: false, isItalic: false, isUnderline: false },
    {
        id: 'mata_kuliah',
        label: 'Mata Kuliah',
        x: 55.7,
        y: 60,
        fontSize: 32,
        fontFamily: 'helvetica',
        isBold: false,
        isItalic: false,
        isUnderline: false,
    },
    { id: 'custom', label: 'Custom', x: 18, y: 72, fontSize: 16, fontFamily: 'helvetica', isBold: false, isItalic: false, isUnderline: false },
];

const fontOptions = [
    { value: 'helvetica', label: 'Helvetica' },
    { value: 'roboto', label: 'Roboto' },
    { value: 'opensans', label: 'Open Sans' },
    { value: 'montserrat', label: 'Montserrat' },
] as const;

const defaultSample = {
    nama: 'Contoh Nama Lengkap',
    nomor: '141/DST/IT9.3.1/HM.02.06/2026',
    mata_kuliah: 'Algoritma dan Pemrograman',
    custom: '',
};

const getApiErrorMessage = (error: unknown, fallback: string) => {
    if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof error.response === 'object' &&
        error.response !== null &&
        'data' in error.response &&
        typeof error.response.data === 'object' &&
        error.response.data !== null &&
        'message' in error.response.data &&
        typeof error.response.data.message === 'string'
    ) {
        return error.response.data.message;
    }

    return fallback;
};

const buildSamplePayload = (eventId: string, layers: TextLayer[], sample: { nama: string; nomor: string; mata_kuliah: string; custom: string }) => {
    const namaLayer = layers.find((layer) => layer.id === 'nama');
    const nomorLayer = layers.find((layer) => layer.id === 'nomor');
    const mataKuliahLayer = layers.find((layer) => layer.id === 'mata_kuliah');
    const customLayer = layers.find((layer) => layer.id === 'custom');

    if (!eventId || !namaLayer || !nomorLayer || !mataKuliahLayer || !customLayer) {
        return null;
    }

    return {
        event_id: eventId,
        nama_x: namaLayer.x,
        nama_y: namaLayer.y,
        nama_font_size: namaLayer.fontSize,
        nama_font_family: namaLayer.fontFamily,
        nama_is_bold: namaLayer.isBold,
        nama_is_italic: namaLayer.isItalic,
        nama_is_underline: namaLayer.isUnderline,
        nomor_x: nomorLayer.x,
        nomor_y: nomorLayer.y,
        nomor_font_size: nomorLayer.fontSize,
        nomor_font_family: nomorLayer.fontFamily,
        nomor_is_bold: nomorLayer.isBold,
        nomor_is_italic: nomorLayer.isItalic,
        nomor_is_underline: nomorLayer.isUnderline,
        mata_kuliah_x: mataKuliahLayer.x,
        mata_kuliah_y: mataKuliahLayer.y,
        mata_kuliah_font_size: mataKuliahLayer.fontSize,
        mata_kuliah_font_family: mataKuliahLayer.fontFamily,
        mata_kuliah_is_bold: mataKuliahLayer.isBold,
        mata_kuliah_is_italic: mataKuliahLayer.isItalic,
        mata_kuliah_is_underline: mataKuliahLayer.isUnderline,
        custom_x: customLayer.x,
        custom_y: customLayer.y,
        custom_font_size: customLayer.fontSize,
        custom_font_family: customLayer.fontFamily,
        custom_is_bold: customLayer.isBold,
        custom_is_italic: customLayer.isItalic,
        custom_is_underline: customLayer.isUnderline,
        sample_nama: sample.nama,
        sample_nomor: sample.nomor,
        sample_mata_kuliah: sample.mata_kuliah,
        sample_custom: sample.custom,
    };
};

function TemplateStage({ imageUrl, pageSize, layers, onChangeLayer }: StageProps) {
    const containerRef = useRef<HTMLDivElement>(null);

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
                    key={`${layer.id}-${layer.x}-${layer.y}-${layer.fontSize}`}
                    drag={Boolean(onChangeLayer)}
                    dragMomentum={false}
                    dragElastic={0}
                    dragConstraints={containerRef}
                    onDragEnd={(_, info) => {
                        if (!onChangeLayer || !containerRef.current) {
                            return;
                        }

                        const parentRect = containerRef.current.getBoundingClientRect();
                        const offsetX = layer.x + (info.offset.x / parentRect.width) * 100;
                        const offsetY = layer.y + (info.offset.y / parentRect.height) * 100;

                        onChangeLayer(layer.id, {
                            x: Math.min(100, Math.max(0, offsetX)),
                            y: Math.min(100, Math.max(0, offsetY)),
                        });
                    }}
                    className={`absolute z-10 rounded-sm border border-dashed text-center ${
                        onChangeLayer ? 'border-primary bg-primary/10 cursor-move' : 'bg-white/80/90 border-emerald-500/60 backdrop-blur'
                    }`}
                    style={{
                        left: `${layer.x}%`,
                        top: `${layer.y}%`,
                        width: '14px',
                        height: '14px',
                    }}
                >
                    <span className="absolute inset-0 rounded-full border-2 border-current bg-white/90" />
                    <span className="pointer-events-none absolute top-1/2 left-1/2 h-px w-5 -translate-x-1/2 -translate-y-1/2 bg-current" />
                    <span className="pointer-events-none absolute top-1/2 left-1/2 h-5 w-px -translate-x-1/2 -translate-y-1/2 bg-current" />
                    <span className="bg-primary absolute top-[-8px] left-4 rounded px-1.5 py-0.5 text-[9px] font-bold tracking-[0.18em] text-white uppercase">
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
    const [downloadingSample, setDownloadingSample] = useState(false);
    const [loadingSetup, setLoadingSetup] = useState(false);
    const [hasSavedConfig, setHasSavedConfig] = useState(false);
    const [nomorAwal, setNomorAwal] = useState('141');
    const [nomorAkhir, setNomorAkhir] = useState(`DST/IT9.3.1/HM.02.06/${new Date().getFullYear()}`);
    const [certificateItems, setCertificateItems] = useState<CertificateRecipient[]>([]);
    const [loadingCertificateItems, setLoadingCertificateItems] = useState(false);
    const [renderingPreview, setRenderingPreview] = useState(false);
    const [activeLayerId, setActiveLayerId] = useState<TextLayer['id']>('nama');
    const previewRequestRef = useRef(0);

    const currentEvent = useMemo(() => events.find((event) => event.id.toString() === eventId) ?? null, [events, eventId]);

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
                        fontFamily: config.nama?.font_family ?? defaultLayers[0].fontFamily,
                        isBold: config.nama?.is_bold ?? defaultLayers[0].isBold,
                        isItalic: config.nama?.is_italic ?? defaultLayers[0].isItalic,
                        isUnderline: config.nama?.is_underline ?? defaultLayers[0].isUnderline,
                    },
                    {
                        id: 'nomor',
                        label: 'No',
                        x: config.nomor?.x ?? defaultLayers[1].x,
                        y: config.nomor?.y ?? defaultLayers[1].y,
                        fontSize: config.nomor?.font_size ?? defaultLayers[1].fontSize,
                        fontFamily: config.nomor?.font_family ?? defaultLayers[1].fontFamily,
                        isBold: config.nomor?.is_bold ?? defaultLayers[1].isBold,
                        isItalic: config.nomor?.is_italic ?? defaultLayers[1].isItalic,
                        isUnderline: config.nomor?.is_underline ?? defaultLayers[1].isUnderline,
                    },
                    {
                        id: 'mata_kuliah',
                        label: 'Mata Kuliah',
                        x: config.mata_kuliah?.x ?? defaultLayers[2].x,
                        y: config.mata_kuliah?.y ?? defaultLayers[2].y,
                        fontSize: config.mata_kuliah?.font_size ?? defaultLayers[2].fontSize,
                        fontFamily: config.mata_kuliah?.font_family ?? defaultLayers[2].fontFamily,
                        isBold: config.mata_kuliah?.is_bold ?? defaultLayers[2].isBold,
                        isItalic: config.mata_kuliah?.is_italic ?? defaultLayers[2].isItalic,
                        isUnderline: config.mata_kuliah?.is_underline ?? defaultLayers[2].isUnderline,
                    },
                    {
                        id: 'custom',
                        label: 'Custom',
                        x: config.custom?.x ?? defaultLayers[3].x,
                        y: config.custom?.y ?? defaultLayers[3].y,
                        fontSize: config.custom?.font_size ?? defaultLayers[3].fontSize,
                        fontFamily: config.custom?.font_family ?? defaultLayers[3].fontFamily,
                        isBold: config.custom?.is_bold ?? defaultLayers[3].isBold,
                        isItalic: config.custom?.is_italic ?? defaultLayers[3].isItalic,
                        isUnderline: config.custom?.is_underline ?? defaultLayers[3].isUnderline,
                    },
                ]);
                setSample({
                    nama: config.sample?.nama || defaultSample.nama,
                    nomor: config.sample?.nomor || defaultSample.nomor,
                    mata_kuliah: config.sample?.mata_kuliah || defaultSample.mata_kuliah,
                    custom: config.sample?.custom || defaultSample.custom,
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
        if (!eventId || !nomorAwal.trim() || !nomorAkhir.trim()) {
            setCertificateItems([]);
            return;
        }

        const loadCertificateItems = async () => {
            setLoadingCertificateItems(true);

            try {
                const response = await api.get<CertificateDataResponse>('/sertifikat/prepare-data', {
                    params: {
                        event_id: eventId,
                        nomor_awal: nomorAwal,
                        nomor_akhir: nomorAkhir,
                    },
                });

                const items = response.data.items ?? [];
                setCertificateItems(items);

                if (items.length > 0) {
                    setSample((current) => ({
                        ...current,
                        nama: items[0].nama || current.nama,
                        nomor: items[0].nomor_sertifikat || current.nomor,
                        mata_kuliah: items[0].mata_kuliah || current.mata_kuliah,
                    }));
                }
            } catch (error: unknown) {
                console.error(error);
                setCertificateItems([]);
                toast.error(getApiErrorMessage(error, 'Gagal menyiapkan data sertifikat.'));
            } finally {
                setLoadingCertificateItems(false);
            }
        };

        loadCertificateItems();
    }, [eventId, nomorAwal, nomorAkhir]);

    const renderPdfBlobToImage = async (pdfBlob: Blob) => {
        const objectUrl = URL.createObjectURL(pdfBlob);

        try {
            const loadingTask = pdfjsLib.getDocument(objectUrl);
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

            return {
                image: canvas.toDataURL('image/png'),
                width: viewport.width,
                height: viewport.height,
            };
        } finally {
            URL.revokeObjectURL(objectUrl);
        }
    };

    useEffect(() => {
        if (!templateBlobUrl || !eventId) {
            setPreviewImage(null);
            return;
        }

        const payload = buildSamplePayload(eventId, layers, sample);
        if (!payload) {
            return;
        }

        const currentRequestId = ++previewRequestRef.current;
        setRenderingPreview(true);

        const timer = window.setTimeout(async () => {
            try {
                const response = await api.post('/sertifikat/download-sample', payload, {
                    responseType: 'blob',
                });
                const rendered = await renderPdfBlobToImage(response.data);

                if (previewRequestRef.current !== currentRequestId) {
                    return;
                }

                setPageSize({ width: rendered.width, height: rendered.height });
                setPreviewImage(rendered.image);
            } catch (error) {
                console.error(error);

                if (previewRequestRef.current === currentRequestId) {
                    toast.error('Preview sertifikat gagal dirender.');
                }
            } finally {
                if (previewRequestRef.current === currentRequestId) {
                    setRenderingPreview(false);
                }
            }
        }, 250);

        return () => {
            window.clearTimeout(timer);
        };
    }, [templateBlobUrl, eventId, layers, sample]);

    const updateLayer = (id: TextLayer['id'], patch: Partial<TextLayer>) => {
        setLayers((current) => current.map((layer) => (layer.id === id ? { ...layer, ...patch } : layer)));
    };
    const activeLayer = layers.find((layer) => layer.id === activeLayerId) ?? layers[0];

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
        } catch (error: unknown) {
            toast.error(getApiErrorMessage(error, 'Upload template gagal.'));
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

        const payload = buildSamplePayload(eventId, layers, sample);
        if (!payload) {
            toast.error('Layer sertifikat belum lengkap.');
            return;
        }

        setSaving(true);

        try {
            await api.post('/sertifikat/save-config', payload);

            setHasSavedConfig(true);
            toast.success('Konfigurasi sertifikat berhasil disimpan.');
        } catch (error: unknown) {
            toast.error(getApiErrorMessage(error, 'Gagal menyimpan konfigurasi.'));
        } finally {
            setSaving(false);
        }
    };

    const handleGenerate = async () => {
        if (!eventId) {
            toast.error('Pilih event terlebih dahulu.');
            return;
        }

        if (!nomorAwal.trim() || !nomorAkhir.trim()) {
            toast.error('Isi pengaturan nomor sertifikat terlebih dahulu.');
            return;
        }

        if (certificateItems.length === 0) {
            toast.error('Data sertifikat belum tersedia untuk diterbitkan.');
            return;
        }

        setGenerating(true);

        try {
            const response = await api.post('/sertifikat/generate', {
                event_id: eventId,
                nomor_awal: nomorAwal,
                nomor_akhir: nomorAkhir,
            });
            toast.success(response.data.message || 'Sertifikat berhasil digenerate.');
        } catch (error: unknown) {
            toast.error(getApiErrorMessage(error, 'Generate sertifikat gagal.'));
        } finally {
            setGenerating(false);
        }
    };

    const handleDownloadSample = async () => {
        if (!eventId) {
            toast.error('Pilih event terlebih dahulu.');
            return;
        }

        if (!previewImage) {
            toast.error('Upload template sertifikat terlebih dahulu.');
            return;
        }

        const payload = buildSamplePayload(eventId, layers, sample);
        if (!payload) {
            toast.error('Layer sertifikat belum lengkap.');
            return;
        }

        setDownloadingSample(true);

        try {
            const response = await api.post('/sertifikat/download-sample', payload, {
                responseType: 'blob',
            });

            const blobUrl = URL.createObjectURL(response.data);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = 'contoh-sertifikat.pdf';
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(blobUrl);
        } catch (error: unknown) {
            toast.error(getApiErrorMessage(error, 'Download contoh gagal.'));
        } finally {
            setDownloadingSample(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sertifikat" />

            <div className="space-y-6 p-5">
                <section className="from-primary/10 via-background overflow-hidden rounded-3xl border bg-gradient-to-r to-emerald-500/10 p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-3">
                            <div className="bg-background/80 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.24em] uppercase">
                                <Award className="h-3.5 w-3.5" />
                                Sertifikat Otomatis
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">Penerbitan sertifikat per event</h1>
                                <p className="text-muted-foreground mt-2 max-w-3xl text-sm">
                                    Atur event dan nomor sertifikat lebih dulu, cek daftar penerbitan unik per mata kuliah, lalu lanjutkan ke template
                                    PDF, editor koordinat, dan penerbitan ke folder Google Drive `Asisten / Semester / Event / Sertifikat / Mata
                                    Kuliah / NIM-Nama`.
                                </p>
                            </div>
                        </div>

                        <div className="bg-background/85 grid gap-3 rounded-2xl border p-4 text-sm shadow-sm sm:grid-cols-3">
                            <div>
                                <div className="text-muted-foreground text-xs tracking-[0.18em] uppercase">Event</div>
                                <div className="mt-1 font-semibold">{currentEvent?.nama || 'Belum dipilih'}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground text-xs tracking-[0.18em] uppercase">Semester</div>
                                <div className="mt-1 font-semibold">{currentEvent?.semester?.nama || '-'}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground text-xs tracking-[0.18em] uppercase">Status</div>
                                <div className="mt-1 font-semibold">{hasSavedConfig ? 'Konfigurasi tersimpan' : 'Perlu konfigurasi'}</div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-card rounded-3xl border p-5 shadow-sm">
                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <h2 className="text-xl font-semibold">Data Sertifikat</h2>
                            <p className="text-muted-foreground text-sm">
                                Satu asisten hanya mendapat satu sertifikat per mata kuliah pada event yang dipilih, meskipun terdaftar di beberapa
                                kelas berbeda.
                            </p>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1.6fr]">
                            <div className="space-y-2">
                                <Label>Event</Label>
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
                            <div className="space-y-2">
                                <Label htmlFor="nomor-awal">Nomor Awal</Label>
                                <Input
                                    id="nomor-awal"
                                    type="number"
                                    min={1}
                                    value={nomorAwal}
                                    onChange={(event) => setNomorAwal(event.target.value)}
                                    inputMode="numeric"
                                    placeholder="141"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nomor-akhir">Format Tetap</Label>
                                <Input
                                    id="nomor-akhir"
                                    value={nomorAkhir}
                                    onChange={(event) => setNomorAkhir(event.target.value)}
                                    placeholder="DST/IT9.3.1/HM.02.06/2026"
                                />
                            </div>
                        </div>

                        <div className="bg-muted/20 rounded-2xl border">
                            <div className="flex items-center justify-between border-b px-4 py-3">
                                <div>
                                    <h3 className="font-semibold">Daftar Sertifikat Siap Terbit</h3>
                                    <p className="text-muted-foreground text-xs">
                                        Preview nomor sertifikat mengikuti urutan mata kuliah lalu nama asisten.
                                    </p>
                                </div>
                                <div className="bg-background text-muted-foreground rounded-full px-3 py-1 text-xs font-semibold shadow-sm">
                                    {loadingCertificateItems ? 'Memuat data...' : `${certificateItems.length} sertifikat`}
                                </div>
                            </div>

                            <div className="max-h-[380px] overflow-auto">
                                {certificateItems.length === 0 ? (
                                    <div className="text-muted-foreground px-4 py-10 text-center text-sm">
                                        {loadingCertificateItems
                                            ? 'Sedang menyiapkan data sertifikat.'
                                            : 'Pilih event dan isi nomor sertifikat untuk melihat daftar penerbitan.'}
                                    </div>
                                ) : (
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-background/95 sticky top-0 backdrop-blur">
                                            <tr className="text-muted-foreground border-b text-left text-xs tracking-[0.16em] uppercase">
                                                <th className="px-4 py-3 font-medium">No</th>
                                                <th className="px-4 py-3 font-medium">Nama</th>
                                                <th className="px-4 py-3 font-medium">Mata Kuliah</th>
                                                <th className="px-4 py-3 font-medium">Nomor Sertifikat</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {certificateItems.map((item) => (
                                                <tr key={`${item.user_id}-${item.mata_kuliah_id}`} className="border-b last:border-b-0">
                                                    <td className="px-4 py-3 align-top font-medium">{item.nomor_urut}</td>
                                                    <td className="px-4 py-3 align-top">
                                                        <div className="font-medium">{item.nama}</div>
                                                        {item.kelas.length > 0 && (
                                                            <div className="text-muted-foreground text-xs">Kelas: {item.kelas.join(', ')}</div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 align-top">{item.mata_kuliah}</td>
                                                    <td className="px-4 py-3 align-top font-medium">{item.nomor_sertifikat}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
                    <aside className="space-y-6">
                        <div className="bg-card rounded-3xl border p-5 shadow-sm">
                            <div className="mb-5 flex items-center gap-3">
                                <div className="bg-primary/10 text-primary rounded-2xl p-2">
                                    <FileBadge2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="font-semibold">Pengaturan Sertifikat</h2>
                                    <p className="text-muted-foreground text-sm">Setelah data nomor siap, lanjutkan ke template dan koordinat.</p>
                                </div>
                            </div>

                            <div className="bg-muted/30 mb-5 grid grid-cols-2 gap-2 rounded-2xl p-1">
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
                                {activeTab === 'upload' ? (
                                    <>
                                        <div className="space-y-2">
                                            <Label>Template Sertifikat PDF</Label>
                                            <label className="bg-muted/20 hover:border-primary/50 hover:bg-primary/5 flex min-h-32 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-4 text-center transition">
                                                <div className="bg-primary/10 text-primary rounded-full p-3">
                                                    <Upload className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <div className="font-medium">{pdfFile?.name || 'Pilih atau drop file PDF'}</div>
                                                    <div className="text-muted-foreground mt-1 text-xs">
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
                                            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                            Upload Template
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <div className="bg-muted/20 rounded-2xl border p-4">
                                            <div className="space-y-2">
                                                <Label>Layer Yang Diatur</Label>
                                                <Select value={activeLayerId} onValueChange={(value) => setActiveLayerId(value as TextLayer['id'])}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Pilih layer" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {layers.map((layer) => (
                                                            <SelectItem key={layer.id} value={layer.id}>
                                                                {layer.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="bg-background mt-4 rounded-2xl border p-4">
                                                <div className="mb-4 flex items-center justify-between">
                                                    <div>
                                                        <h3 className="font-semibold">Layer {activeLayer.label}</h3>
                                                        <p className="text-muted-foreground text-xs">
                                                            Atur posisi dan ukuran font untuk layer terpilih.
                                                        </p>
                                                    </div>
                                                    <div className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold">
                                                        {activeLayer.x.toFixed(1)}%, {activeLayer.y.toFixed(1)}%
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
                                                            value={activeLayer.x}
                                                            onChange={(event) =>
                                                                updateLayer(activeLayer.id, {
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
                                                            value={activeLayer.y}
                                                            onChange={(event) =>
                                                                updateLayer(activeLayer.id, {
                                                                    y: Number(event.target.value),
                                                                })
                                                            }
                                                        />
                                                    </div>
                                                    <div className="space-y-2 sm:col-span-2">
                                                        <Label>Font Family</Label>
                                                        <Select
                                                            value={activeLayer.fontFamily}
                                                            onValueChange={(value) =>
                                                                updateLayer(activeLayer.id, {
                                                                    fontFamily: value as TextLayer['fontFamily'],
                                                                })
                                                            }
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Pilih font" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {fontOptions.map((font) => (
                                                                    <SelectItem key={font.value} value={font.value}>
                                                                        {font.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2 sm:col-span-2">
                                                        <Label>Font Size</Label>
                                                        <Input
                                                            type="number"
                                                            min={8}
                                                            max={72}
                                                            step={1}
                                                            value={activeLayer.fontSize}
                                                            onChange={(event) =>
                                                                updateLayer(activeLayer.id, {
                                                                    fontSize: Number(event.target.value),
                                                                })
                                                            }
                                                        />
                                                    </div>
                                                    <div className="space-y-2 sm:col-span-2">
                                                        <Label>Style</Label>
                                                        <div className="flex flex-wrap gap-2">
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant={activeLayer.isBold ? 'default' : 'outline'}
                                                                onClick={() =>
                                                                    updateLayer(activeLayer.id, {
                                                                        isBold: !activeLayer.isBold,
                                                                    })
                                                                }
                                                            >
                                                                <Bold className="mr-2 h-4 w-4" />
                                                                Bold
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant={activeLayer.isItalic ? 'default' : 'outline'}
                                                                onClick={() =>
                                                                    updateLayer(activeLayer.id, {
                                                                        isItalic: !activeLayer.isItalic,
                                                                    })
                                                                }
                                                            >
                                                                <Italic className="mr-2 h-4 w-4" />
                                                                Italic
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant={activeLayer.isUnderline ? 'default' : 'outline'}
                                                                onClick={() =>
                                                                    updateLayer(activeLayer.id, {
                                                                        isUnderline: !activeLayer.isUnderline,
                                                                    })
                                                                }
                                                            >
                                                                <Underline className="mr-2 h-4 w-4" />
                                                                Underline
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <Button onClick={handleSaveConfig} disabled={saving || !previewImage} variant="outline">
                                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                            Simpan Konfigurasi
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="bg-card rounded-3xl border p-5 shadow-sm">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="rounded-2xl bg-emerald-500/10 p-2 text-emerald-600">
                                    <WandSparkles className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="font-semibold">Aksi Penerbitan</h2>
                                    <p className="text-muted-foreground text-sm">
                                        Pastikan nomor dan template sudah sesuai sebelum menerbitkan seluruh sertifikat.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-muted/20 space-y-3 rounded-2xl border p-4 text-sm">
                                <div className="flex items-start gap-3">
                                    <Eye className="text-primary mt-0.5 h-4 w-4" />
                                    <span>Preview utama menampilkan hasil penempatan nama, nomor, mata kuliah, dan custom.</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Move className="text-primary mt-0.5 h-4 w-4" />
                                    <span>
                                        Di tab koordinat, posisi nama, nomor, mata kuliah, dan custom bisa digeser lalu fine-tune dengan angka
                                        koordinat sambil melihat preview yang sama.
                                    </span>
                                </div>
                            </div>

                            <div className="mt-5 grid gap-3">
                                <Button onClick={handleDownloadSample} disabled={downloadingSample || !previewImage} variant="outline">
                                    {downloadingSample ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                    Download Contoh
                                </Button>
                                <Button
                                    onClick={handleGenerate}
                                    disabled={generating || !previewImage || certificateItems.length === 0}
                                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                                >
                                    {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileBadge2 className="mr-2 h-4 w-4" />}
                                    Generate Sertifikat
                                </Button>
                            </div>
                        </div>
                    </aside>

                    <section className="bg-card rounded-3xl border p-5 shadow-sm">
                        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                                <h2 className="text-xl font-semibold">Preview Template Sertifikat</h2>
                                <p className="text-muted-foreground text-sm">
                                    Nama, nomor, mata kuliah, dan custom di bawah ini menjadi acuan live preview sebelum sertifikat digenerate massal.
                                </p>
                            </div>
                            {(loadingSetup || renderingPreview) && (
                                <div className="bg-muted/30 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    {loadingSetup ? 'Memuat template event' : 'Memperbarui preview PDF'}
                                </div>
                            )}
                        </div>

                        <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <div className="space-y-2">
                                <Label htmlFor="sample-nama">Preview Nama</Label>
                                <Input
                                    id="sample-nama"
                                    value={sample.nama}
                                    onChange={(event) => setSample((current) => ({ ...current, nama: event.target.value }))}
                                    placeholder="Masukkan contoh nama"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sample-nomor">Preview No</Label>
                                <Input
                                    id="sample-nomor"
                                    value={sample.nomor}
                                    onChange={(event) => setSample((current) => ({ ...current, nomor: event.target.value }))}
                                    placeholder="Masukkan contoh nomor sertifikat"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sample-mata-kuliah">Preview Mata Kuliah</Label>
                                <Input
                                    id="sample-mata-kuliah"
                                    value={sample.mata_kuliah}
                                    onChange={(event) => setSample((current) => ({ ...current, mata_kuliah: event.target.value }))}
                                    placeholder="Masukkan contoh mata kuliah"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sample-custom">Preview Custom</Label>
                                <Input
                                    id="sample-custom"
                                    value={sample.custom}
                                    onChange={(event) => setSample((current) => ({ ...current, custom: event.target.value }))}
                                    placeholder="Masukkan teks custom"
                                />
                            </div>
                        </div>

                        {!previewImage ? (
                            <div className="bg-muted/10 flex min-h-[520px] flex-col items-center justify-center rounded-3xl border border-dashed p-10 text-center">
                                <div className="bg-primary/10 text-primary rounded-full p-4">
                                    <FileBadge2 className="h-10 w-10" />
                                </div>
                                <h3 className="mt-4 text-lg font-semibold">Belum ada template untuk event ini</h3>
                                <p className="text-muted-foreground mt-2 max-w-md text-sm">
                                    Pilih event lalu upload PDF template sertifikat. Setelah itu Anda bisa membuka tab pengaturan koordinat dan
                                    generate sertifikat otomatis.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <TemplateStage
                                    imageUrl={previewImage}
                                    pageSize={pageSize}
                                    layers={layers}
                                    onChangeLayer={activeTab === 'coordinates' ? updateLayer : undefined}
                                />
                                <div className="bg-muted/20 text-muted-foreground flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 text-sm">
                                    <span>
                                        Posisi nama: {layers.find((layer) => layer.id === 'nama')?.x.toFixed(1)}%,{' '}
                                        {layers.find((layer) => layer.id === 'nama')?.y.toFixed(1)}%
                                    </span>
                                    <span>
                                        Posisi no: {layers.find((layer) => layer.id === 'nomor')?.x.toFixed(1)}%,{' '}
                                        {layers.find((layer) => layer.id === 'nomor')?.y.toFixed(1)}%
                                    </span>
                                    <span>
                                        Posisi mata kuliah: {layers.find((layer) => layer.id === 'mata_kuliah')?.x.toFixed(1)}%,{' '}
                                        {layers.find((layer) => layer.id === 'mata_kuliah')?.y.toFixed(1)}%
                                    </span>
                                    <span>
                                        Posisi custom: {layers.find((layer) => layer.id === 'custom')?.x.toFixed(1)}%,{' '}
                                        {layers.find((layer) => layer.id === 'custom')?.y.toFixed(1)}%
                                    </span>
                                    <span>{hasSavedConfig ? 'Konfigurasi event ini sudah tersimpan.' : 'Konfigurasi event ini belum disimpan.'}</span>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}
