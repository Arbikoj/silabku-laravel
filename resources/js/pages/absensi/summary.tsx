import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

// ==============================
// Type Definition
// ==============================
export interface AttendanceTrend {
    name: string; // Contoh: '2025-10-01'
    hadir: number;
    terlambat: number;
    absen: number;
}

export interface AttendanceSummary {
    total_scheduled: number;
    hadir: number;
    terlambat: number;
    total_absen: number;
    formatted: string;
    trend: AttendanceTrend[];
}

// ==============================
// Loading Skeleton
// ==============================
function LoadingSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse p-4">
                    {' '}
                    <div className="mb-4 h-4 w-24 rounded bg-gray-300"></div> <div className="mb-2 h-8 w-16 rounded bg-gray-300"></div>{' '}
                    <div className="h-6 w-full rounded bg-gray-200"></div>{' '}
                </Card>
            ))}{' '}
        </div>
    );
}

// ==============================
// Custom Tooltip
// ==============================
const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="rounded border border-gray-300 bg-white p-2 shadow-sm">
                {' '}
                <p className="text-sm font-medium">{data.name}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} className="text-xs" style={{ color: entry.color }}>
                        {`${entry.name}: ${entry.value}`}{' '}
                    </p>
                ))}{' '}
            </div>
        );
    }
    return null;
};

// ==============================
// Main Component
// ==============================
interface Props {
    summary?: AttendanceSummary;
    isLoading?: boolean;
}

export default function AttendanceSummaryCards({ summary, isLoading = false }: Props) {
    if (isLoading || !summary) return <LoadingSkeleton />;

    const cards = [
        {
            title: 'Hadir',
            value: summary.hadir,
            icon: <CheckCircle className="h-6 w-6 text-green-500" />,
            color: '#16a34a',
            dataKey: 'hadir',
        },
        {
            title: 'Terlambat',
            value: summary.terlambat,
            icon: <Clock className="h-6 w-6 text-yellow-500" />,
            color: '#eab308',
            dataKey: 'terlambat',
        },
        {
            title: 'Absen',
            value: summary.total_scheduled - summary.hadir,
            icon: <XCircle className="h-6 w-6 text-red-500" />,
            color: '#dc2626',
            dataKey: 'absen',
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 p-2 px-5 md:grid-cols-3">
            {cards.map((card, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                    <Card className="border border-gray-100 shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">{card.title}</CardTitle>
                            {card.icon}
                        </CardHeader>

                        <CardContent>
                            <div className="mb-2 text-3xl font-bold">{card.value}</div>

                            {/* Sparkline */}
                            <div className="h-[60px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={summary.trend}>
                                        <XAxis dataKey="name" hide />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Line type="monotone" dataKey={card.dataKey} stroke={card.color} strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
}
