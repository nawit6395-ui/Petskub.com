import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { alert } from '@/lib/alerts';

export interface Report {
  id: string;
  province: string;
  district: string;
  location: string;
  description?: string;
  photo_urls?: string[] | string | null;
  latitude: number | null;
  longitude: number | null;
  cat_count: number;
  status: 'pending' | 'in_progress' | 'resolved';
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const REPORT_STATUS_LABELS: Record<Report['status'], string> = {
  pending: 'รอดำเนินการ',
  in_progress: 'กำลังติดตาม',
  resolved: 'ปิดรายงานแล้ว',
};

export const useReports = () => {
  return useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Report[];
    },
    staleTime: 1000 * 60 * 2,
    select: (data) => data ?? [],
    placeholderData: (prev) => prev,
  });
};

export const useCreateReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (report: Omit<Report, 'id' | 'created_at' | 'updated_at'>) => {
      // Debug: log payload ก่อนส่ง
      console.log('[DEBUG] Supabase payload:', report);
      // Sanitize payload to only include allowed columns to avoid PostgREST schema errors
      const allowedFields = [
        'province',
        'district',
        'location',
        'description',
        'latitude',
        'longitude',
        'cat_count',
        'status',
        'user_id',
        'photo_urls',
      ];

      const sanitize = (payload: any) => {
        return Object.fromEntries(Object.entries(payload).filter(([k]) => allowedFields.includes(k)));
      };

      const tryInsert = async (payload: any) => {
        const safe = sanitize(payload);
        console.log('[DEBUG] sanitized payload:', safe);
        // Request only `id` to avoid selecting unknown columns that may trigger schema cache errors
        const { data, error } = await supabase.from('reports').insert(safe).select('id').single();
        return { data, error };
      };

      // First attempt with provided report
      const { data, error } = await tryInsert(report as any);

      if (error) {
        // Debug: log error เต็ม
        console.error('[DEBUG] Supabase error:', error);
        const msg = (error.message || '').toLowerCase();

        // If schema mismatch mentions photo columns, retry without photo fields
        if (msg.includes('could not find the') && (msg.includes('photo_url') || msg.includes('photo_urls'))) {
          const cleaned: any = { ...report };
          delete cleaned.photo_url;
          delete cleaned.photo_urls;

          const retry = await tryInsert(cleaned);
          if (retry.error) throw retry.error;
          return retry.data;
        }

        // Generic fallback: remove photo-related fields and retry
        if (msg.includes('could not find the')) {
          const cleaned: any = { ...report };
          delete cleaned.photo_url;
          delete cleaned.photo_urls;

          const retry = await tryInsert(cleaned);
          if (retry.error) throw retry.error;
          return retry.data;
        }

        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      alert.success('ส่งรายงานสำเร็จ!', {
        description: 'ขอบคุณที่ช่วยแจ้งจุดพบสัตว์จร'
      });
    },
    onError: (error: any) => {
      // แสดง error message เต็ม
      let detail = error?.message || '';
      if (error?.details) detail += '\n' + error.details;
      if (error?.hint) detail += '\n' + error.hint;
      alert.error('เกิดข้อผิดพลาด', {
        description: detail || 'ไม่สามารถส่งรายงานได้ กรุณาตรวจสอบข้อมูลอีกครั้ง'
      });
    },
  });
};

export const useUpdateReportStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: Report['status'];
    }) => {
      const { data, error } = await supabase
        .from('reports')
        .update({ status })
        .eq('id', id)
        .select('id, status, updated_at')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      alert.success('อัปเดตสถานะรายงานแล้ว', {
        description: `สถานะใหม่: ${REPORT_STATUS_LABELS[variables.status]}`,
      });
    },
    onError: (error: any) => {
      alert.error('ไม่สามารถอัปเดตสถานะได้', {
        description: error?.message || 'กรุณาลองอีกครั้ง',
      });
    },
  });
};
