import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DataTable } from '@/components/tanstack-table';
import { DocumentViewerDialog } from '@/components/document-viewer-dialog';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { PaginationState } from '@tanstack/react-table';
import { Award, ExternalLink } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Sertifikat', href: '/sertifikat' }
];

interface SertifikatItem {
    id: number;
    nomor_sertifikat: string;
    mata_kuliah: { nama: string };
    event: { nama: string, semester: { nama: string } };
    generated_at: string;
}

export default function SertifikatMahasiswaPage() {
    const [data, setData] = useState<SertifikatItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [pageCount, setPageCount] = useState(-1);
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });

    const loadData = async (pageIndex: number, pageSize: number) => {
        setLoading(true);
        try {
            const response = await api.get('/sertifikat/my', {
                params: {
                    page: pageIndex + 1,
                    per_page: pageSize,
                },
            });
            setData(response.data.data);
            setPageCount(Math.ceil(response.data.total / pageSize));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData(pagination.pageIndex, pagination.pageSize);
    }, [pagination.pageIndex, pagination.pageSize]);

    const columns = useMemo(
        () => [
            {
                header: 'No',
                cell: (info: any) => pagination.pageIndex * pagination.pageSize + info.row.index + 1,
                id: 'no',
            },
            {
                accessorKey: 'event.semester.nama',
                header: 'Semester',
                cell: (info: any) => info.getValue() || '-',
            },
            {
                accessorKey: 'event.nama',
                header: 'Event',
                cell: (info: any) => info.getValue() || '-',
            },
            {
                accessorKey: 'mata_kuliah.nama',
                header: 'Mata Kuliah',
                cell: (info: any) => info.getValue() || '-',
            },
            {
                accessorKey: 'nomor_sertifikat',
                header: 'No. Sertifikat',
                cell: (info: any) => info.getValue() || '-',
            },
            {
                accessorKey: 'generated_at',
                header: 'Tanggal Terbit',
                cell: (info: any) => new Date(info.getValue()).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            },
            {
                id: 'actions',
                header: 'Aksi',
                cell: (info: any) => (
                    <DocumentViewerDialog
                        title={`Sertifikat - ${info.row.original.mata_kuliah?.nama || 'Mata Kuliah'}`}
                        src={`/sertifikat/${info.row.original.id}/view`}
                        trigger={
                            <Button size="sm" variant="outline" className="gap-2">
                                Lihat <ExternalLink className="h-4 w-4" />
                            </Button>
                        }
                    />
                ),
            },
        ],
        [pagination]
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sertifikat Saya" />
            
            <div className="space-y-6 p-5">
                <section className="from-primary/10 via-background border bg-gradient-to-r to-emerald-500/10 shadow-sm rounded-3xl overflow-hidden p-6 md:p-8 relative">
                    <div className="absolute top-0 right-0 -mt-12 -mr-12 text-primary/5 opacity-50 pointer-events-none">
                        <Award className="w-64 h-64" />
                    </div>
                    
                    <div className="relative z-10 flex flex-col gap-4">
                        <div className="space-y-3 max-w-2xl">
                            <div className="bg-background/80 text-muted-foreground shadow-sm inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold tracking-widest uppercase">
                                <Award className="h-4 w-4" />
                                Pencapaian
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-foreground">Sertifikat Asisten</h1>
                                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                                    Daftar sertifikat yang telah Anda peroleh selama mendedikasikan diri menjadi asisten praktikum. 
                                    Sertifikat diurutkan berdasarkan tanggal penerbitan terbaru.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <Card className="shadow-sm border-0 ring-1 ring-border/50">
                    <CardContent className="p-0">
                        <DataTable
                            columns={columns}
                            data={data}
                            isLoading={loading}
                            pagination={pagination}
                            onPaginationChange={setPagination}
                            pageCount={pageCount}
                        />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
