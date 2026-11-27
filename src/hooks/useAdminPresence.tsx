import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface AdminPresenceState {
  [key: string]: {
    user_id: string;
    email: string;
    online_at: string;
  }[];
}

export const useAdminPresence = (userId: string | undefined, userEmail: string | undefined) => {
  const [onlineAdmins, setOnlineAdmins] = useState<number>(0);
  const [adminList, setAdminList] = useState<{ user_id: string; email: string; online_at: string }[]>([]);

  useEffect(() => {
    if (!userId || !userEmail) return;

    let channel: RealtimeChannel;

    const setupPresence = async () => {
      channel = supabase.channel('admin_presence', {
        config: {
          presence: {
            key: userId,
          },
        },
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState() as AdminPresenceState;
          const allAdmins: { user_id: string; email: string; online_at: string }[] = [];
          
          Object.values(state).forEach((presences) => {
            presences.forEach((presence) => {
              if (!allAdmins.some(a => a.user_id === presence.user_id)) {
                allAdmins.push(presence);
              }
            });
          });
          
          setAdminList(allAdmins);
          setOnlineAdmins(allAdmins.length);
        })
        .on('presence', { event: 'join' }, ({ newPresences }) => {
          console.log('Admin joined:', newPresences);
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          console.log('Admin left:', leftPresences);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              user_id: userId,
              email: userEmail,
              online_at: new Date().toISOString(),
            });
          }
        });
    };

    setupPresence();

    return () => {
      if (channel) {
        channel.untrack();
        supabase.removeChannel(channel);
      }
    };
  }, [userId, userEmail]);

  return { onlineAdmins, adminList };
};
