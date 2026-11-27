import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ScheduledContent {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  page_content_snapshot: Record<string, any> | null;
  services_snapshot: any[] | null;
  events_snapshot: any[] | null;
  announcements_snapshot: any[] | null;
  ministries_snapshot: any[] | null;
  gallery_snapshot: any[] | null;
}

export interface ContentSnapshot {
  pageContent: Record<string, any>;
  services: any[];
  events: any[];
  announcements: any[];
  ministries: any[];
  gallery: any[];
}

export const useScheduledContent = () => {
  const [scheduledItems, setScheduledItems] = useState<ScheduledContent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchScheduledContent = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('scheduled_content')
        .select('*')
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      
      // Type cast to handle JSONB fields properly
      const typedData = (data || []).map(item => ({
        ...item,
        page_content_snapshot: item.page_content_snapshot as Record<string, any> | null,
        services_snapshot: item.services_snapshot as any[] | null,
        events_snapshot: item.events_snapshot as any[] | null,
        announcements_snapshot: item.announcements_snapshot as any[] | null,
        ministries_snapshot: item.ministries_snapshot as any[] | null,
        gallery_snapshot: item.gallery_snapshot as any[] | null,
      }));
      
      setScheduledItems(typedData);
    } catch (error) {
      console.error('Error fetching scheduled content:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el contenido programado",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchScheduledContent();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('scheduled_content_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scheduled_content'
        },
        (payload) => {
          console.log('Scheduled content changed:', payload);
          fetchScheduledContent();
          
          // Notify when a scheduled content is published
          if (payload.eventType === 'UPDATE' && payload.new) {
            const newItem = payload.new as ScheduledContent;
            if (newItem.is_published && !payload.old?.is_published) {
              toast({
                title: "🎉 Contenido publicado",
                description: `"${newItem.title}" se ha publicado automáticamente`,
              });
              // Trigger page reload for visitors
              window.dispatchEvent(new CustomEvent('content-published', { detail: newItem }));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchScheduledContent, toast]);

  const createScheduledContent = async (
    title: string,
    description: string,
    scheduledAt: Date,
    snapshot: ContentSnapshot
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('scheduled_content')
        .insert({
          title,
          description,
          scheduled_at: scheduledAt.toISOString(),
          created_by: user?.id || null,
          page_content_snapshot: snapshot.pageContent,
          services_snapshot: snapshot.services,
          events_snapshot: snapshot.events,
          announcements_snapshot: snapshot.announcements,
          ministries_snapshot: snapshot.ministries,
          gallery_snapshot: snapshot.gallery,
        });

      if (error) throw error;

      toast({
        title: "✅ Programado",
        description: `Los cambios se publicarán el ${scheduledAt.toLocaleDateString('es-ES', { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'long',
          hour: '2-digit',
          minute: '2-digit'
        })}`,
      });

      await fetchScheduledContent();
      return true;
    } catch (error) {
      console.error('Error creating scheduled content:', error);
      toast({
        title: "Error",
        description: "No se pudo programar el contenido",
        variant: "destructive"
      });
      return false;
    }
  };

  const updateScheduledContent = async (
    id: string,
    updates: Partial<Pick<ScheduledContent, 'title' | 'description' | 'scheduled_at'>>
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('scheduled_content')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Actualizado",
        description: "La programación se actualizó correctamente",
      });

      await fetchScheduledContent();
      return true;
    } catch (error) {
      console.error('Error updating scheduled content:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la programación",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteScheduledContent = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('scheduled_content')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Eliminado",
        description: "La programación se eliminó correctamente",
      });

      await fetchScheduledContent();
      return true;
    } catch (error) {
      console.error('Error deleting scheduled content:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la programación",
        variant: "destructive"
      });
      return false;
    }
  };

  const getPendingItems = () => scheduledItems.filter(item => !item.is_published);
  const getPublishedItems = () => scheduledItems.filter(item => item.is_published);

  return {
    scheduledItems,
    loading,
    createScheduledContent,
    updateScheduledContent,
    deleteScheduledContent,
    refetch: fetchScheduledContent,
    getPendingItems,
    getPublishedItems,
  };
};
