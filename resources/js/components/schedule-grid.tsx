import React from 'react';
import { cn, getCourseColor, PASTEL_PALETTE, getContrastColor } from '@/lib/utils';
import { Badge } from './ui/badge';

interface MataKuliah {
    id: number;
    nama: string;
    kode: string;
    color?: string;
}

interface Kelas {
    id: number;
    nama: string;
    mata_kuliah_id: number;
}

interface ScheduleEntry {
    id: number;
    hari: string;
    jam_mulai: string;
    jam_selesai: string;
    mata_kuliah: MataKuliah;
    kelas: Kelas;
    keterangan?: string;
}

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const START_HOUR = 7.5; // 07:30
const END_HOUR = 17.5; // 17:30 (to show until 17:00)

const TIME_SLOTS = Array.from({ length: (END_HOUR - START_HOUR) * 2 }, (_, i) => {
    const totalMinutes = (START_HOUR * 60) + (i * 30);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
});

// Shared color utility used from @/lib/utils

interface ScheduleGridProps {
    schedules: ScheduleEntry[];
    onEntryClick?: (entry: ScheduleEntry) => void;
}

export function ScheduleGrid({ schedules, onEntryClick }: ScheduleGridProps) {
    const timeToPosition = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        const totalHours = h + (m || 0) / 60;
        return (totalHours - START_HOUR) * 2;
    };

    const getDayIndex = (day: string) => DAYS.indexOf(day);

    return (
        <div className="relative overflow-auto border rounded-lg bg-card shadow-sm max-h-[700px]">
            <div className="grid grid-cols-[80px_repeat(6,1fr)] min-w-[800px] relative">
                {/* Header row */}
                <div className="sticky top-0 z-20 bg-muted/90 backdrop-blur border-b p-2"></div>
                {DAYS.map((day) => (
                    <div key={day} className="sticky top-0 z-20 bg-muted/90 backdrop-blur border-b p-2 text-center font-semibold text-sm">
                        {day}
                    </div>
                ))}

                {/* Grid Body */}
                <div className="contents">
                    {/* Time labels column */}
                    {TIME_SLOTS.map((time, i) => (
                        <React.Fragment key={time}>
                            <div className="border-r border-b px-2 py-4 h-16 flex items-center justify-center text-xs font-mono text-muted-foreground bg-muted/10 sticky left-0 z-10 whitespace-nowrap">
                                {time}
                            </div>
                            
                            {/* Background cells for each day */}
                            {DAYS.map((_, dayIndex) => (
                                <div key={dayIndex} className="border-r border-b h-16 bg-muted/5 transition-colors hover:bg-muted/10" />
                            ))}
                        </React.Fragment>
                    ))}

                    {/* Schedule Overlays */}
                    {schedules.map((entry) => {
                        const dayIndex = getDayIndex(entry.hari);
                        if (dayIndex === -1) return null;

                        const startPos = timeToPosition(entry.jam_mulai);
                        const endPos = timeToPosition(entry.jam_selesai);
                        const duration = endPos - startPos;

                        if (startPos < 0 || startPos >= TIME_SLOTS.length) return null;

                        const baseColor = getCourseColor(entry.mata_kuliah.color, entry.mata_kuliah.id);
                        const contrastColor = getContrastColor(baseColor);
                        const isDarkText = contrastColor === '#1a1a1a';

                        return (
                            <div
                                key={entry.id}
                                onClick={() => onEntryClick?.(entry)}
                                className={cn(
                                    "absolute z-10 p-2 rounded border-l-4 shadow-sm cursor-pointer transition-all hover:brightness-95 hover:scale-[1.01] active:scale-[0.99] overflow-hidden",
                                    "flex flex-col gap-0.5"
                                )}
                                style={{
                                    left: `calc(80px + (100% - 80px) / 6 * ${dayIndex} + 4px)`,
                                    top: `calc(41px + ${startPos * 64}px + 4px)`,
                                    width: `calc((100% - 80px) / 6 - 8px)`,
                                    height: `${duration * 64 - 8}px`,
                                    backgroundColor: baseColor,
                                    borderColor: isDarkText ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)',
                                }}
                            >
                                <div className="flex items-center justify-between gap-1">
                                    <span 
                                        className="text-[10px] font-bold uppercase tracking-tight truncate"
                                        style={{ color: isDarkText ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)' }}
                                    >
                                        {entry.mata_kuliah?.kode || '???'}
                                    </span>
                                    {entry.kelas && (
                                        <Badge 
                                            variant="outline" 
                                            className={cn(
                                                "h-4 px-1 text-[9px] font-bold border-transparent",
                                                isDarkText ? "bg-black/5 text-black/60" : "bg-white/20 text-white"
                                            )}
                                        >
                                            {entry.kelas.nama}
                                        </Badge>
                                    )}
                                </div>
                                <span className={cn("text-[13px] font-bold leading-tight line-clamp-2")} style={{ color: contrastColor }}>
                                    {entry.mata_kuliah?.nama || 'Unknown MK'}
                                </span>
                                <div className="mt-auto flex flex-col gap-0.5">
                                    <span 
                                        className="text-[10px] font-mono font-medium"
                                        style={{ color: isDarkText ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)' }}
                                    >
                                        {entry.jam_mulai.slice(0, 5)} - {entry.jam_selesai.slice(0, 5)}
                                    </span>
                                    {entry.keterangan && (
                                        <span 
                                            className="text-[9px] italic truncate rounded px-1"
                                            style={{ 
                                                backgroundColor: isDarkText ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)',
                                                color: isDarkText ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)'
                                            }}
                                        >
                                            {entry.keterangan}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
