import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { X, Upload, Loader2 } from 'lucide-react';
import { alert } from '@/lib/alerts';

interface MultiImageUploadProps {
  maxImages?: number;
  imageUrls: string[];
  onImagesChange: (urls: string[]) => void;
  userId: string;
}

export const MultiImageUpload = ({ 
  maxImages = 3, 
  imageUrls, 
  onImagesChange,
  userId 
}: MultiImageUploadProps) => {
  const [uploading, setUploading] = useState(false);

  // Simple client-side image compression using canvas
  async function compressImage(file: File, maxWidth = 1600, maxHeight = 1600, quality = 0.75) {
    if (!file.type.startsWith('image/')) return file;

    const imageBitmap = await createImageBitmap(file);
    let { width, height } = imageBitmap;

    const shouldResize = width > maxWidth || height > maxHeight;
    if (!shouldResize && file.size <= 5000 * 1024) {
      return file;
    }

    const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(imageBitmap, 0, 0, width, height);

    return await new Promise<File>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file);
          const compressed = new File([blob], file.name, { type: blob.type });
          resolve(compressed);
        },
        'image/jpeg',
        quality
      );
    });
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // Prevent anonymous uploads
    if (!userId || userId === 'anon') {
      alert.error('ต้องเข้าสู่ระบบก่อนจึงจะสามารถอัพโหลดรูปภาพได้');
      // reset input
      if (event.target) event.target.value = '';
      return;
    }
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Check if adding these files would exceed max images
    if (imageUrls.length + files.length > maxImages) {
      alert.error(`สามารถอัพโหลดได้สูงสุด ${maxImages} รูปเท่านั้น`);
      return;
    }

    setUploading(true);
    const newUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        let file = files[i];

        // Compress image before uploading to reduce size/network
        try {
          file = await compressImage(file);
        } catch (e) {
          console.warn('Image compression failed, uploading original', e);
        }
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert.error(`ไฟล์ ${file.name} ไม่ใช่รูปภาพ`);
          continue;
        }

        // Validate file size (6MB) after compression
        if (file.size > 6 * 1024 * 1024) {
          alert.error(`รูป ${file.name} มีขนาดใหญ่เกิน 6MB`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}-${i}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('cat-images')
          .upload(fileName, file);

        if (error) {
          // Provide clearer guidance for common RLS / permission errors
          console.error('Supabase storage upload error:', error);
          if ((error.message || '').toLowerCase().includes('row-level security') || (error.code || '').toString().startsWith('PGRST')) {
            throw new Error('ไม่สามารถอัพโหลดไฟล์ได้: สิทธิ์การเข้าถึง storage ถูกจำกัด (กรุณาเข้าสู่ระบบหรือปรับนโยบายใน Supabase)');
          }
          throw error;
        }

        const publicResult = supabase.storage
          .from('cat-images')
          .getPublicUrl(data.path);

        // getPublicUrl returns { data: { publicUrl } }
        const publicUrl = (publicResult as any)?.data?.publicUrl || '';
        newUrls.push(publicUrl);
      }

      onImagesChange([...imageUrls, ...newUrls]);
      alert.success(`อัพโหลดรูปภาพสำเร็จ ${newUrls.length} รูป`);
    } catch (error: any) {
      alert.error('เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ', {
        description: error.message
      });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const removeImage = async (urlToRemove: string) => {
    try {
      // Extract file path from URL
      const urlParts = urlToRemove.split('/');
      const bucketIndex = urlParts.findIndex(part => part === 'cat-images');
      if (bucketIndex !== -1) {
        const filePath = urlParts.slice(bucketIndex + 1).join('/');
        
        // Delete from storage
        await supabase.storage
          .from('cat-images')
          .remove([filePath]);
      }

      // Remove from list
      onImagesChange(imageUrls.filter(url => url !== urlToRemove));
      alert.success('ลบรูปภาพสำเร็จ');
    } catch (error: any) {
      alert.error('เกิดข้อผิดพลาดในการลบรูปภาพ', {
        description: error.message
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={uploading || imageUrls.length >= maxImages}
          onClick={() => document.getElementById('image-upload')?.click()}
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              กำลังอัพโหลด...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              เลือกรูปภาพ ({imageUrls.length}/{maxImages})
            </>
          )}
        </Button>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
          disabled={uploading || imageUrls.length >= maxImages}
        />
      </div>

      {imageUrls.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {imageUrls.map((url, index) => (
            <div key={url} className="relative group">
              <img
                src={url}
                alt={`รูปที่ ${index + 1}`}
                className="w-full h-40 object-cover rounded-lg border"
              />
              <button
                type="button"
                onClick={() => removeImage(url)}
                className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
