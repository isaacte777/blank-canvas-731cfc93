import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadImage = async (file: File, folder: string = 'general'): Promise<string | null> => {
    if (!file) return null;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Error',
        description: 'Tipo de archivo no válido. Use JPG, PNG, WebP o GIF.',
        variant: 'destructive'
      });
      return null;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'El archivo es muy grande. Máximo 5MB.',
        variant: 'destructive'
      });
      return null;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      toast({
        title: 'Imagen subida',
        description: 'La imagen se ha subido correctamente'
      });

      return data.publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo subir la imagen',
        variant: 'destructive'
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const uploadVideo = async (file: File, folder: string = 'videos'): Promise<string | null> => {
    if (!file) return null;

    // Validate file type
    const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Error',
        description: 'Tipo de archivo no válido. Use MP4, WebM, OGG, MOV, AVI o MKV.',
        variant: 'destructive'
      });
      return null;
    }

    // Validate file size (max 2GB for videos)
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
    if (file.size > maxSize) {
      toast({
        title: 'Error',
        description: 'El archivo es muy grande. Máximo 2GB.',
        variant: 'destructive'
      });
      return null;
    }

    setUploading(true);

    // Show progress toast for large files
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(0);
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: 'Subiendo video...',
        description: `Archivo de ${fileSizeMB}MB. Por favor espera, esto puede tomar varios minutos.`
      });
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName);

      toast({
        title: 'Video subido',
        description: 'El video se ha subido correctamente'
      });

      return data.publicUrl;
    } catch (error: any) {
      console.error('Error uploading video:', error);
      
      // Provide more specific error messages
      let errorMessage = 'No se pudo subir el video';
      if (error.message?.includes('bucket') || error.message?.includes('not found')) {
        errorMessage = 'El bucket de videos no existe. Contacta al administrador.';
      } else if (error.message?.includes('exceeded') || error.message?.includes('size')) {
        errorMessage = 'El archivo excede el límite de tamaño permitido.';
      } else if (error.message?.includes('permission') || error.message?.includes('policy')) {
        errorMessage = 'No tienes permisos para subir videos.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Error al subir video',
        description: errorMessage,
        variant: 'destructive'
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (url: string): Promise<boolean> => {
    try {
      // Extract file path from URL
      const urlParts = url.split('/images/');
      if (urlParts.length < 2) return false;
      
      const filePath = urlParts[1];
      
      const { error } = await supabase.storage
        .from('images')
        .remove([filePath]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  };

  return { uploadImage, uploadVideo, deleteImage, uploading };
};
