import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Allowed origins for CORS
const allowedOrigins = [
  'https://vision-hug.lovable.app',
  'https://id-preview--28130d7e-bc45-44d3-ad12-e2972ad3ae99.lovable.app',
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const isAllowed = origin && allowedOrigins.some(allowed => origin === allowed || origin.endsWith('.lovable.app'));
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// Helper to check if ID is a valid UUID
function isValidUUID(id: unknown): boolean {
  if (!id || typeof id !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// Generate a proper UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Clean item for database insertion - remove frontend-only properties and prepare for DB
function prepareItemForDB(item: Record<string, unknown>): { 
  data: Record<string, unknown>; 
  isNew: boolean;
  originalId: string;
} {
  const cleaned: Record<string, unknown> = {};
  const excludeKeys = ['isNew', 'isEditing', 'originalId', 'tempId', '__isNew', 'isDeleted'];
  
  for (const [key, value] of Object.entries(item)) {
    if (!excludeKeys.includes(key)) {
      cleaned[key] = value;
    }
  }
  
  const originalId = (cleaned.id as string) || '';
  
  // Determine if this is a new item:
  // 1. ID is not a valid UUID (temp ID like "new-service-123")
  // 2. created_at is null (explicitly marked as new from frontend)
  const isNew = !isValidUUID(cleaned.id) || cleaned.created_at === null;
  
  // If it's new, generate a proper UUID
  if (isNew) {
    cleaned.id = generateUUID();
    // Remove null created_at so DB will use default
    delete cleaned.created_at;
  }
  
  // Always remove updated_at to let DB handle it
  delete cleaned.updated_at;
  
  return { data: cleaned, isNew, originalId };
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find scheduled content that should be published now
    const now = new Date().toISOString();
    
    const { data: pendingContent, error: fetchError } = await supabase
      .from('scheduled_content')
      .select('*')
      .eq('is_published', false)
      .lte('scheduled_at', now);

    if (fetchError) {
      throw fetchError;
    }

    if (!pendingContent || pendingContent.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No content to publish', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${pendingContent.length} items to publish`);

    const results = [];

    for (const item of pendingContent) {
      try {
        // Apply page_content_snapshot - properly update each section with all fields
        if (item.page_content_snapshot && typeof item.page_content_snapshot === 'object') {
          console.log('Applying page_content_snapshot...');
          
          for (const [section, sectionData] of Object.entries(item.page_content_snapshot)) {
            if (sectionData && typeof sectionData === 'object') {
              const data = sectionData as Record<string, unknown>;
              
              // Build update object with all fields that exist in the snapshot
              const updateFields: Record<string, unknown> = {};
              
              // Text content fields
              if ('title' in data) updateFields.title = data.title ?? null;
              if ('subtitle' in data) updateFields.subtitle = data.subtitle ?? null;
              if ('content' in data) updateFields.content = data.content ?? null;
              
              // Media fields (for hero section primarily)
              if ('image_url' in data) updateFields.image_url = data.image_url ?? null;
              if ('video_url' in data) updateFields.video_url = data.video_url ?? null;
              if ('video_file_url' in data) updateFields.video_file_url = data.video_file_url ?? null;
              if ('media_type' in data) updateFields.media_type = data.media_type ?? null;
              if ('mobile_image_url' in data) updateFields.mobile_image_url = data.mobile_image_url ?? null;
              if ('mobile_video_url' in data) updateFields.mobile_video_url = data.mobile_video_url ?? null;
              if ('mobile_video_file_url' in data) updateFields.mobile_video_file_url = data.mobile_video_file_url ?? null;
              if ('mobile_media_type' in data) updateFields.mobile_media_type = data.mobile_media_type ?? null;
              
              // Only update if we have fields to update
              if (Object.keys(updateFields).length > 0) {
                console.log(`Updating section ${section}`);
                
                const { error: updateError } = await supabase
                  .from('page_content')
                  .update(updateFields)
                  .eq('section', section);
                  
                if (updateError) {
                  console.error(`Error updating section ${section}:`, updateError);
                } else {
                  console.log(`Successfully updated section: ${section}`);
                }
              }
            }
          }
        }

        // Apply services_snapshot - REPLACE all services with snapshot
        if (item.services_snapshot && Array.isArray(item.services_snapshot)) {
          console.log('Applying services_snapshot...');
          
          // Get current service IDs from database
          const { data: currentServices } = await supabase
            .from('services')
            .select('id');
          
          const currentDbIds = new Set(currentServices?.map(s => s.id) || []);
          const snapshotValidIds = new Set<string>();
          
          // Process each item in snapshot
          for (const rawItem of item.services_snapshot) {
            const { data: serviceData, isNew, originalId } = prepareItemForDB(rawItem);
            
            // Remove created_at from update/insert data to let DB handle it
            const { created_at, ...insertData } = serviceData;
            
            if (isNew) {
              // INSERT new service
              console.log(`Inserting new service: ${insertData.title}`);
              const { error: insertError } = await supabase
                .from('services')
                .insert(insertData);
                
              if (insertError) {
                console.error(`Error inserting service:`, insertError);
              } else {
                console.log(`Service inserted with ID: ${insertData.id}`);
              }
            } else {
              // UPDATE existing service
              snapshotValidIds.add(serviceData.id as string);
              console.log(`Updating service: ${serviceData.id}`);
              const { error: updateError } = await supabase
                .from('services')
                .update(insertData)
                .eq('id', serviceData.id);
                
              if (updateError) {
                console.error(`Error updating service ${serviceData.id}:`, updateError);
              }
            }
          }
          
          // Delete services that exist in DB but are not in the snapshot
          for (const dbId of currentDbIds) {
            if (!snapshotValidIds.has(dbId)) {
              console.log(`Deleting service not in snapshot: ${dbId}`);
              const { error: deleteError } = await supabase
                .from('services')
                .delete()
                .eq('id', dbId);
                
              if (deleteError) {
                console.error(`Error deleting service ${dbId}:`, deleteError);
              }
            }
          }
          
          console.log('Services snapshot applied');
        }

        // Apply announcements_snapshot
        if (item.announcements_snapshot && Array.isArray(item.announcements_snapshot)) {
          console.log('Applying announcements_snapshot...');
          
          const { data: currentAnnouncements } = await supabase
            .from('announcements')
            .select('id');
          
          const currentDbIds = new Set(currentAnnouncements?.map(a => a.id) || []);
          const snapshotValidIds = new Set<string>();
          
          for (const rawItem of item.announcements_snapshot) {
            const { data: announcementData, isNew } = prepareItemForDB(rawItem);
            const { created_at, ...insertData } = announcementData;
            
            if (isNew) {
              await supabase.from('announcements').insert(insertData);
              console.log(`Announcement inserted: ${insertData.title}`);
            } else {
              snapshotValidIds.add(announcementData.id as string);
              await supabase
                .from('announcements')
                .update(insertData)
                .eq('id', announcementData.id);
            }
          }
          
          for (const dbId of currentDbIds) {
            if (!snapshotValidIds.has(dbId)) {
              await supabase.from('announcements').delete().eq('id', dbId);
            }
          }
          
          console.log('Announcements snapshot applied');
        }

        // Apply ministries_snapshot
        if (item.ministries_snapshot && Array.isArray(item.ministries_snapshot) && item.ministries_snapshot.length > 0) {
          console.log('Applying ministries_snapshot...');
          
          const { data: currentMinistries } = await supabase
            .from('ministries')
            .select('id');
          
          const currentDbIds = new Set(currentMinistries?.map(m => m.id) || []);
          const snapshotValidIds = new Set<string>();
          
          for (const rawItem of item.ministries_snapshot) {
            const { data: ministryData, isNew } = prepareItemForDB(rawItem);
            const { created_at, ...insertData } = ministryData;
            
            if (isNew) {
              await supabase.from('ministries').insert(insertData);
            } else {
              snapshotValidIds.add(ministryData.id as string);
              await supabase
                .from('ministries')
                .update(insertData)
                .eq('id', ministryData.id);
            }
          }
          
          for (const dbId of currentDbIds) {
            if (!snapshotValidIds.has(dbId)) {
              await supabase.from('ministries').delete().eq('id', dbId);
            }
          }
          
          console.log('Ministries snapshot applied');
        }

        // Apply gallery_snapshot
        if (item.gallery_snapshot && Array.isArray(item.gallery_snapshot) && item.gallery_snapshot.length > 0) {
          console.log('Applying gallery_snapshot...');
          
          const { data: currentGallery } = await supabase
            .from('about_gallery')
            .select('id');
          
          const currentDbIds = new Set(currentGallery?.map(g => g.id) || []);
          const snapshotValidIds = new Set<string>();
          
          for (const rawItem of item.gallery_snapshot) {
            const { data: imageData, isNew } = prepareItemForDB(rawItem);
            const { created_at, ...insertData } = imageData;
            
            if (isNew) {
              await supabase.from('about_gallery').insert(insertData);
            } else {
              snapshotValidIds.add(imageData.id as string);
              await supabase
                .from('about_gallery')
                .update(insertData)
                .eq('id', imageData.id);
            }
          }
          
          for (const dbId of currentDbIds) {
            if (!snapshotValidIds.has(dbId)) {
              await supabase.from('about_gallery').delete().eq('id', dbId);
            }
          }
          
          console.log('Gallery snapshot applied');
        }

        // Apply events_snapshot
        if (item.events_snapshot && Array.isArray(item.events_snapshot)) {
          console.log('Applying events_snapshot...');
          
          const { data: currentEvents } = await supabase
            .from('events')
            .select('id');
          
          const currentDbIds = new Set(currentEvents?.map(e => e.id) || []);
          const snapshotValidIds = new Set<string>();
          
          for (const rawItem of item.events_snapshot) {
            const { data: eventData, isNew } = prepareItemForDB(rawItem);
            const { created_at, ...insertData } = eventData;
            
            if (isNew) {
              await supabase.from('events').insert(insertData);
            } else {
              snapshotValidIds.add(eventData.id as string);
              await supabase
                .from('events')
                .update(insertData)
                .eq('id', eventData.id);
            }
          }
          
          for (const dbId of currentDbIds) {
            if (!snapshotValidIds.has(dbId)) {
              await supabase.from('events').delete().eq('id', dbId);
            }
          }
          
          console.log('Events snapshot applied');
        }

        // Mark as published
        const { error: publishError } = await supabase
          .from('scheduled_content')
          .update({ 
            is_published: true,
            published_at: new Date().toISOString()
          })
          .eq('id', item.id);

        if (publishError) {
          console.error('Error marking as published:', publishError);
        }

        console.log(`Published: ${item.title}`);
        results.push({ id: item.id, title: item.title, status: 'published' });

      } catch (itemError) {
        console.error(`Error publishing ${item.id}:`, itemError);
        results.push({ id: item.id, title: item.title, status: 'error', error: String(itemError) });
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Publishing complete', 
        count: results.filter(r => r.status === 'published').length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const origin = req.headers.get('Origin');
    const corsHeaders = getCorsHeaders(origin);
    console.error('Error in publish-scheduled-content:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});