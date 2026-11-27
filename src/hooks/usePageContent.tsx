import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_ABOUT, DEFAULT_ABOUT_FIELDS, DEFAULT_CONTACT, DEFAULT_CONTACT_FIELDS } from '@/lib/contentDefaults';

interface PageContent {
  id: string;
  section: string;
  title: string | null;
  subtitle: string | null;
  content: string | null;
  image_url: string | null;
  is_visible: boolean;
}

interface Service {
  id: string;
  title: string;
  description: string | null;
  day: string | null;
  time: string | null;
  icon: string | null;
  is_visible: boolean;
  display_order: number;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  location: string | null;
  is_visible: boolean;
}

interface Announcement {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  is_visible: boolean;
  display_order: number;
}

interface GalleryImage {
  id: string;
  image_url: string;
  position: number;
  alt_text: string | null;
  is_visible: boolean;
}

interface Ministry {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  icon: string | null;
  is_visible: boolean;
  display_order: number;
}

interface FooterFields {
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  emailUrl: string;
  liveStreamUrl: string;
  whatsappNumber: string;
}

interface BrandingFields {
  logoUrl: string;
}

interface PrayerFields {
  title: string;
  subtitle: string;
  schedule: string;
  time: string;
  buttonText: string;
  buttonUrl: string;
  backgroundImage: string;
}

interface QuoteFields {
  quote: string;
  author: string;
  imageUrl: string;
}

interface AboutExtraFields {
  firstParagraph: string;
  secondParagraph: string;
  value1Title: string;
  value1Desc: string;
  value2Title: string;
  value2Desc: string;
  value3Title: string;
  value3Desc: string;
  stat1Value: string;
  stat1Label: string;
  stat2Value: string;
  stat2Label: string;
  stat3Value: string;
  stat3Label: string;
}

interface ContactExtraFields {
  addressLabel: string;
  addressLine1: string;
  addressLine2: string;
  phoneLabel: string;
  phoneLine1: string;
  phoneLine2: string;
  emailLabel: string;
  emailLine1: string;
  emailLine2: string;
  mapUrl: string;
}

export const usePageContent = () => {
  const [content, setContent] = useState<Record<string, PageContent>>({});
  const [services, setServices] = useState<Service[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [aboutGallery, setAboutGallery] = useState<GalleryImage[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [footerFields, setFooterFields] = useState<FooterFields>({
    facebookUrl: '',
    instagramUrl: '',
    youtubeUrl: '',
    emailUrl: '',
    liveStreamUrl: '',
    whatsappNumber: ''
  });
  const [brandingFields, setBrandingFields] = useState<BrandingFields>({
    logoUrl: ''
  });
  const [prayerFields, setPrayerFields] = useState<PrayerFields>({
    title: '',
    subtitle: '',
    schedule: '',
    time: '',
    buttonText: '',
    buttonUrl: '',
    backgroundImage: ''
  });
  const [quoteFields, setQuoteFields] = useState<QuoteFields>({
    quote: '',
    author: '',
    imageUrl: ''
  });
  const [aboutExtraFields, setAboutExtraFields] = useState<AboutExtraFields>({
    ...DEFAULT_ABOUT_FIELDS
  });
  const [contactExtraFields, setContactExtraFields] = useState<ContactExtraFields>({
    ...DEFAULT_CONTACT_FIELDS
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const [contentRes, servicesRes, eventsRes, announcementsRes, galleryRes, ministriesRes] = await Promise.all([
        supabase.from('page_content').select('*'),
        supabase.from('services').select('*').eq('is_visible', true).order('display_order'),
        supabase.from('events').select('*').eq('is_visible', true).order('event_date'),
        supabase.from('announcements').select('*').eq('is_visible', true).order('display_order'),
        supabase.from('about_gallery').select('*').eq('is_visible', true).order('position'),
        supabase.from('ministries').select('*').eq('is_visible', true).order('display_order')
      ]);

      if (contentRes.data) {
        const contentMap: Record<string, PageContent> = {};
        contentRes.data.forEach((item) => {
          contentMap[item.section] = item;
        });
        // Restaurar títulos principales si la base no los tiene guardados
        if (contentMap.about) {
          contentMap.about.title = contentMap.about.title || DEFAULT_ABOUT.title;
          contentMap.about.subtitle = contentMap.about.subtitle || DEFAULT_ABOUT.subtitle;
        }
        if (contentMap.contact) {
          contentMap.contact.title = contentMap.contact.title || DEFAULT_CONTACT.title;
          contentMap.contact.subtitle = contentMap.contact.subtitle || DEFAULT_CONTACT.subtitle;
        }
        setContent(contentMap);
        
        // Parse footer fields from JSON
        if (contentMap.footer?.content) {
          try {
            const parsed = JSON.parse(contentMap.footer.content);
            setFooterFields({
              facebookUrl: parsed.facebookUrl || '',
              instagramUrl: parsed.instagramUrl || '',
              youtubeUrl: parsed.youtubeUrl || '',
              emailUrl: parsed.emailUrl || '',
              liveStreamUrl: parsed.liveStreamUrl || '',
              whatsappNumber: parsed.whatsappNumber || ''
            });
          } catch {
            // If content is not JSON, keep default empty fields
          }
        }

        // Parse prayer fields
        if (contentMap.prayer) {
          try {
            const parsed = contentMap.prayer.content ? JSON.parse(contentMap.prayer.content) : {};
            setPrayerFields({
              title: contentMap.prayer.title || 'ORACIÓN',
              subtitle: contentMap.prayer.subtitle || 'CONGREGACIONAL',
              schedule: parsed.schedule || 'Lunes a Viernes',
              time: parsed.time || '05:30 hs',
              buttonText: parsed.buttonText || 'PARTICIPAR',
              buttonUrl: parsed.buttonUrl || '#contacto',
              backgroundImage: contentMap.prayer.image_url || ''
            });
          } catch {
            // Keep defaults
          }
        }

        // Parse branding fields (logo)
        if (contentMap.branding) {
          setBrandingFields({
            logoUrl: contentMap.branding.image_url || ''
          });
        }

        // Parse quote fields
        if (contentMap.quote) {
          setQuoteFields({
            quote: contentMap.quote.title || 'Dios quiere hacer algo en tu vida pero necesita que le escuches',
            author: contentMap.quote.subtitle || 'Pra. Bethany Abreu',
            imageUrl: contentMap.quote.content || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=600&fit=crop&crop=face'
          });
        }

        // Parse about extra fields from content JSON
        if (contentMap.about?.content) {
          try {
            const parsed = JSON.parse(contentMap.about.content);
            setAboutExtraFields({
              firstParagraph: parsed.firstParagraph || DEFAULT_ABOUT_FIELDS.firstParagraph,
              secondParagraph: parsed.secondParagraph || DEFAULT_ABOUT_FIELDS.secondParagraph,
              value1Title: parsed.value1Title || DEFAULT_ABOUT_FIELDS.value1Title,
              value1Desc: parsed.value1Desc || DEFAULT_ABOUT_FIELDS.value1Desc,
              value2Title: parsed.value2Title || DEFAULT_ABOUT_FIELDS.value2Title,
              value2Desc: parsed.value2Desc || DEFAULT_ABOUT_FIELDS.value2Desc,
              value3Title: parsed.value3Title || DEFAULT_ABOUT_FIELDS.value3Title,
              value3Desc: parsed.value3Desc || DEFAULT_ABOUT_FIELDS.value3Desc,
              stat1Value: parsed.stat1Value || DEFAULT_ABOUT_FIELDS.stat1Value,
              stat1Label: parsed.stat1Label || DEFAULT_ABOUT_FIELDS.stat1Label,
              stat2Value: parsed.stat2Value || DEFAULT_ABOUT_FIELDS.stat2Value,
              stat2Label: parsed.stat2Label || DEFAULT_ABOUT_FIELDS.stat2Label,
              stat3Value: parsed.stat3Value || DEFAULT_ABOUT_FIELDS.stat3Value,
              stat3Label: parsed.stat3Label || DEFAULT_ABOUT_FIELDS.stat3Label
            });
          } catch {
            // Keep defaults
          }
        }

        // Parse contact extra fields from content JSON
        if (contentMap.contact?.content) {
          try {
            const parsed = JSON.parse(contentMap.contact.content);
            setContactExtraFields({
              addressLabel: parsed.addressLabel || DEFAULT_CONTACT_FIELDS.addressLabel,
              addressLine1: parsed.addressLine1 || DEFAULT_CONTACT_FIELDS.addressLine1,
              addressLine2: parsed.addressLine2 || DEFAULT_CONTACT_FIELDS.addressLine2,
              phoneLabel: parsed.phoneLabel || DEFAULT_CONTACT_FIELDS.phoneLabel,
              phoneLine1: parsed.phoneLine1 || DEFAULT_CONTACT_FIELDS.phoneLine1,
              phoneLine2: parsed.phoneLine2 || DEFAULT_CONTACT_FIELDS.phoneLine2,
              emailLabel: parsed.emailLabel || DEFAULT_CONTACT_FIELDS.emailLabel,
              emailLine1: parsed.emailLine1 || DEFAULT_CONTACT_FIELDS.emailLine1,
              emailLine2: parsed.emailLine2 || DEFAULT_CONTACT_FIELDS.emailLine2,
              mapUrl: parsed.mapUrl || DEFAULT_CONTACT_FIELDS.mapUrl
            });
          } catch {
            // Keep defaults
          }
        }
      }

      if (servicesRes.data) setServices(servicesRes.data);
      if (eventsRes.data) setEvents(eventsRes.data);
      if (announcementsRes.data) setAnnouncements(announcementsRes.data);
      if (galleryRes.data) setAboutGallery(galleryRes.data);
      if (ministriesRes.data) setMinistries(ministriesRes.data);
    } catch (error) {
      console.error('Error fetching content:', error);
    }
    setLoading(false);
  };

  return { content, services, events, announcements, aboutGallery, ministries, footerFields, brandingFields, prayerFields, quoteFields, aboutExtraFields, contactExtraFields, loading, refetch: fetchContent };
};
