import api from '@/lib/api'; // pastikan ini instance axios kamu
import { useEffect, useState } from 'react';
import { AttendanceSummary } from './summary';

export function useAttendanceSummary() {
    const [summary, setSummary] = useState<AttendanceSummary | null>(null);
    const [loadingku, setLoading] = useState(true);

    const fetchData = () => {
        setLoading(true);
        api.post('/attendances/get-monthly')
            .then((res) => {
                const { data, success } = res.data;
                if (success && data) {
                    setSummary(data);
                } else {
                    console.warn('Response tidak valid:', res.data);
                }
            })
            .catch((err) => {
                console.error('Gagal memuat data absensi:', err);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, []);

    return { summary, loadingku, refetch: fetchData };
}
