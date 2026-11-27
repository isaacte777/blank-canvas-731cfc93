import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook that listens for scheduled content publications
 * and triggers a page reload for visitors when content is published
 */
export const useContentPublishListener = (enabled: boolean = true) => {
  const { toast } = useToast();
  const lastPublishedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    console.log('Content publish listener enabled, subscribing...');

    // Subscribe to scheduled_content changes - listen to ALL updates, not filtered
    const channel = supabase
      .channel('content_publish_listener_v2')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'scheduled_content'
        },
        (payload) => {
          console.log('Scheduled content updated:', payload);
          
          const newData = payload.new as { id: string; is_published: boolean; title: string };
          const oldData = payload.old as { is_published: boolean } | null;
          
          // Check if this update was transitioning to published
          // and we haven't already handled this publication
          if (newData?.is_published && (!oldData || !oldData.is_published)) {
            if (lastPublishedRef.current === newData.id) {
              console.log('Already handled this publication, skipping');
              return;
            }
            
            lastPublishedRef.current = newData.id;
            
            console.log('Content just published! Showing toast and reloading...');
            toast({
              title: "🔄 Contenido actualizado",
              description: `"${newData.title}" se ha publicado. Actualizando página...`,
              duration: 3000,
            });

            // Wait a moment for the toast to show, then reload
            setTimeout(() => {
              window.location.reload();
            }, 2500);
          }
        }
      )
      .subscribe((status) => {
        console.log('Content publish listener subscription status:', status);
      });

    return () => {
      console.log('Cleaning up content publish listener');
      supabase.removeChannel(channel);
    };
  }, [enabled, toast]);
};
