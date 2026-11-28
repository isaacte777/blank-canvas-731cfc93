import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useColorPalette } from '@/hooks/useColorPalette';
import { useImageUpload } from '@/hooks/useImageUpload';
import { ManageAdminsDialog } from '@/components/ManageAdminsDialog';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { useAdminPresence } from '@/hooks/useAdminPresence';
import {
  DEFAULT_ABOUT,
  DEFAULT_ABOUT_FIELDS,
  DEFAULT_CONTACT,
  DEFAULT_CONTACT_FIELDS,
  DEFAULT_FOOTER_FIELDS,
  DEFAULT_PRAYER_FIELDS,
  DEFAULT_QUOTE_FIELDS,
  DEFAULT_SERVICES,
  DEFAULT_ANNOUNCEMENTS,
  DEFAULT_MINISTRIES,
  DEFAULT_SECTION_HEADERS,
  type SectionHeaderKey,
} from '@/lib/contentDefaults';
import { 
  Loader2, 
  LogOut, 
  Church, 
  Home,
  X,
  Save,
  Edit3,
  Plus,
  Trash2,
  Calendar,
  MapPin,
  Clock,
  Users,
  BookOpen,
  Heart,
  Palette,
  RotateCcw,
  Upload,
  Image as ImageIcon,
  Video,
  Eye,
  Type,
  FileText,
  Layout,
  MessageCircle,
  CreditCard,
  BarChart3,
  Monitor,
  Smartphone,
  Check,
  CheckCircle2,
  // Additional icons for services
  Music,
  Baby,
  GraduationCap,
  Flame,
  Sun,
  Moon,
  Star,
  Crown,
  Cross,
  HandHeart,
  Handshake,
  Globe,
  Megaphone,
  Mic2,
  Radio,
  Tv,
  Camera,
  PenTool,
  Lightbulb,
  Coffee,
  Gift,
  PartyPopper,
  Sparkles,
  Umbrella,
  TreePine,
  Mountain,
  Waves,
  type LucideIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { format, isToday, isTomorrow, isPast, differenceInDays, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

import communityImage from "@/assets/community.jpg";
import cfaAdminLogo from "@/assets/cfa-admin-logo.png";
import { convertToYouTubeEmbedUrl } from "@/lib/youtubeHelper";

// Import real page components
import { Hero, HeroConfig, defaultHeroConfig, HeroMedia, defaultHeroMedia } from '@/components/Hero';
import { About, GalleryImage } from '@/components/About';
import { Services } from '@/components/Services';
import { Announcements, Announcement } from '@/components/Announcements';
import { Contact } from '@/components/Contact';
import { Footer } from '@/components/Footer';
import { NavigationPreview } from '@/components/NavigationPreview';
import { EditableWrapper } from '@/components/admin/EditableWrapper';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { MinistryEditor } from '@/components/admin/MinistryEditor';
import { WelcomeDialog } from '@/components/admin/WelcomeDialog';
import { FloatingColorPalette } from '@/components/admin/FloatingColorPalette';
import { ScheduledContentCalendar } from '@/components/admin/ScheduledContentCalendar';
import { PrayerBanner } from '@/components/PrayerBanner';
import { QuoteSection } from '@/components/QuoteSection';
import { useScheduledContent, ContentSnapshot } from '@/hooks/useScheduledContent';
import { Ministries } from '@/components/Ministries';

interface PageContent {
  id: string;
  section: string;
  title: string | null;
  subtitle: string | null;
  content: string | null;
  image_url: string | null;
  video_url?: string | null;
  video_file_url?: string | null;
  media_type?: string | null;
  mobile_video_url?: string | null;
  mobile_image_url?: string | null;
  mobile_video_file_url?: string | null;
  mobile_media_type?: string | null;
  is_visible: boolean;
}


interface Service {
  id: string;
  title: string;
  description: string | null;
  extended_content?: string | null;
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
  image_url: string | null;
  is_visible: boolean;
}

interface Ministry {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content: string | null;
  image_url: string | null;
  icon: string | null;
  schedule: string | null;
  leader: string | null;
  is_visible: boolean;
  display_order: number;
}

type EditField = 'title' | 'subtitle' | 'content' | 'media' | 'all';

// Extended icon map with 30 church/ministry related icons
const iconMap: Record<string, LucideIcon> = {
  Church,
  BookOpen,
  Users,
  Heart,
  Calendar,
  Clock,
  Music,
  Baby,
  GraduationCap,
  Flame,
  Sun,
  Moon,
  Star,
  Crown,
  Cross,
  HandHeart,
  Handshake,
  Globe,
  Megaphone,
  Mic2,
  Radio,
  Tv,
  Camera,
  PenTool,
  Lightbulb,
  Coffee,
  Gift,
  PartyPopper,
  Sparkles,
  Umbrella
};

// Icon display names for the selector
const iconLabels: Record<string, string> = {
  Church: 'Iglesia',
  BookOpen: 'Biblia',
  Users: 'Comunidad',
  Heart: 'Amor',
  Calendar: 'Calendario',
  Clock: 'Reloj',
  Music: 'Música',
  Baby: 'Niños',
  GraduationCap: 'Educación',
  Flame: 'Espíritu',
  Sun: 'Mañana',
  Moon: 'Noche',
  Star: 'Estrella',
  Crown: 'Rey',
  Cross: 'Cruz',
  HandHeart: 'Servicio',
  Handshake: 'Bienvenida',
  Globe: 'Misiones',
  Megaphone: 'Anuncio',
  Mic2: 'Predicación',
  Radio: 'Radio',
  Tv: 'Transmisión',
  Camera: 'Multimedia',
  PenTool: 'Creatividad',
  Lightbulb: 'Ideas',
  Coffee: 'Comunión',
  Gift: 'Ofrenda',
  PartyPopper: 'Celebración',
  Sparkles: 'Milagros',
  Umbrella: 'Protección'
};

const Admin = () => {
  const { user, isAdmin, isPastor, loading, rolesLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { colors, previewColors, saveColors, resetColors, revertColors, defaultColors } = useColorPalette();
  const { uploadImage, uploadVideo, uploading } = useImageUpload();
  const { createScheduledContent, refetch: refetchScheduledContent, scheduledItems } = useScheduledContent();
  
  const [pageContent, setPageContent] = useState<Record<string, PageContent>>({});
  const [services, setServices] = useState<Service[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [aboutGallery, setAboutGallery] = useState<GalleryImage[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [pendingSuggestionsCount, setPendingSuggestionsCount] = useState(0);
  const [pendingSuggestions, setPendingSuggestions] = useState<Array<{id: string; title: string; description: string | null; priority: string | null; suggestion_type: string; target_date: string | null; target_time: string | null}>>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [confirmingComplete, setConfirmingComplete] = useState<string | null>(null);
  const [confirmStep, setConfirmStep] = useState<1 | 2>(1);
  const [dataLoading, setDataLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const hasInitiallyLoaded = useRef(false);
  const [saving, setSaving] = useState(false);
  
  // Hero config state - stored as JSON in hero.content
  const [heroConfig, setHeroConfig] = useState<HeroConfig>(defaultHeroConfig);
  const [heroMedia, setHeroMedia] = useState<HeroMedia>(defaultHeroMedia);
  
  // Pending changes state - tracks unsaved edits
  const [pendingHeroConfig, setPendingHeroConfig] = useState<HeroConfig>(defaultHeroConfig);
  const [pendingHeroMedia, setPendingHeroMedia] = useState<HeroMedia>(defaultHeroMedia);
  const [pendingPageContent, setPendingPageContent] = useState<Record<string, Partial<PageContent>>>({});
  const [pendingServices, setPendingServices] = useState<Map<string, Partial<Service>>>(new Map());
  const [pendingAnnouncementChanges, setPendingAnnouncementChanges] = useState<Map<string, Partial<Announcement> & { isNew?: boolean; isDeleted?: boolean }>>(new Map());
  const [pendingMinistryChanges, setPendingMinistryChanges] = useState<Map<string, Partial<Ministry> & { isNew?: boolean; isDeleted?: boolean }>>(new Map());
  const [editingMinistryId, setEditingMinistryId] = useState<string | null>(null);
  const [showAddMinistry, setShowAddMinistry] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Color palette state - pending colors before save
  const [pendingColors, setPendingColors] = useState(colors);
  const [hasColorChanges, setHasColorChanges] = useState(false);
  
  // Modal states
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<EditField>('all');
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [showAddAnnouncement, setShowAddAnnouncement] = useState(false);
  const [showAddService, setShowAddService] = useState(false);
  const [pendingServiceChanges, setPendingServiceChanges] = useState<Map<string, Partial<Service> & { isNew?: boolean; isDeleted?: boolean }>>(new Map());
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [showColorPanel, setShowColorPanel] = useState(false);
  const [showScheduleCalendar, setShowScheduleCalendar] = useState(false);
  
  // Scheduled mode state
  const [isScheduledMode, setIsScheduledMode] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState<Date | null>(null);
  const [scheduledTitle, setScheduledTitle] = useState('');
  
  // Gallery editing state
  const [editingGalleryImage, setEditingGalleryImage] = useState<GalleryImage | null>(null);
  const [galleryImageForm, setGalleryImageForm] = useState({ image_url: '', alt_text: '' });
  const galleryImageRef = useRef<HTMLInputElement>(null);
  
  // Announcement form state
  const [announcementForm, setAnnouncementForm] = useState({ title: '', description: '', image_url: '' });
  const announcementImageRef = useRef<HTMLInputElement>(null);

  // Auto-logout after 5 minutes of inactivity
  const handleIdleLogout = useCallback(async () => {
    toast({
      title: "Sesión expirada",
      description: "Se cerró la sesión por inactividad",
    });
    await signOut();
    navigate('/auth');
  }, [signOut, navigate, toast]);

  useIdleTimeout({
    timeout: 5 * 60 * 1000, // 5 minutos
    onIdle: handleIdleLogout,
    enabled: !!user && isAdmin
  });

  // Admin presence tracking
  const { onlineAdmins, adminList } = useAdminPresence(user?.id, user?.email);
  // Preview viewport mode
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  // Sidebar tab state
  const [sidebarTab, setSidebarTab] = useState<'colors' | 'suggestions'>('colors');
  
  const [showHeroEditor, setShowHeroEditor] = useState(false);
  const [heroForm, setHeroForm] = useState<HeroConfig>(defaultHeroConfig);
  const [heroMediaForm, setHeroMediaForm] = useState<HeroMedia>(defaultHeroMedia);
  
  // About section editing
  const [editingAboutField, setEditingAboutField] = useState<string | null>(null);
  const [aboutFieldValue, setAboutFieldValue] = useState('');
  const [editingSectionHeader, setEditingSectionHeader] = useState<{ section: SectionHeaderKey; field: 'title' | 'subtitle' } | null>(null);
  const [sectionHeaderValue, setSectionHeaderValue] = useState('');
  const [pendingSectionHeaders, setPendingSectionHeaders] = useState<Partial<Record<SectionHeaderKey, { title?: string; subtitle?: string }>>>({});
  const [aboutExtraFields, setAboutExtraFields] = useState({
    ...DEFAULT_ABOUT_FIELDS
  });

  // Contact section editing
  const [editingContactField, setEditingContactField] = useState<string | null>(null);
  const [contactFieldValue, setContactFieldValue] = useState('');
  const [contactExtraFields, setContactExtraFields] = useState({
    ...DEFAULT_CONTACT_FIELDS
  });

  // Footer section editing
  const [editingFooterField, setEditingFooterField] = useState<string | null>(null);
  const [footerFieldValue, setFooterFieldValue] = useState('');
  const [footerFields, setFooterFields] = useState({
    ...DEFAULT_FOOTER_FIELDS
  });

  // Branding (logo) editing
  const [brandingFields, setBrandingFields] = useState({
    logoUrl: ''
  });
  const [pendingBrandingFields, setPendingBrandingFields] = useState<{ logoUrl: string } | null>(null);
  const logoImageRef = useRef<HTMLInputElement>(null);

  // Prayer Banner editing
  const [showPrayerEditor, setShowPrayerEditor] = useState(false);
  const [prayerFields, setPrayerFields] = useState({
    ...DEFAULT_PRAYER_FIELDS
  });
  const [pendingPrayerFields, setPendingPrayerFields] = useState<typeof prayerFields | null>(null);
  const prayerImageRef = useRef<HTMLInputElement>(null);

  // Quote Section editing
  const [showQuoteEditor, setShowQuoteEditor] = useState(false);
  const [quoteFields, setQuoteFields] = useState({
    ...DEFAULT_QUOTE_FIELDS
  });
  const [pendingQuoteFields, setPendingQuoteFields] = useState<typeof quoteFields | null>(null);
  const quoteImageRef = useRef<HTMLInputElement>(null);
  
  // Gallery pending changes
  const [pendingGalleryChanges, setPendingGalleryChanges] = useState<Map<string, { image_url: string; alt_text: string }>>(new Map());
  
  // Form states
  const [formData, setFormData] = useState({ 
    title: '', 
    subtitle: '', 
    content: '', 
    image_url: '',
    video_url: '',
    media_type: 'video' as 'video' | 'image' | 'video_file',
    video_file_url: ''
  });
  const [serviceForm, setServiceForm] = useState({ title: '', description: '', extended_content: '', day: '', time: '', icon: 'Church' });
  const [eventForm, setEventForm] = useState({ title: '', description: '', event_date: '', event_time: '', location: '', image_url: '' });
  
  // File input refs
  const sectionImageRef = useRef<HTMLInputElement>(null);
  const heroImageRef = useRef<HTMLInputElement>(null);
  const heroVideoRef = useRef<HTMLInputElement>(null);
  const heroMobileImageRef = useRef<HTMLInputElement>(null);
  const heroMobileVideoRef = useRef<HTMLInputElement>(null);
  const eventImageRef = useRef<HTMLInputElement>(null);
  const aboutImageRef = useRef<HTMLInputElement>(null);
  
  // Hero editor device tab state
  const [heroDeviceTab, setHeroDeviceTab] = useState<'desktop' | 'mobile'>('desktop');
  
  // About image editing
  const [showAboutImageEditor, setShowAboutImageEditor] = useState(false);
  const [aboutImageUrl, setAboutImageUrl] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && isAdmin && !hasInitiallyLoaded.current) {
      hasInitiallyLoaded.current = true;
      fetchData();
      
      // Subscribe to realtime updates for suggestions count
      const suggestionsChannel = supabase
        .channel('admin-suggestions-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'admin_suggestions'
          },
          async () => {
            // Refetch suggestions when they change
            const { data, count } = await supabase
              .from('admin_suggestions')
              .select('id, title, description, priority, suggestion_type, target_date, target_time', { count: 'exact' })
              .eq('is_completed', false)
              .order('target_date', { ascending: true, nullsFirst: false })
              .order('priority', { ascending: false })
              .limit(5);
            if (count !== null) {
              setPendingSuggestionsCount(count);
            }
            if (data) {
              setPendingSuggestions(data);
            }
          }
        )
        .subscribe();
      
      // Subscribe to realtime updates for unread messages count
      const messagesChannel = supabase
        .channel('admin-messages-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'contact_messages'
          },
          async () => {
            // Refetch unread messages count when they change
            const { count } = await supabase
              .from('contact_messages')
              .select('id', { count: 'exact', head: true })
              .eq('is_read', false);
            if (count !== null) {
              setUnreadMessagesCount(count);
            }
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(suggestionsChannel);
        supabase.removeChannel(messagesChannel);
      };
    }
  }, [user, isAdmin]);

  useEffect(() => {
    setPendingColors(colors);
  }, [colors]);

  const fetchData = async (forceResetPending = false) => {
    // Only show loading spinner on initial load, not on subsequent fetches
    if (!initialLoadComplete) {
      setDataLoading(true);
    }
    try {
    const [contentRes, servicesRes, announcementsRes, ministriesRes, galleryRes, suggestionsRes, messagesRes] = await Promise.all([
        supabase.from('page_content').select('*'),
        supabase.from('services').select('*').order('display_order'),
        supabase.from('announcements').select('*').order('display_order'),
        supabase.from('ministries').select('*').order('display_order'),
        supabase.from('about_gallery').select('*').order('position'),
        supabase.from('admin_suggestions').select('id, title, description, priority, suggestion_type, target_date, target_time', { count: 'exact' }).eq('is_completed', false).order('target_date', { ascending: true, nullsFirst: false }).order('priority', { ascending: false }).limit(5),
        supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('is_read', false)
      ]);
      
      // Update pending suggestions
      if (suggestionsRes.count !== null) {
        setPendingSuggestionsCount(suggestionsRes.count);
      }
      if (suggestionsRes.data) {
        setPendingSuggestions(suggestionsRes.data);
      }
      
      // Update unread messages count
      if (messagesRes.count !== null) {
        setUnreadMessagesCount(messagesRes.count);
      }

      console.log('Fetched page_content:', contentRes.data);

      if (contentRes.data) {
        const contentMap: Record<string, PageContent> = {};
        contentRes.data.forEach((item) => {
          if (item.section !== 'colors') {
            contentMap[item.section] = item;
          }
        });
        
        console.log('Content map:', contentMap);
        console.log('Hero ID:', contentMap.hero?.id);
        console.log('About ID:', contentMap.about?.id);
        console.log('Contact ID:', contentMap.contact?.id);

        // Restaurar títulos principales si la base no los tiene guardados
        if (contentMap.about) {
          contentMap.about.title = contentMap.about.title || DEFAULT_ABOUT.title;
          contentMap.about.subtitle = contentMap.about.subtitle || DEFAULT_ABOUT.subtitle;
        }
        if (contentMap.contact) {
          contentMap.contact.title = contentMap.contact.title || DEFAULT_CONTACT.title;
          contentMap.contact.subtitle = contentMap.contact.subtitle || DEFAULT_CONTACT.subtitle;
        }

        setPageContent(contentMap);
        
        // Load hero config from hero.content (JSON)
        if (contentMap.hero?.content) {
          try {
            const parsed = JSON.parse(contentMap.hero.content);
            const config = { ...defaultHeroConfig, ...parsed };
            setHeroConfig(config);
            setPendingHeroConfig(config);
            console.log('Loaded hero config:', config);
          } catch {
            // If content is not JSON, keep default config
            setHeroConfig(defaultHeroConfig);
            setPendingHeroConfig(defaultHeroConfig);
          }
        }
        
        // Load hero media settings
        if (contentMap.hero) {
          const dbVideoUrl = contentMap.hero.video_url || '';
          const dbVideoFileUrl = contentMap.hero.video_file_url || '';
          const dbImageUrl = contentMap.hero.image_url || '';
          const wanted = (contentMap.hero.media_type as 'video' | 'image' | 'video_file') || '';
          // Usa el tipo pedido solo si tiene contenido; si no, cae al video de respaldo
          let mediaType: 'video' | 'image' | 'video_file';
          if (wanted === 'video') mediaType = dbVideoUrl ? 'video' : defaultHeroMedia.mediaType;
          else if (wanted === 'video_file') mediaType = dbVideoFileUrl ? 'video_file' : defaultHeroMedia.mediaType;
          else if (wanted === 'image') mediaType = dbImageUrl ? 'image' : dbVideoUrl ? 'video' : dbVideoFileUrl ? 'video_file' : defaultHeroMedia.mediaType;
          else mediaType = dbVideoUrl ? 'video' : dbVideoFileUrl ? 'video_file' : dbImageUrl ? 'image' : defaultHeroMedia.mediaType;
          const media: HeroMedia = {
            mediaType,
            videoUrl: dbVideoUrl,
            imageUrl: dbImageUrl,
            videoFileUrl: dbVideoFileUrl || defaultHeroMedia.videoFileUrl,
            mobileMediaType: (contentMap.hero.mobile_media_type as 'video' | 'image' | 'video_file') || undefined,
            mobileVideoUrl: contentMap.hero.mobile_video_url || '',
            mobileImageUrl: contentMap.hero.mobile_image_url || '',
            mobileVideoFileUrl: contentMap.hero.mobile_video_file_url || ''
          };
          setHeroMedia(media);
          setPendingHeroMedia(media);
        }
        
        // Load footer fields from footer.content (JSON)
        if (contentMap.footer?.content) {
          try {
            const parsed = JSON.parse(contentMap.footer.content);
            setFooterFields({
              facebookUrl: parsed.facebookUrl || DEFAULT_FOOTER_FIELDS.facebookUrl,
              instagramUrl: parsed.instagramUrl || DEFAULT_FOOTER_FIELDS.instagramUrl,
              youtubeUrl: parsed.youtubeUrl || DEFAULT_FOOTER_FIELDS.youtubeUrl,
              emailUrl: parsed.emailUrl || DEFAULT_FOOTER_FIELDS.emailUrl,
              liveStreamUrl: parsed.liveStreamUrl || DEFAULT_FOOTER_FIELDS.liveStreamUrl,
              whatsappNumber: parsed.whatsappNumber || DEFAULT_FOOTER_FIELDS.whatsappNumber
            });
            console.log('Loaded footer fields:', parsed);
          } catch {
            // If content is not JSON, keep default empty fields
          }
        }

        // Load prayer banner fields from prayer section
        if (contentMap.prayer) {
          try {
            const parsed = contentMap.prayer.content ? JSON.parse(contentMap.prayer.content) : {};
            setPrayerFields({
              title: contentMap.prayer.title || DEFAULT_PRAYER_FIELDS.title,
              subtitle: contentMap.prayer.subtitle || DEFAULT_PRAYER_FIELDS.subtitle,
              schedule: parsed.schedule || DEFAULT_PRAYER_FIELDS.schedule,
              time: parsed.time || DEFAULT_PRAYER_FIELDS.time,
              buttonText: parsed.buttonText || DEFAULT_PRAYER_FIELDS.buttonText,
              buttonUrl: parsed.buttonUrl || DEFAULT_PRAYER_FIELDS.buttonUrl,
              backgroundImage: contentMap.prayer.image_url || DEFAULT_PRAYER_FIELDS.backgroundImage
            });
          } catch {
            // Keep defaults
          }
        }

        // Load quote section fields
        if (contentMap.quote) {
          setQuoteFields({
            quote: contentMap.quote.title || DEFAULT_QUOTE_FIELDS.quote,
            author: contentMap.quote.subtitle || DEFAULT_QUOTE_FIELDS.author,
            imageUrl: contentMap.quote.content || DEFAULT_QUOTE_FIELDS.imageUrl
          });
        }

        // Load branding fields (logo)
        if (contentMap.branding) {
          const brandingData = {
            logoUrl: contentMap.branding.image_url || ''
          };
          setBrandingFields(brandingData);
        }

        // Load about extra fields from about.content (JSON)
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
              stat3Label: parsed.stat3Label || DEFAULT_ABOUT_FIELDS.stat3Label,
              marqueeText: parsed.marqueeText || DEFAULT_ABOUT_FIELDS.marqueeText
            });
            console.log('Loaded about extra fields:', parsed);
          } catch {
            // If content is not JSON, keep default empty fields
          }
        }

        // Load contact extra fields from contact.content (JSON)
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
            console.log('Loaded contact extra fields:', parsed);
          } catch {
            // If content is not JSON, keep default empty fields
          }
        }
        
        // Initialize pending content with current values ONLY if no unsaved changes or forced
        if (forceResetPending || !hasUnsavedChanges) {
          const pendingContent: Record<string, Partial<PageContent>> = {};
          Object.keys(contentMap).forEach(section => {
            pendingContent[section] = {
              title: contentMap[section].title,
              subtitle: contentMap[section].subtitle,
              content: contentMap[section].content
            };
          });
          setPendingPageContent(pendingContent);
          setHasUnsavedChanges(false);
        }
      }
      // Si las tablas están vacías (proyecto nuevo), restaurar desde los respaldos
      let servicesList = servicesRes.data || [];
      if (!servicesList.length) {
        const { data: seeded, error: seedError } = await supabase.from('services').insert(DEFAULT_SERVICES).select();
        if (seedError) console.warn('No se pudieron restaurar servicios:', seedError.message);
        if (seeded?.length) servicesList = seeded;
      }
      let announcementsList = announcementsRes.data || [];
      if (!announcementsList.length) {
        const { data: seeded, error: seedError } = await supabase.from('announcements').insert(DEFAULT_ANNOUNCEMENTS).select();
        if (seedError) console.warn('No se pudieron restaurar anuncios:', seedError.message);
        if (seeded?.length) announcementsList = seeded;
      }
      let ministriesList = ministriesRes.data || [];
      if (!ministriesList.length) {
        const { data: seeded, error: seedError } = await supabase.from('ministries').insert(DEFAULT_MINISTRIES).select();
        if (seedError) console.warn('No se pudieron restaurar ministerios:', seedError.message);
        if (seeded?.length) ministriesList = seeded;
      }
      if (servicesList.length) setServices(servicesList);
      if (announcementsList.length) setAnnouncements(announcementsList);
      if (ministriesList.length) setMinistries(ministriesList);
      if (galleryRes.data) setAboutGallery(galleryRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setDataLoading(false);
    setInitialLoadComplete(true);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleColorChange = (colorKey: keyof typeof pendingColors, value: string) => {
    const newColors = { ...pendingColors, [colorKey]: value };
    setPendingColors(newColors);
    previewColors(newColors); // Apply visually but don't save to DB
    setHasColorChanges(true);
    setHasUnsavedChanges(true);
  };

  const handleResetColors = () => {
    resetColors(); // Reset to default colors visually
    setPendingColors(defaultColors);
    setHasColorChanges(true);
    setHasUnsavedChanges(true);
    toast({ title: "Colores restablecidos", description: "Presiona 'Guardar Edits' para guardar definitivamente" });
  };

  const openSectionEditor = (section: string, field: EditField = 'all') => {
    const content = pageContent[section];
    const pending = pendingPageContent[section];
    
    // Use pending values if available, otherwise use original content
    setFormData({
      title: pending?.title ?? content?.title ?? '',
      subtitle: pending?.subtitle ?? content?.subtitle ?? '',
      content: pending?.content ?? content?.content ?? '',
      image_url: content?.image_url || '',
      video_url: content?.video_url || '',
      media_type: (content?.media_type as 'video' | 'image' | 'video_file') || 'video',
      video_file_url: ''
    });
    setEditingField(field);
    setEditingSection(section);
  };

  const handleSectionImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingSection) return;
    
    const url = await uploadImage(file, `sections/${editingSection}`);
    if (url) {
      setFormData({ ...formData, image_url: url });
    }
  };

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const url = await uploadImage(file, 'hero');
    if (url) {
      setFormData({ ...formData, image_url: url });
    }
  };

  const saveSectionContent = () => {
    if (!editingSection) return;
    
    // Update pending content with form data
    setPendingPageContent(prev => ({
      ...prev,
      [editingSection]: {
        ...prev[editingSection],
        title: formData.title,
        subtitle: formData.subtitle,
        content: formData.content
      }
    }));
    
    setHasUnsavedChanges(true);
    setEditingSection(null);
    toast({ title: "Cambios aplicados", description: "Presiona 'Guardar Edits' para guardar definitivamente" });
  };

  // Update pending text (no database save yet)
  const updatePendingText = (section: string, field: string, value: string) => {
    setPendingPageContent(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
    setHasUnsavedChanges(true);
  };

  // Update pending hero config (no database save yet)
  const updatePendingHeroConfig = (key: keyof HeroConfig, value: string) => {
    setPendingHeroConfig(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  // Handle completing a suggestion with double confirmation
  const handleCompleteSuggestion = async (suggestionId: string) => {
    if (confirmingComplete === suggestionId) {
      if (confirmStep === 1) {
        // First confirmation - ask again
        setConfirmStep(2);
        return;
      }
      // Second confirmation - actually complete
      try {
        const { error } = await supabase
          .from('admin_suggestions')
          .update({ is_completed: true })
          .eq('id', suggestionId);
        
        if (error) throw error;
        
        // Remove from local state
        setPendingSuggestions(prev => prev.filter(s => s.id !== suggestionId));
        setPendingSuggestionsCount(prev => Math.max(0, prev - 1));
        
        toast({
          title: "¡Completado!",
          description: "La tarea ha sido marcada como completada",
        });
      } catch (error: any) {
        console.error('Error completing suggestion:', error);
        toast({
          title: "Error",
          description: "No se pudo completar la tarea",
          variant: "destructive"
        });
      }
      // Reset confirmation state
      setConfirmingComplete(null);
      setConfirmStep(1);
    } else {
      // Start confirmation process
      setConfirmingComplete(suggestionId);
      setConfirmStep(1);
    }
  };

  const cancelConfirmation = () => {
    setConfirmingComplete(null);
    setConfirmStep(1);
  };

  // Get current content snapshot for scheduled publishing
  const getCurrentSnapshot = useCallback((): ContentSnapshot => {
    // Build complete pageContent with ALL pending changes properly formatted
    const snapshotPageContent: Record<string, any> = {};
    
    // Hero section - include pendingHeroConfig and media
    snapshotPageContent.hero = {
      title: pendingPageContent.hero?.title || pageContent.hero?.title || 'Bienvenidos a CFA',
      subtitle: pendingPageContent.hero?.subtitle || pageContent.hero?.subtitle || 'Centro de Fe y Alabanza',
      content: JSON.stringify(pendingHeroConfig),
      image_url: pendingHeroMedia.imageUrl,
      video_url: pendingHeroMedia.videoUrl,
      video_file_url: pendingHeroMedia.videoFileUrl,
      media_type: pendingHeroMedia.mediaType,
      mobile_image_url: pendingHeroMedia.mobileImageUrl,
      mobile_video_url: pendingHeroMedia.mobileVideoUrl,
      mobile_video_file_url: pendingHeroMedia.mobileVideoFileUrl,
      mobile_media_type: pendingHeroMedia.mobileMediaType,
    };
    
    // About section
    snapshotPageContent.about = {
      title: pendingPageContent.about?.title || pageContent.about?.title || '',
      subtitle: pendingPageContent.about?.subtitle || pageContent.about?.subtitle || '',
      content: pendingPageContent.about?.content || pageContent.about?.content || '',
    };
    
    // Contact section - serialize contactExtraFields to content
    snapshotPageContent.contact = {
      title: pendingPageContent.contact?.title || pageContent.contact?.title || '',
      subtitle: pendingPageContent.contact?.subtitle || pageContent.contact?.subtitle || '',
      content: JSON.stringify(contactExtraFields),
    };
    
    // Footer section - serialize footerFields to content
    snapshotPageContent.footer = {
      title: pageContent.footer?.title || 'Footer',
      subtitle: pageContent.footer?.subtitle || null,
      content: JSON.stringify(footerFields),
    };
    
    // Prayer section - use pendingPrayerFields if exists
    const prayerData = pendingPrayerFields || prayerFields;
    snapshotPageContent.prayer = {
      title: prayerData.title,
      subtitle: prayerData.subtitle,
      content: JSON.stringify({
        schedule: prayerData.schedule,
        time: prayerData.time,
        buttonText: prayerData.buttonText,
        buttonUrl: prayerData.buttonUrl,
      }),
    };
    
    // Quote section - use pendingQuoteFields if exists
    const quoteData = pendingQuoteFields || quoteFields;
    snapshotPageContent.quote = {
      title: quoteData.quote,
      subtitle: quoteData.author,
      content: quoteData.imageUrl,
    };
    
    // Handle pending service changes - merge existing services with pending changes
    // and remove isNew/isDeleted flags for clean snapshot
    // Use a Map to prevent duplicates by ID
    const servicesMap = new Map<string, Service>();
    
    // First, process existing services with their pending changes
    services.forEach(s => {
      const pending = pendingServiceChanges.get(s.id);
      if (pending?.isDeleted) return; // Skip deleted services
      
      // Merge existing service with pending changes, excluding internal flags
      const { isNew, isDeleted, ...cleanPending } = pending || {};
      const mergedService: any = { ...s, ...cleanPending };
      // Mark new items with created_at: null
      if (pending?.isNew) {
        mergedService.created_at = null;
      }
      servicesMap.set(s.id, mergedService);
    });
    
    // Then, add new services from pending ONLY if not already in the map
    pendingServiceChanges.forEach((change, id) => {
      if (change.isNew && !change.isDeleted && !servicesMap.has(id)) {
        // Create clean service object without internal flags
        servicesMap.set(id, { 
          id, // This will be a temp ID like "new-service-123"
          title: change.title || '', 
          description: change.description || null,
          extended_content: change.extended_content || null,
          day: change.day || null,
          time: change.time || null,
          icon: change.icon || 'Church',
          is_visible: change.is_visible ?? true,
          display_order: change.display_order || servicesMap.size,
          created_at: null // Mark as new for edge function
        } as Service);
      }
    });
    
    const servicesWithPending = Array.from(servicesMap.values());
    
    // Handle pending announcement changes - merge existing with pending, clean flags
    // Use a Map to prevent duplicates by ID
    const announcementsMap = new Map<string, Announcement>();
    
    // Process existing announcements with their pending changes
    announcements.forEach(a => {
      const pending = pendingAnnouncementChanges.get(a.id);
      if (pending?.isDeleted) return; // Skip deleted
      
      const { isNew, isDeleted, ...cleanPending } = pending || {};
      const mergedAnnouncement: any = { ...a, ...cleanPending };
      if (pending?.isNew) {
        mergedAnnouncement.created_at = null;
      }
      announcementsMap.set(a.id, mergedAnnouncement);
    });
    
    // Add new announcements from pending ONLY if not already in the map
    pendingAnnouncementChanges.forEach((change, id) => {
      if (change.isNew && !change.isDeleted && !announcementsMap.has(id)) {
        announcementsMap.set(id, {
          id, // Temp ID
          title: change.title || '',
          description: change.description || null,
          image_url: change.image_url || null,
          is_visible: change.is_visible ?? true,
          display_order: change.display_order || announcementsMap.size,
          created_at: null // Mark as new
        } as Announcement);
      }
    });
    
    const announcementsWithPending = Array.from(announcementsMap.values());
    
    // Handle pending ministry changes - merge existing with pending, clean flags
    const ministriesMap = new Map<string, Ministry>();
    
    // Process existing ministries with their pending changes
    ministries.forEach(m => {
      const pending = pendingMinistryChanges.get(m.id);
      if (pending?.isDeleted) return; // Skip deleted
      
      const { isNew, isDeleted, ...cleanPending } = pending || {};
      const mergedMinistry: any = { ...m, ...cleanPending };
      if (pending?.isNew) {
        mergedMinistry.created_at = null;
      }
      ministriesMap.set(m.id, mergedMinistry);
    });
    
    // Add new ministries from pending ONLY if not already in the map
    pendingMinistryChanges.forEach((change, id) => {
      if (change.isNew && !change.isDeleted && !ministriesMap.has(id)) {
        ministriesMap.set(id, {
          id, // Temp ID
          slug: change.slug || '',
          title: change.title || '',
          description: change.description || null,
          content: change.content || null,
          image_url: change.image_url || null,
          icon: change.icon || 'Users',
          schedule: change.schedule || null,
          leader: change.leader || null,
          is_visible: change.is_visible ?? true,
          display_order: change.display_order || ministriesMap.size,
          created_at: null // Mark as new
        } as Ministry);
      }
    });
    
    const ministriesWithPending = Array.from(ministriesMap.values());
    
    return {
      pageContent: snapshotPageContent,
      services: servicesWithPending as Service[],
      events: [],
      announcements: announcementsWithPending as Announcement[],
      ministries: ministriesWithPending as Ministry[],
      gallery: aboutGallery,
    };
  }, [
    pageContent, pendingPageContent, 
    pendingHeroConfig, pendingHeroMedia, 
    contactExtraFields, footerFields,
    prayerFields, pendingPrayerFields,
    quoteFields, pendingQuoteFields,
    services, pendingServiceChanges, 
    announcements, pendingAnnouncementChanges, 
    ministries, pendingMinistryChanges,
    aboutGallery
  ]);

  // Handle save - either immediate or scheduled
  const handleSaveOrSchedule = async () => {
    if (isScheduledMode && scheduledDateTime && isValid(scheduledDateTime)) {
      // Schedule the content instead of saving immediately
      const snapshot = getCurrentSnapshot();
      const title = scheduledTitle || `Cambios programados - ${format(scheduledDateTime, 'dd/MM/yyyy HH:mm')}`;
      
      const success = await createScheduledContent(
        title,
        'Cambios programados desde el panel de administración',
        scheduledDateTime,
        snapshot
      );
      
      if (success) {
        // Force refresh scheduled content list
        await refetchScheduledContent();
        // Reset scheduled mode
        setIsScheduledMode(false);
        setScheduledDateTime(null);
        setScheduledTitle('');
        // Clear pending changes
        setPendingAnnouncementChanges(new Map());
        setPendingServiceChanges(new Map());
        setPendingMinistryChanges(new Map());
        setPendingPrayerFields(null);
        setPendingQuoteFields(null);
        setPendingGalleryChanges(new Map());
        setHasUnsavedChanges(false);
        fetchData(true);
      }
      return;
    }
    
    // Normal save flow
    await saveAllChanges();
  };

  // Save all pending changes to the database
  const saveAllChanges = async () => {
    setSaving(true);
    let hasError = false;
    const errorSections: string[] = [];

    console.log('Starting save...', { 
      heroId: pageContent.hero?.id,
      aboutId: pageContent.about?.id,
      contactId: pageContent.contact?.id,
      pendingHeroConfig, 
      pendingPageContent,
      pendingAnnouncementChanges: Array.from(pendingAnnouncementChanges.entries()),
      pendingServices: Array.from(pendingServices.entries())
    });

    // Save hero config and media (upsert: crea la fila si no existe en la BD)
    const heroContentString = JSON.stringify(pendingHeroConfig);
    try {
      const updateData = {
        section: 'hero',
        is_visible: true,
        content: heroContentString,
        video_url: pendingHeroMedia.videoUrl || null,
        image_url: pendingHeroMedia.imageUrl || null,
        video_file_url: pendingHeroMedia.videoFileUrl || null,
        media_type: pendingHeroMedia.mediaType,
        mobile_video_url: pendingHeroMedia.mobileVideoUrl || null,
        mobile_image_url: pendingHeroMedia.mobileImageUrl || null,
        mobile_video_file_url: pendingHeroMedia.mobileVideoFileUrl || null,
        mobile_media_type: pendingHeroMedia.mobileMediaType || null
      };

      const { error, data } = await supabase
        .from('page_content')
        .upsert(updateData, { onConflict: 'section' })
        .select()
        .single();

      if (error) {
        console.error('Error saving hero - full error:', JSON.stringify(error, null, 2));
        hasError = true;
        errorSections.push('Hero');
      } else {
        setHeroConfig(pendingHeroConfig);
        setHeroMedia(pendingHeroMedia);
        if (data) {
          setPageContent(prev => ({ ...prev, hero: data }));
        }
      }
    } catch (catchError) {
      console.error('Caught exception saving hero:', catchError);
      hasError = true;
      errorSections.push('Hero');
    }

    // Save about section with extra fields as JSON in content (upsert: crea la fila si no existe)
    const aboutContentString = JSON.stringify(aboutExtraFields);
    const { error: aboutError, data: aboutData } = await supabase
      .from('page_content')
      .upsert({
        section: 'about',
        title: pendingPageContent.about?.title || pageContent.about?.title || DEFAULT_ABOUT.title,
        subtitle: pendingPageContent.about?.subtitle || pageContent.about?.subtitle || DEFAULT_ABOUT.subtitle,
        content: aboutContentString,
        is_visible: true
      }, { onConflict: 'section' })
      .select()
      .single();

    console.log('About save result:', { error: aboutError, data: aboutData });

    if (aboutError) {
      console.error('Error saving about:', aboutError);
      hasError = true;
      errorSections.push('Nosotros');
    } else if (aboutData) {
      setPageContent(prev => ({ ...prev, about: aboutData }));
    }

    // Save contact section with extra fields as JSON in content (upsert: crea la fila si no existe)
    const contactContentString = JSON.stringify(contactExtraFields);
    const { error: contactError, data: contactData } = await supabase
      .from('page_content')
      .upsert({
        section: 'contact',
        title: pendingPageContent.contact?.title || pageContent.contact?.title || DEFAULT_CONTACT.title,
        subtitle: pendingPageContent.contact?.subtitle || pageContent.contact?.subtitle || DEFAULT_CONTACT.subtitle,
        content: contactContentString,
        is_visible: true
      }, { onConflict: 'section' })
      .select()
      .single();

    console.log('Contact save result:', { error: contactError, data: contactData });

    if (contactError) {
      console.error('Error saving contact:', contactError);
      hasError = true;
      errorSections.push('Contacto');
    } else if (contactData) {
      setPageContent(prev => ({ ...prev, contact: contactData }));
    }

    // Guardar encabezados de secciones (ministries / services / announcements)
    for (const headerSection of ['ministries', 'services', 'announcements'] as const) {
      const { error: headerError, data: headerData } = await supabase
        .from('page_content')
        .upsert({
          section: headerSection,
          title: getSectionHeaderValue(headerSection, 'title'),
          subtitle: getSectionHeaderValue(headerSection, 'subtitle'),
          content: null,
          is_visible: true
        }, { onConflict: 'section' })
        .select()
        .single();

      console.log(`Header ${headerSection} save result:`, { error: headerError, data: headerData });

      if (headerError) {
        console.error(`Error saving ${headerSection} header:`, headerError);
        hasError = true;
        errorSections.push(`Encabezado ${headerSection}`);
      } else if (headerData) {
        setPageContent(prev => ({ ...prev, [headerSection]: headerData }));
      }
    }

    // Save footer section (social media URLs) using upsert
    const footerContentString = JSON.stringify(footerFields);
    console.log('Saving footer content:', footerContentString);
    
    const { error: footerError, data: footerData } = await supabase
      .from('page_content')
      .upsert({
        section: 'footer',
        content: footerContentString,
        is_visible: true
      }, { onConflict: 'section' })
      .select()
      .single();
    
    console.log('Footer upsert result:', { footerError, footerData });
    
    if (footerError) {
      console.error('Error saving footer:', footerError);
      hasError = true;
      errorSections.push('Footer');
    } else if (footerData) {
      setPageContent(prev => ({
        ...prev,
        footer: footerData
      }));
    }

    // Save pending service changes
    for (const [serviceId, serviceData] of pendingServiceChanges.entries()) {
      if (serviceData.isDeleted) {
        // Delete service
        const { error } = await supabase
          .from('services')
          .delete()
          .eq('id', serviceId);
        
        if (error) {
          console.error('Error deleting service:', error);
          hasError = true;
          errorSections.push('Servicios');
        }
      } else if (serviceData.isNew) {
        // Insert new service
        const { error } = await supabase.from('services').insert({
          title: serviceData.title,
          description: serviceData.description || null,
          day: serviceData.day || null,
          time: serviceData.time || null,
          icon: serviceData.icon || 'Church',
          is_visible: true,
          display_order: serviceData.display_order || 0
        });
        
        if (error) {
          console.error('Error creating service:', error);
          hasError = true;
          errorSections.push('Servicios');
        }
      } else if (isValidUUID(serviceId)) {
        // Update existing service (si la fila no existe en la BD, materializarla)
        const { data: updated, error } = await supabase
          .from('services')
          .update({
            title: serviceData.title,
            description: serviceData.description,
            extended_content: serviceData.extended_content,
            day: serviceData.day,
            time: serviceData.time,
            icon: serviceData.icon
          })
          .eq('id', serviceId)
          .select('id');
        
        if (error) {
          console.error('Error updating service:', error);
          hasError = true;
          errorSections.push('Servicios');
        } else if (!updated?.length) {
          const { error: insertError } = await supabase.from('services').insert({
            id: serviceId,
            title: serviceData.title,
            description: serviceData.description || null,
            extended_content: serviceData.extended_content || null,
            day: serviceData.day || null,
            time: serviceData.time || null,
            icon: serviceData.icon || 'Church',
            is_visible: serviceData.is_visible ?? true,
            display_order: serviceData.display_order || 0
          });
          if (insertError) {
            console.error('Error materializing service:', insertError);
            hasError = true;
            errorSections.push('Servicios');
          }
        }
      }
    }

    // Save pending announcement changes
    for (const [announcementId, announcementData] of pendingAnnouncementChanges.entries()) {
      if (announcementData.isDeleted) {
        // Delete announcement
        const { error } = await supabase
          .from('announcements')
          .delete()
          .eq('id', announcementId);
        
        if (error) {
          console.error('Error deleting announcement:', error);
          hasError = true;
          errorSections.push('Anuncios');
        }
      } else if (announcementData.isNew) {
        // Insert new announcement
        const { error } = await supabase.from('announcements').insert({
          title: announcementData.title,
          description: announcementData.description || null,
          image_url: announcementData.image_url || null,
          is_visible: true,
          display_order: announcementData.display_order || 0
        });
        
        if (error) {
          console.error('Error creating announcement:', error);
          hasError = true;
          errorSections.push('Anuncios');
        }
      } else if (isValidUUID(announcementId)) {
        // Update existing announcement (si la fila no existe en la BD, materializarla)
        const { data: updated, error } = await supabase
          .from('announcements')
          .update({
            title: announcementData.title,
            description: announcementData.description,
            image_url: announcementData.image_url || null
          })
          .eq('id', announcementId)
          .select('id');
        
        if (error) {
          console.error('Error updating announcement:', error);
          hasError = true;
          errorSections.push('Anuncios');
        } else if (!updated?.length) {
          const { error: insertError } = await supabase.from('announcements').insert({
            id: announcementId,
            title: announcementData.title,
            description: announcementData.description || null,
            image_url: announcementData.image_url || null,
            is_visible: announcementData.is_visible ?? true,
            display_order: announcementData.display_order || 0
          });
          if (insertError) {
            console.error('Error materializing announcement:', insertError);
            hasError = true;
            errorSections.push('Anuncios');
          }
        }
      }
    }

    // Save pending prayer fields
    if (pendingPrayerFields) {
      const contentJson = JSON.stringify({
        schedule: pendingPrayerFields.schedule,
        time: pendingPrayerFields.time,
        buttonText: pendingPrayerFields.buttonText,
        buttonUrl: pendingPrayerFields.buttonUrl
      });
      const { error } = await supabase
        .from('page_content')
        .upsert({
          section: 'prayer',
          title: pendingPrayerFields.title,
          subtitle: pendingPrayerFields.subtitle,
          content: contentJson,
          image_url: pendingPrayerFields.backgroundImage || null
        }, { onConflict: 'section' });
      if (error) {
        console.error('Error saving prayer:', error);
        hasError = true;
        errorSections.push('Oración');
      } else {
        setPrayerFields(pendingPrayerFields);
      }
    }

    // Save pending quote fields
    if (pendingQuoteFields) {
      const { error } = await supabase
        .from('page_content')
        .upsert({
          section: 'quote',
          title: pendingQuoteFields.quote,
          subtitle: pendingQuoteFields.author,
          content: pendingQuoteFields.imageUrl
        }, { onConflict: 'section' });
      if (error) {
        console.error('Error saving quote:', error);
        hasError = true;
        errorSections.push('Cita');
      } else {
        setQuoteFields(pendingQuoteFields);
      }
    }

    // Save pending gallery changes
    for (const [imageId, imageData] of pendingGalleryChanges.entries()) {
      const { error } = await supabase
        .from('about_gallery')
        .update({
          image_url: imageData.image_url,
          alt_text: imageData.alt_text
        })
        .eq('id', imageId);
      if (error) {
        console.error('Error updating gallery image:', error);
        hasError = true;
        errorSections.push('Galería');
      }
    }

    // Save pending ministry changes
    for (const [ministryId, ministryData] of pendingMinistryChanges.entries()) {
      if (ministryData.isDeleted) {
        // Delete ministry
        const { error } = await supabase
          .from('ministries')
          .delete()
          .eq('id', ministryId);
        
        if (error) {
          console.error('Error deleting ministry:', error);
          hasError = true;
          errorSections.push('Ministerios');
        }
      } else if (ministryData.isNew) {
        // Insert new ministry
        const { error } = await supabase.from('ministries').insert({
          title: ministryData.title || '',
          slug: ministryData.slug || '',
          description: ministryData.description || null,
          content: ministryData.content || null,
          schedule: ministryData.schedule || null,
          leader: ministryData.leader || null,
          image_url: ministryData.image_url || null,
          icon: ministryData.icon || 'Users',
          is_visible: ministryData.is_visible ?? true,
          display_order: ministryData.display_order || 0
        });
        
        if (error) {
          console.error('Error creating ministry:', error);
          hasError = true;
          errorSections.push('Ministerios');
        }
      } else if (isValidUUID(ministryId)) {
        // Update existing ministry
        const updateData: Record<string, unknown> = {};
        if (ministryData.title !== undefined) updateData.title = ministryData.title;
        if (ministryData.slug !== undefined) updateData.slug = ministryData.slug;
        if (ministryData.description !== undefined) updateData.description = ministryData.description;
        if (ministryData.content !== undefined) updateData.content = ministryData.content;
        if (ministryData.schedule !== undefined) updateData.schedule = ministryData.schedule;
        if (ministryData.leader !== undefined) updateData.leader = ministryData.leader;
        if (ministryData.image_url !== undefined) updateData.image_url = ministryData.image_url;
        if (ministryData.icon !== undefined) updateData.icon = ministryData.icon;
        if (ministryData.is_visible !== undefined) updateData.is_visible = ministryData.is_visible;
        
        const { data: updated, error } = await supabase
          .from('ministries')
          .update(updateData)
          .eq('id', ministryId)
          .select('id');
        
        if (error) {
          console.error('Error updating ministry:', error);
          hasError = true;
          errorSections.push('Ministerios');
        } else if (!updated?.length) {
          // La fila no existe en la BD (contenido de ejemplo) → materializarla
          const { error: insertError } = await supabase.from('ministries').insert({
            id: ministryId,
            title: ministryData.title || '',
            slug: ministryData.slug || '',
            description: ministryData.description || null,
            content: ministryData.content || null,
            schedule: ministryData.schedule || null,
            leader: ministryData.leader || null,
            image_url: ministryData.image_url || null,
            icon: ministryData.icon || 'Users',
            is_visible: ministryData.is_visible ?? true,
            display_order: ministryData.display_order || 0
          });
          if (insertError) {
            console.error('Error materializing ministry:', insertError);
            hasError = true;
            errorSections.push('Ministerios');
          }
        }
      }
    }

    // Save pending branding (logo) changes
    if (pendingBrandingFields) {
      const { error } = await supabase
        .from('page_content')
        .upsert({
          section: 'branding',
          image_url: pendingBrandingFields.logoUrl || null,
          is_visible: true
        }, { onConflict: 'section' });
      if (error) {
        console.error('Error saving branding:', error);
        hasError = true;
        errorSections.push('Logo');
      } else {
        setBrandingFields(pendingBrandingFields);
        setPendingBrandingFields(null);
      }
    }

    if (hasError) {
      toast({ 
        title: "Error", 
        description: `No se pudo guardar: ${errorSections.join(', ')}`, 
        variant: "destructive" 
      });
    } else {
      // Save colors if there are color changes
      if (hasColorChanges) {
        await saveColors(pendingColors);
        setHasColorChanges(false);
      }
      
      toast({ title: "¡Guardado!", description: "Todos los cambios se han guardado correctamente en la base de datos" });
      // Clear pending changes
      setPendingAnnouncementChanges(new Map());
      setPendingServiceChanges(new Map());
      setPendingMinistryChanges(new Map());
      setPendingPrayerFields(null);
      setPendingQuoteFields(null);
      setPendingBrandingFields(null);
      setPendingGalleryChanges(new Map());
      setHasUnsavedChanges(false);
      // Refresh data from database (force reset pending since we just saved)
      fetchData(true);
    }
    setSaving(false);
  };

  // Reset all pending changes
  const resetAllChanges = () => {
    // Reload data from database and force reset pending changes
    fetchData(true);
    // Revert colors to last saved state
    revertColors();
    setPendingColors(colors);
    setHasColorChanges(false);
    setPendingAnnouncementChanges(new Map());
    setPendingServiceChanges(new Map());
    setPendingMinistryChanges(new Map());
    setPendingPrayerFields(null);
    setPendingQuoteFields(null);
    setPendingBrandingFields(null);
    setPendingGalleryChanges(new Map());
    toast({ title: "Cambios descartados", description: "Todos los cambios pendientes han sido descartados" });
  };

  const openHeroEditor = () => {
    setHeroForm(pendingHeroConfig);
    setHeroMediaForm(pendingHeroMedia);
    setShowHeroEditor(true);
  };

  const saveHeroChanges = () => {
    setPendingHeroConfig(heroForm);
    setPendingHeroMedia(heroMediaForm);
    setHasUnsavedChanges(true);
    setShowHeroEditor(false);
    toast({ title: "Cambios aplicados", description: "Presiona 'Guardar Edits' para guardar definitivamente" });
  };

  const handleHeroImageUploadForMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const url = await uploadImage(file, 'hero');
    if (url) {
      setHeroMediaForm({ ...heroMediaForm, imageUrl: url });
    }
  };

  const handleHeroVideoUploadForMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const url = await uploadVideo(file, 'hero');
    if (url) {
      setHeroMediaForm({ ...heroMediaForm, videoFileUrl: url });
    }
  };

  // Mobile media upload handlers
  const handleHeroMobileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const url = await uploadImage(file, 'hero/mobile');
    if (url) {
      setHeroMediaForm({ ...heroMediaForm, mobileImageUrl: url });
    }
  };

  const handleHeroMobileVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const url = await uploadVideo(file, 'hero/mobile');
    if (url) {
      setHeroMediaForm({ ...heroMediaForm, mobileVideoFileUrl: url });
    }
  };

  // About field editing helpers
  const SECTION_HEADER_LABELS: Record<SectionHeaderKey, string> = {
    ministries: 'Ministerios',
    services: 'Servicios',
    announcements: 'Anuncios',
  };

  // Encabezados de secciones: pending > pageContent > default
  const getSectionHeaderValue = (section: SectionHeaderKey, field: 'title' | 'subtitle'): string =>
    pendingSectionHeaders[section]?.[field] ||
    pageContent[section]?.[field] ||
    DEFAULT_SECTION_HEADERS[section][field];

  const openSectionHeaderEditor = (section: SectionHeaderKey, field: 'title' | 'subtitle') => {
    setSectionHeaderValue(getSectionHeaderValue(section, field));
    setEditingSectionHeader({ section, field });
  };

  const saveSectionHeader = () => {
    if (!editingSectionHeader) return;
    const { section, field } = editingSectionHeader;
    setPendingSectionHeaders(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: sectionHeaderValue },
    }));
    setHasUnsavedChanges(true);
    setEditingSectionHeader(null);
    toast({ title: "Cambio aplicado", description: "Presiona 'Guardar Edits' para guardar definitivamente" });
  };

  const getAboutFieldValue = (field: string): string => {
    if (field === 'title') return pendingPageContent.about?.title || pageContent.about?.title || DEFAULT_ABOUT.title;
    if (field === 'subtitle') return pendingPageContent.about?.subtitle || pageContent.about?.subtitle || DEFAULT_ABOUT.subtitle;
    if (field === 'content') return aboutExtraFields.firstParagraph || DEFAULT_ABOUT_FIELDS.firstParagraph;
    return aboutExtraFields[field as keyof typeof aboutExtraFields] || DEFAULT_ABOUT_FIELDS[field as keyof typeof DEFAULT_ABOUT_FIELDS] || '';
  };

  const getAboutFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      title: 'Título Principal',
      subtitle: 'Subtítulo',
      content: 'Primer Párrafo',
      secondParagraph: 'Segundo Párrafo',
      value1Title: 'Valor 1 - Título',
      value1Desc: 'Valor 1 - Descripción',
      value2Title: 'Valor 2 - Título',
      value2Desc: 'Valor 2 - Descripción',
      value3Title: 'Valor 3 - Título',
      value3Desc: 'Valor 3 - Descripción',
      stat1Value: 'Estadística 1 - Valor',
      stat1Label: 'Estadística 1 - Etiqueta',
      stat2Value: 'Estadística 2 - Valor',
      stat2Label: 'Estadística 2 - Etiqueta',
      stat3Value: 'Estadística 3 - Valor',
      stat3Label: 'Estadística 3 - Etiqueta',
      marqueeText: 'Texto del Marquee (separado por comas)'
    };
    return labels[field] || field;
  };

  const saveAboutField = () => {
    if (!editingAboutField) return;
    
    if (['title', 'subtitle'].includes(editingAboutField)) {
      setPendingPageContent(prev => ({
        ...prev,
        about: { ...prev.about, [editingAboutField]: aboutFieldValue }
      }));
    } else if (editingAboutField === 'content') {
      // Map 'content' field to 'firstParagraph' in aboutExtraFields
      setAboutExtraFields(prev => ({
        ...prev,
        firstParagraph: aboutFieldValue
      }));
    } else {
      setAboutExtraFields(prev => ({
        ...prev,
        [editingAboutField]: aboutFieldValue
      }));
    }
    
    setHasUnsavedChanges(true);
    setEditingAboutField(null);
    toast({ title: "Cambio aplicado", description: "Presiona 'Guardar Edits' para guardar definitivamente" });
  };

  // Contact field editing helpers
  const getContactFieldValue = (field: string): string => {
    if (field === 'title') return pendingPageContent.contact?.title || pageContent.contact?.title || DEFAULT_CONTACT.title;
    if (field === 'subtitle') return pendingPageContent.contact?.subtitle || pageContent.contact?.subtitle || DEFAULT_CONTACT.subtitle;
    return contactExtraFields[field as keyof typeof contactExtraFields] || DEFAULT_CONTACT_FIELDS[field as keyof typeof DEFAULT_CONTACT_FIELDS] || '';
  };

  const getContactFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      title: 'Título',
      subtitle: 'Subtítulo',
      addressLabel: 'Etiqueta Dirección',
      addressLine1: 'Dirección Línea 1',
      addressLine2: 'Dirección Línea 2',
      phoneLabel: 'Etiqueta Teléfono',
      phoneLine1: 'Teléfono Línea 1',
      phoneLine2: 'Teléfono Línea 2',
      emailLabel: 'Etiqueta Email',
      emailLine1: 'Email Línea 1',
      emailLine2: 'Email Línea 2',
      mapUrl: 'URL del Mapa (Google Maps Embed)'
    };
    return labels[field] || field;
  };

  const saveContactField = () => {
    if (!editingContactField) return;
    
    if (['title', 'subtitle'].includes(editingContactField)) {
      setPendingPageContent(prev => ({
        ...prev,
        contact: { ...prev.contact, [editingContactField]: contactFieldValue }
      }));
    } else {
      setContactExtraFields(prev => ({
        ...prev,
        [editingContactField]: contactFieldValue
      }));
    }
    
    setHasUnsavedChanges(true);
    setEditingContactField(null);
    toast({ title: "Cambio aplicado", description: "Presiona 'Guardar Edits' para guardar definitivamente" });
  };

  // Footer field editing helpers
  const getFooterFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      facebookUrl: 'URL de Facebook',
      instagramUrl: 'URL de Instagram',
      youtubeUrl: 'URL de YouTube',
      emailUrl: 'URL de Email (mailto:)',
      liveStreamUrl: 'URL de En Vivo (YouTube)',
      whatsappNumber: 'Número de WhatsApp'
    };
    return labels[field] || field;
  };

  const openFooterFieldEditor = (field: string) => {
    setFooterFieldValue(footerFields[field as keyof typeof footerFields] || '');
    setEditingFooterField(field);
  };

  const saveFooterField = () => {
    if (!editingFooterField) return;
    
    setFooterFields(prev => ({
      ...prev,
      [editingFooterField]: footerFieldValue
    }));
    
    setHasUnsavedChanges(true);
    setEditingFooterField(null);
    toast({ title: "Cambio aplicado", description: "Presiona 'Guardar Edits' para guardar definitivamente" });
  };

  const openServiceEditor = (service: Service) => {
    setServiceForm({
      title: service.title,
      description: service.description || '',
      extended_content: service.extended_content || '',
      day: service.day || '',
      time: service.time || '',
      icon: service.icon || 'Church'
    });
    setEditingService(service);
  };

  // About image upload handler
  const handleAboutImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const url = await uploadImage(file, 'about');
    if (url) {
      setAboutImageUrl(url);
    }
  };

  const saveAboutImage = async () => {
    if (!pageContent.about?.id) return;
    
    setSaving(true);
    const { error } = await supabase
      .from('page_content')
      .update({ image_url: aboutImageUrl })
      .eq('id', pageContent.about.id);
    
    if (error) {
      toast({ title: "Error", description: "No se pudo guardar la imagen", variant: "destructive" });
    } else {
      toast({ title: "¡Guardado!", description: "La imagen se ha actualizado" });
      setPageContent(prev => ({
        ...prev,
        about: { ...prev.about!, image_url: aboutImageUrl }
      }));
    }
    setSaving(false);
    setShowAboutImageEditor(false);
  };

  const saveService = () => {
    if (!editingService) return;
    
    const updatedService: Service = {
      ...editingService,
      title: serviceForm.title,
      description: serviceForm.description || null,
      extended_content: serviceForm.extended_content || null,
      day: serviceForm.day || null,
      time: serviceForm.time || null,
      icon: serviceForm.icon || 'Church',
      is_visible: true
    };
    
    // Store in pending changes
    setPendingServiceChanges(prev => {
      const newMap = new Map(prev);
      const isNew = !isValidUUID(editingService.id);
      newMap.set(editingService.id, { ...updatedService, isNew });
      return newMap;
    });
    
    // Update local services state for preview
    setServices(prev => prev.map(s => 
      s.id === editingService.id ? updatedService : s
    ));
    
    setHasUnsavedChanges(true);
    setEditingService(null);
    toast({ title: "Cambio aplicado", description: "Presiona 'Guardar Edits' para guardar definitivamente" });
  };

  const deleteService = () => {
    if (!editingService) return;
    
    // Only allow deleting services that exist in database (valid UUID)
    if (isValidUUID(editingService.id)) {
      // Mark as deleted in pending changes
      setPendingServiceChanges(prev => {
        const newMap = new Map(prev);
        newMap.set(editingService.id, { ...editingService, isDeleted: true });
        return newMap;
      });
      
      // Remove from local state for preview
      setServices(prev => prev.filter(s => s.id !== editingService.id));
      
      setHasUnsavedChanges(true);
      toast({ title: "Marcado para eliminar", description: "Presiona 'Guardar Edits' para confirmar la eliminación" });
    } else {
      // For default/placeholder services, just remove from view
      setServices(prev => prev.filter(s => s.id !== editingService.id));
      toast({ title: "Servicio removido", description: "El servicio de ejemplo se ha removido" });
    }
    
    setEditingService(null);
  };

  const addService = () => {
    if (!serviceForm.title) {
      toast({ title: "Error", description: "El título es obligatorio", variant: "destructive" });
      return;
    }
    
    // Generate a temporary ID for the new service
    const tempId = `new-service-${Date.now()}`;
    const newService: Service = {
      id: tempId,
      title: serviceForm.title,
      description: serviceForm.description || null,
      extended_content: serviceForm.extended_content || null,
      day: serviceForm.day || null,
      time: serviceForm.time || null,
      icon: serviceForm.icon || 'Church',
      is_visible: true,
      display_order: services.length + 1
    };
    
    // Add to pending changes
    setPendingServiceChanges(prev => {
      const newMap = new Map(prev);
      newMap.set(tempId, { ...newService, isNew: true });
      return newMap;
    });
    
    // Add to local state for preview
    setServices(prev => [...prev, newService]);
    
    setHasUnsavedChanges(true);
    setServiceForm({ title: '', description: '', extended_content: '', day: '', time: '', icon: 'Church' });
    setShowAddService(false);
    toast({ title: "Servicio agregado", description: "Presiona 'Guardar Edits' para guardar definitivamente" });
  };

  const openAnnouncementEditor = (announcement: Announcement) => {
    setAnnouncementForm({
      title: announcement.title,
      description: announcement.description || '',
      image_url: announcement.image_url || ''
    });
    setEditingAnnouncement(announcement);
  };

  const handleAnnouncementImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const url = await uploadImage(file, 'announcements');
    if (url) {
      setAnnouncementForm({ ...announcementForm, image_url: url });
    }
  };

  // Helper to check if an ID is a valid UUID
  const isValidUUID = (id: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  const saveAnnouncement = () => {
    if (!editingAnnouncement) return;
    
    const updatedAnnouncement: Announcement = {
      ...editingAnnouncement,
      title: announcementForm.title,
      description: announcementForm.description || null,
      image_url: announcementForm.image_url || null,
      is_visible: true
    };
    
    // Store in pending changes
    setPendingAnnouncementChanges(prev => {
      const newMap = new Map(prev);
      const isNew = !isValidUUID(editingAnnouncement.id);
      newMap.set(editingAnnouncement.id, { ...updatedAnnouncement, isNew });
      return newMap;
    });
    
    // Update local announcements state for preview
    setAnnouncements(prev => prev.map(a => a.id === editingAnnouncement.id ? updatedAnnouncement : a));
    
    setHasUnsavedChanges(true);
    setEditingAnnouncement(null);
    toast({ title: "Cambio aplicado", description: "Presiona 'Guardar Edits' para guardar definitivamente" });
  };

  const deleteAnnouncement = () => {
    if (!editingAnnouncement) return;
    
    // Only allow deleting announcements that exist in database (valid UUID)
    if (isValidUUID(editingAnnouncement.id)) {
      // Mark as deleted in pending changes
      setPendingAnnouncementChanges(prev => {
        const newMap = new Map(prev);
        newMap.set(editingAnnouncement.id, { ...editingAnnouncement, isDeleted: true });
        return newMap;
      });
      
      // Remove from local state for preview
      setAnnouncements(prev => prev.filter(a => a.id !== editingAnnouncement.id));
      
      setHasUnsavedChanges(true);
      toast({ title: "Marcado para eliminar", description: "Presiona 'Guardar Edits' para confirmar la eliminación" });
    } else {
      // For default/placeholder announcements, just remove from view
      setAnnouncements(prev => prev.filter(a => a.id !== editingAnnouncement.id));
      toast({ title: "Anuncio removido", description: "El anuncio de ejemplo se ha removido" });
    }
    
    setEditingAnnouncement(null);
  };

  const addAnnouncement = () => {
    if (!announcementForm.title) {
      toast({ title: "Error", description: "Título es obligatorio", variant: "destructive" });
      return;
    }
    
    // Generate a temporary ID for the new announcement
    const tempId = `new-${Date.now()}`;
    const newAnnouncement: Announcement = {
      id: tempId,
      title: announcementForm.title,
      description: announcementForm.description || null,
      image_url: announcementForm.image_url || null,
      is_visible: true,
      display_order: announcements.length
    };
    
    // Add to pending changes
    setPendingAnnouncementChanges(prev => {
      const newMap = new Map(prev);
      newMap.set(tempId, { ...newAnnouncement, isNew: true });
      return newMap;
    });
    
    // Add to local state for preview
    setAnnouncements(prev => [...prev, newAnnouncement]);
    
    setHasUnsavedChanges(true);
    setAnnouncementForm({ title: '', description: '', image_url: '' });
    setShowAddAnnouncement(false);
    toast({ title: "Anuncio agregado", description: "Presiona 'Guardar Edits' para guardar definitivamente" });
  };

  // Only show initial loading screen if we haven't loaded yet
  // After initial load, keep the content visible to prevent unmounting
  if ((loading || rolesLoading) && !initialLoadComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user && !loading) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-destructive/30 shadow-xl shadow-destructive/10 rounded-2xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-destructive to-destructive/50" />
          <CardHeader className="text-center pt-8 pb-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-destructive text-xl">Acceso Denegado</CardTitle>
            <p className="text-muted-foreground text-sm mt-2">No tienes permisos para acceder al panel de administración</p>
          </CardHeader>
          <CardContent className="flex gap-3 pb-8">
            <Button variant="outline" asChild className="flex-1 h-11 rounded-xl">
              <Link to="/"><Home className="mr-2 h-4 w-4" />Ir al Inicio</Link>
            </Button>
            <Button variant="destructive" onClick={handleSignOut} className="flex-1 h-11 rounded-xl">
              <LogOut className="mr-2 h-4 w-4" />Cerrar Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 overflow-x-hidden">
      {/* Admin Header - Modern glassmorphism design */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary/90 via-primary/80 to-secondary/90 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-primary/20">
        <div className="px-2 sm:px-4 lg:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-1.5 sm:gap-2">
          {/* Logo with glow effect - Compact on mobile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-lg sm:rounded-xl blur-lg"></div>
              <img src={cfaAdminLogo} alt="CFA Logo" className="relative h-7 sm:h-9 lg:h-10 w-auto object-contain brightness-0 invert drop-shadow-lg" />
            </div>
            <div className="hidden xs:block sm:block">
              <h1 className="text-white text-[10px] sm:text-sm lg:text-base font-bold tracking-wider sm:tracking-widest uppercase drop-shadow-md" style={{ fontFamily: 'var(--font-hero)' }}>Admin</h1>
              <p className="text-white/60 text-[8px] sm:text-[10px] tracking-wide hidden sm:block">Gestión de contenido</p>
            </div>
            
            {/* Admin Online Counter */}
            <div 
              className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border border-white/20"
              title={adminList.map(a => a.email).join('\n')}
            >
              <div className="relative flex items-center">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="absolute w-2 h-2 rounded-full bg-green-400/50 animate-ping" />
              </div>
              <span className="text-white/90 text-[10px] sm:text-xs font-medium">
                {onlineAdmins}
              </span>
            </div>
          </div>
          
          {/* Action Buttons - Mobile optimized */}
          <div className="flex items-center gap-0.5 sm:gap-1.5 lg:gap-2 shrink-0">
            {/* Messages Button with Badge */}
            <div className="relative">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 sm:h-8 sm:w-auto text-white/90 hover:text-white hover:bg-white/20 px-0 sm:px-2.5 rounded-lg sm:rounded-xl transition-all"
                asChild
                title="Ver Mensajes"
              >
                <Link to="/admin/mensajes">
                  <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden lg:inline ml-1.5 text-xs font-medium tracking-wide">Mensajes</span>
                </Link>
              </Button>
              
              {/* Badge positioned at top-right corner */}
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-[9px] font-bold text-white shadow-md ring-2 ring-primary/80 animate-pulse">
                  {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                </span>
              )}
            </div>
            
            {/* Donations Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 sm:h-8 sm:w-auto text-white/90 hover:text-white hover:bg-white/20 px-0 sm:px-2.5 rounded-lg sm:rounded-xl transition-all"
              asChild
              title="Configurar Donaciones"
            >
              <Link to="/admin/donaciones">
                <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden lg:inline ml-1.5 text-xs font-medium tracking-wide">Donaciones</span>
              </Link>
            </Button>
            
            {/* Stats Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 sm:h-8 sm:w-auto text-white/90 hover:text-white hover:bg-white/20 px-0 sm:px-2.5 rounded-lg sm:rounded-xl transition-all"
              asChild
              title="Ver Estadísticas"
            >
              <Link to="/admin/estadisticas">
                <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden lg:inline ml-1.5 text-xs font-medium tracking-wide">Estadísticas</span>
              </Link>
            </Button>
            
            {/* Suggestions Button with Badge */}
            <div className="relative">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 sm:h-8 sm:w-auto text-white/90 hover:text-white hover:bg-white/20 px-0 sm:px-2.5 rounded-lg sm:rounded-xl transition-all"
                asChild
                title="Sugerencias y Tareas"
              >
                <Link to="/admin/sugerencias">
                  <Lightbulb className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden lg:inline ml-1.5 text-xs font-medium tracking-wide">Sugerencias</span>
                </Link>
              </Button>
              
              {/* Badge positioned at top-right corner */}
              {pendingSuggestionsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-[9px] font-bold text-gray-900 shadow-md ring-2 ring-primary/80 animate-pulse">
                  {pendingSuggestionsCount > 9 ? '9+' : pendingSuggestionsCount}
                </span>
              )}
            </div>
            
            {isPastor && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="hidden sm:flex h-8 text-white/90 hover:text-white hover:bg-white/20 px-2.5 rounded-xl transition-all"
                onClick={() => setShowAddAdmin(true)}
                title="Gestionar Administradores"
              >
                <Users className="h-4 w-4" />
                <span className="hidden lg:inline ml-1.5 text-xs font-medium tracking-wide">Admins</span>
              </Button>
            )}
            
            {/* Divider */}
            <div className="hidden sm:block w-px h-5 sm:h-6 bg-white/20 mx-0.5 sm:mx-1" />
            
            {/* View Site Button */}
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 sm:h-8 border-white/30 text-white hover:bg-white hover:text-primary bg-white/10 px-1.5 sm:px-2.5 rounded-lg sm:rounded-xl transition-all shadow-sm"
              asChild
            >
              <Link to="/">
                <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline ml-1 text-[10px] sm:text-xs font-medium">Ver</span>
              </Link>
            </Button>
            
            {/* Logout Button */}
            <Button 
              size="sm" 
              className="h-7 sm:h-8 bg-white/10 hover:bg-liveRed text-white px-1.5 sm:px-2.5 rounded-lg sm:rounded-xl transition-all border border-white/20 hover:border-liveRed"
              onClick={handleSignOut}
            >
              <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline ml-1 text-[10px] sm:text-xs font-medium">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header - smaller on mobile */}
      <div className="h-11 sm:h-14" />

      {/* Main Layout with Right Sidebar */}
      <div className="w-full overflow-x-hidden">
        {/* Main Content Area - respects the right sidebar space */}
        <main className="w-full lg:w-[calc(100%-18rem)] min-w-0 overflow-x-hidden">
          {dataLoading && !initialLoadComplete ? (
            <div className="flex justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="relative bg-gradient-to-br from-background to-muted/10 w-full overflow-x-hidden">
              {/* Top bar (Vista Previa + Paleta) - unified to avoid any step */}
              <div className="fixed top-[2.75rem] sm:top-[3.5rem] left-0 right-0 z-50 h-10 sm:h-12 bg-card/95 backdrop-blur-md border-b border-border/50">
                <div className="flex h-full">
                  {/* Left: Vista Previa */}
                  <div className="flex-1 lg:w-[calc(100%-18rem)] px-2 sm:px-4 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-500 animate-pulse"></div>
                      <span className="text-[10px] sm:text-sm font-medium text-foreground">Vista Previa</span>
                      <span className="text-[8px] sm:text-[10px] text-muted-foreground hidden sm:inline">• Los cambios se aplican al guardar</span>
                    </div>

                    {/* Viewport Toggle Buttons - Hidden on mobile devices */}
                    <div className="hidden md:flex items-center gap-0.5 bg-muted/50 rounded-full p-0.5 sm:p-1 border border-border/50">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-6 sm:h-7 px-2 sm:px-3 text-[10px] sm:text-xs gap-1 sm:gap-1.5 rounded-full transition-all ${
                          previewMode === 'desktop'
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => setPreviewMode('desktop')}
                      >
                        <Monitor className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span>PC</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-6 sm:h-7 px-2 sm:px-3 text-[10px] sm:text-xs gap-1 sm:gap-1.5 rounded-full transition-all ${
                          previewMode === 'mobile'
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => setPreviewMode('mobile')}
                      >
                        <Smartphone className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span>Móvil</span>
                      </Button>
                    </div>
                  </div>

                  {/* Right: Tab header for sidebar (only when the sidebar exists) */}
                  <div className="hidden lg:flex w-72 px-2 sm:px-4 items-center gap-2 border-l border-border/30">
                    <div className="flex-1 flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
                      <button
                        onClick={() => setSidebarTab('colors')}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-[10px] font-medium transition-colors ${
                          sidebarTab === 'colors'
                            ? 'bg-background shadow-sm text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Palette className="w-3.5 h-3.5" />
                        Personalizar
                      </button>
                      <button
                        onClick={() => setSidebarTab('suggestions')}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-[10px] font-medium transition-colors ${
                          sidebarTab === 'suggestions'
                            ? 'bg-background shadow-sm text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Lightbulb className="w-3.5 h-3.5" />
                        Notas
                        {pendingSuggestionsCount > 0 && (
                          <span className="ml-0.5 px-1.5 py-0.5 text-[8px] bg-amber-500/20 text-amber-600 rounded-full">
                            {pendingSuggestionsCount}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Spacer for fixed preview label */}
              <div className="h-10 sm:h-12" />
              
              {/* Preview Container - Changes based on viewport mode */}
              <div className={`transition-all duration-300 ${
                previewMode === 'mobile' 
                  ? 'flex justify-center py-4 bg-muted/30' 
                  : ''
              }`}>
                {/* Mobile Phone Frame */}
                {previewMode === 'mobile' && (
                  <div className="sticky top-12 z-10">
                    <div className="bg-gray-900 rounded-[3rem] p-2 pt-1 shadow-2xl relative">
                      {/* Phone notch */}
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-20" />
                      
                      {/* Screen container - uses iframe for true responsive behavior */}
                      <div 
                        className="bg-background rounded-[2.5rem] relative overflow-hidden"
                        style={{ width: '375px', height: '700px' }}
                      >
                        <iframe
                          src="/?preview=mobile"
                          className="w-full h-full border-0"
                          style={{ 
                            borderRadius: '2.5rem',
                            pointerEvents: 'auto'
                          }}
                          title="Vista previa móvil"
                        />
                      </div>
                    </div>
                    
                    {/* Hint to switch modes */}
                    <div className="text-center mt-4 text-xs text-muted-foreground">
                      <button 
                        onClick={() => setPreviewMode('desktop')}
                        className="hover:text-primary transition-colors flex items-center gap-1.5 mx-auto bg-card/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border"
                      >
                        <Monitor className="w-3.5 h-3.5" />
                        Cambiar a escritorio para editar
                      </button>
                    </div>
                  </div>
                )}

                {/* Desktop Preview */}
                {previewMode === 'desktop' && (
                  <>
                    {/* Navigation Preview - fixed below the Vista Previa bar */}
                    <div className="fixed top-[calc(2.75rem+2.5rem)] sm:top-[calc(3.5rem+3rem)] left-0 right-0 lg:right-[18rem] z-40 pointer-events-none">
                      <div className="pointer-events-auto">
                        <NavigationPreview 
                          isEditable={true}
                          liveStreamUrl={footerFields.liveStreamUrl}
                          customLogoUrl={pendingBrandingFields?.logoUrl || brandingFields.logoUrl || undefined}
                          onEditLiveStream={() => {
                            setFooterFieldValue(footerFields.liveStreamUrl || '');
                            setEditingFooterField('liveStreamUrl');
                          }}
                        />
                      </div>
                    </div>

                    {/* Page Content Preview - Using Real Components (same base background as the public page) */}
                    <div className="w-full overflow-hidden relative bg-background">
                      {/* ========== HERO SECTION WITH NAVIGATION ========== */}
                      <div id="inicio" className="relative">
                        <EditableWrapper 
                          onClick={() => openHeroEditor()}
                          label="Editar Hero"
                        >
                          <Hero config={pendingHeroConfig} media={pendingHeroMedia} />
                        </EditableWrapper>
                      </div>

                      {/* ========== PRAYER BANNER ========== */}
                      <div id="oracion" className="scroll-mt-16 md:scroll-mt-20">
                        <PrayerBanner 
                          title={prayerFields.title}
                          subtitle={prayerFields.subtitle}
                          schedule={prayerFields.schedule}
                          time={prayerFields.time}
                          buttonText={prayerFields.buttonText}
                          buttonUrl={prayerFields.buttonUrl}
                          backgroundImage={prayerFields.backgroundImage}
                          isEditable={true}
                          onEdit={() => setShowPrayerEditor(true)}
                        />
                      </div>

                      {/* ========== ANNOUNCEMENTS SECTION ========== */}
                      <div className="relative scroll-mt-16 md:scroll-mt-20" id="anuncios">
                        <Announcements 
                          announcements={announcements.filter(a => a.is_visible)} 
                          isEditable={true}
                          onEditAnnouncement={openAnnouncementEditor}
                          onAddAnnouncement={() => {
                            setAnnouncementForm({ title: '', description: '', image_url: '' });
                            setShowAddAnnouncement(true);
                          }}
                          title={getSectionHeaderValue('announcements', 'title')}
                          subtitle={getSectionHeaderValue('announcements', 'subtitle')}
                          onEditHeader={(field) => openSectionHeaderEditor('announcements', field)}
                        />
                      </div>

                      {/* ========== QUOTE SECTION ========== */}
                      <div id="cita" className="scroll-mt-16 md:scroll-mt-20">
                        <QuoteSection 
                          quote={quoteFields.quote}
                          author={quoteFields.author}
                          imageUrl={quoteFields.imageUrl}
                          isEditable={true}
                          onEdit={() => setShowQuoteEditor(true)}
                        />
                      </div>

                      {/* ========== SERVICES SECTION ========== */}
                      <div className="relative z-40 bg-background scroll-mt-16 md:scroll-mt-20" id="servicios">
                        <Services 
                          services={services.filter(s => s.is_visible)} 
                          onEditService={openServiceEditor}
                          isEditable={true}
                          title={getSectionHeaderValue('services', 'title')}
                          subtitle={getSectionHeaderValue('services', 'subtitle')}
                          onEditHeader={(field) => openSectionHeaderEditor('services', field)}
                        />
                        {/* Overlay for adding services */}
                        <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10">
                          <Button 
                            size="sm" 
                            onClick={() => {
                              setServiceForm({ title: '', description: '', extended_content: '', day: '', time: '', icon: 'Church' });
                              setShowAddService(true);
                            }}
                            className="bg-turquoise hover:bg-turquoise/80 text-[10px] sm:text-sm h-7 sm:h-9 px-2 sm:px-3"
                          >
                            <Plus className="w-3 h-3 sm:w-4 sm:h-4" /> <span className="hidden xs:inline ml-1">Agregar</span>
                          </Button>
                        </div>
                      </div>

                      {/* ========== ABOUT SECTION ========== */}
                      <div id="nosotros" className="relative z-40 bg-background scroll-mt-16 md:scroll-mt-20">
                      <About 
                        title={pendingPageContent.about?.title || pageContent.about?.title}
                        subtitle={pendingPageContent.about?.subtitle || pageContent.about?.subtitle}
                        content={aboutExtraFields.firstParagraph}
                        image_url={aboutImageUrl || pageContent.about?.image_url}
                        galleryImages={aboutGallery}
                        isEditable={true}
                        onEditField={(field) => {
                          const currentValue = getAboutFieldValue(field);
                          setAboutFieldValue(currentValue);
                          setEditingAboutField(field);
                        }}
                        onEditImage={() => {
                          setAboutImageUrl(pageContent.about?.image_url || '');
                          setShowAboutImageEditor(true);
                        }}
                        onEditGalleryImage={(image) => {
                          setEditingGalleryImage(image);
                          setGalleryImageForm({ image_url: image.image_url, alt_text: image.alt_text || '' });
                        }}
                        secondParagraph={aboutExtraFields.secondParagraph}
                        value1Title={aboutExtraFields.value1Title}
                        value1Desc={aboutExtraFields.value1Desc}
                        value2Title={aboutExtraFields.value2Title}
                        value2Desc={aboutExtraFields.value2Desc}
                        value3Title={aboutExtraFields.value3Title}
                        value3Desc={aboutExtraFields.value3Desc}
                        stat1Value={aboutExtraFields.stat1Value}
                        stat1Label={aboutExtraFields.stat1Label}
                        stat2Value={aboutExtraFields.stat2Value}
                        stat2Label={aboutExtraFields.stat2Label}
                        stat3Value={aboutExtraFields.stat3Value}
                        stat3Label={aboutExtraFields.stat3Label}
                        marqueeText={aboutExtraFields.marqueeText}
                      />
                      </div>

                      {/* ========== MINISTERIOS PREVIEW ========== */}
                      <div id="ministerios" className="relative z-40 bg-background scroll-mt-16 md:scroll-mt-20">
                        <Ministries ministries={(() => {
                          // Merge ministries with pending changes for preview
                          const merged = new Map<string, Ministry>();
                          ministries.forEach(m => merged.set(m.id, { ...m }));
                          pendingMinistryChanges.forEach((changes, id) => {
                            if (changes.isDeleted) {
                              merged.delete(id);
                            } else if (changes.isNew) {
                              merged.set(id, {
                                id,
                                slug: changes.slug || '',
                                title: changes.title || '',
                                description: changes.description || null,
                                content: changes.content || null,
                                image_url: changes.image_url || null,
                                icon: changes.icon || 'Users',
                                schedule: changes.schedule || null,
                                leader: changes.leader || null,
                                is_visible: changes.is_visible ?? true,
                                display_order: changes.display_order || 0
                              });
                            } else {
                              const existing = merged.get(id);
                              if (existing) {
                                merged.set(id, { ...existing, ...changes });
                              }
                            }
                          });
                          return Array.from(merged.values()).filter(m => m.is_visible);
                        })()}
                          isEditable={true}
                          onEditMinistry={(m) => {
                            // Si la tarjeta viene del fallback (BD sin datos), materializar
                            // los defaults en el estado para que el editor la encuentre.
                            setMinistries(prev => {
                              if (prev.some(x => x.id === m.id)) return prev;
                              const additions = DEFAULT_MINISTRIES.filter(d => !prev.some(x => x.id === d.id)) as Ministry[];
                              const list = [...prev, ...additions];
                              return (list.some(x => x.id === m.id) ? list : [...list, m]) as Ministry[];
                            });
                            setEditingMinistryId(m.id);
                          }}
                          onAddMinistry={() => setShowAddMinistry(true)}
                          title={getSectionHeaderValue('ministries', 'title')}
                          subtitle={getSectionHeaderValue('ministries', 'subtitle')}
                          onEditHeader={(field) => openSectionHeaderEditor('ministries', field)}
                        />
                      </div>

                      {/* ========== MINISTERIOS EDITOR ========== */}
                      <MinistryEditor 
                        ministries={ministries}
                        pendingChanges={pendingMinistryChanges}
                        openEditId={editingMinistryId}
                        openAdd={showAddMinistry}
                        onEditingClose={() => setEditingMinistryId(null)}
                        onAddClose={() => setShowAddMinistry(false)}
                        onAddMinistry={(ministry) => {
                          setPendingMinistryChanges(prev => {
                            const newMap = new Map(prev);
                            newMap.set(ministry.id, {
                              ...ministry,
                              isNew: true
                            });
                            return newMap;
                          });
                          setHasUnsavedChanges(true);
                        }}
                        onUpdateMinistry={(id, changes) => {
                          setPendingMinistryChanges(prev => {
                            const newMap = new Map(prev);
                            const existing = newMap.get(id) || {};
                            newMap.set(id, { ...existing, ...changes });
                            return newMap;
                          });
                          setHasUnsavedChanges(true);
                        }}
                        onDeleteMinistry={(id) => {
                          setPendingMinistryChanges(prev => {
                            const newMap = new Map(prev);
                            const existing = newMap.get(id);
                            if (existing?.isNew) {
                              // If it's a new item that hasn't been saved, just remove it
                              newMap.delete(id);
                            } else {
                              // Mark existing item for deletion
                              newMap.set(id, { ...existing, isDeleted: true });
                            }
                            return newMap;
                          });
                          setHasUnsavedChanges(true);
                        }}
                        onToggleVisibility={(id, isVisible) => {
                          setPendingMinistryChanges(prev => {
                            const newMap = new Map(prev);
                            const existing = newMap.get(id) || {};
                            newMap.set(id, { ...existing, is_visible: isVisible });
                            return newMap;
                          });
                          setHasUnsavedChanges(true);
                        }}
                      />


                      {/* ========== CONTACT SECTION ========== */}
                      <div id="contacto" className="relative z-40 bg-background scroll-mt-16 md:scroll-mt-20">
                      <Contact 
                        title={pendingPageContent.contact?.title || pageContent.contact?.title}
                        subtitle={pendingPageContent.contact?.subtitle || pageContent.contact?.subtitle}
                        isEditable={true}
                        onEditField={(field) => {
                          const currentValue = getContactFieldValue(field);
                          setContactFieldValue(currentValue);
                          setEditingContactField(field);
                        }}
                        addressLabel={contactExtraFields.addressLabel}
                        addressLine1={contactExtraFields.addressLine1}
                        addressLine2={contactExtraFields.addressLine2}
                        phoneLabel={contactExtraFields.phoneLabel}
                        phoneLine1={contactExtraFields.phoneLine1}
                        phoneLine2={contactExtraFields.phoneLine2}
                        emailLabel={contactExtraFields.emailLabel}
                        emailLine1={contactExtraFields.emailLine1}
                        emailLine2={contactExtraFields.emailLine2}
                        mapUrl={contactExtraFields.mapUrl}
                      />
                      </div>

                      {/* ========== FOOTER ========== */}
                      <Footer
                        isEditable={true}
                        onEditField={(field) => {
                          setFooterFieldValue(footerFields[field] || '');
                          setEditingFooterField(field);
                        }}
                        facebookUrl={footerFields.facebookUrl}
                        instagramUrl={footerFields.instagramUrl}
                        youtubeUrl={footerFields.youtubeUrl}
                        emailUrl={footerFields.emailUrl}
                        ministries={ministries}
                      />

                      {/* Floating WhatsApp - same as the public page (offset so it doesn't cover the sidebar) */}
                      <WhatsAppButton
                        phoneNumber={footerFields.whatsappNumber}
                        className="lg:right-[calc(18rem_+_1rem)]"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </main>


        {/* Right Sidebar - Tabbed Panel (Desktop) */}
        <aside className="hidden lg:flex lg:flex-col fixed top-[calc(2.75rem+2.5rem)] sm:top-[calc(3.5rem+3rem)] right-0 w-72 h-[calc(100vh-(2.75rem+2.5rem))] sm:h-[calc(100vh-(3.5rem+3rem))] border-l border-border/30 bg-gradient-to-b from-card via-card to-muted/50 backdrop-blur-xl z-40">
          
          {/* Tab Content */}
          {sidebarTab === 'colors' ? (
            <>
              {/* Color Pickers - Compact Grid */}
              <div className="p-3 space-y-2 flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'primary' as const, label: 'Principal', icon: '🎨' },
                    { key: 'secondary' as const, label: 'Secundario', icon: '✨' },
                    { key: 'accent' as const, label: 'Acento', icon: '💫' },
                    { key: 'background' as const, label: 'Fondo', icon: '🌙' },
                    { key: 'headerBg' as const, label: 'Fondo Header', icon: '🔲' },
                    { key: 'headerBorder' as const, label: 'Borde Header', icon: '📐' },
                    { key: 'headerText' as const, label: 'Texto Header', icon: '📝' },
                  ].map(({ key, label, icon }) => (
                    <div key={key} className="group p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all border border-transparent hover:border-border/50">
                      <Label className="text-[10px] font-medium text-muted-foreground flex items-center gap-1 mb-1.5">
                        <span className="text-xs">{icon}</span> {label}
                      </Label>
                      <div className="flex items-center gap-1.5">
                        <div className="relative shrink-0">
                          <input 
                            type="color" 
                            value={pendingColors[key] || '#1a1a1a'}
                            onChange={(e) => handleColorChange(key, e.target.value)}
                            className="w-8 h-8 rounded-lg border-2 border-border/50 cursor-pointer shadow-sm hover:shadow-md transition-shadow appearance-none bg-transparent"
                            style={{ backgroundColor: pendingColors[key] || '#1a1a1a' }}
                          />
                        </div>
                        <Input 
                          value={pendingColors[key] || ''}
                          onChange={(e) => handleColorChange(key, e.target.value)}
                          className="flex-1 text-[10px] font-mono h-8 bg-background/50 border-border/30 rounded-md px-1.5"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Logo Uploader Section */}
              <div className="p-3 border-t border-border/30">
                <Label className="text-[10px] font-medium text-muted-foreground flex items-center gap-1 mb-2">
                  <span className="text-xs">🏷️</span> Logo del Sitio
                </Label>
                <div className="flex items-center gap-2">
                  {(pendingBrandingFields?.logoUrl || brandingFields.logoUrl) ? (
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-border/50 bg-muted/30">
                      <img 
                        src={pendingBrandingFields?.logoUrl || brandingFields.logoUrl} 
                        alt="Logo" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg border border-dashed border-border/50 bg-muted/30 flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="flex-1 space-y-1">
                    <input
                      ref={logoImageRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = await uploadImage(file, 'images');
                          if (url) {
                            setPendingBrandingFields({ logoUrl: url });
                            setHasUnsavedChanges(true);
                          }
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-7 text-[10px]"
                      onClick={() => logoImageRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Upload className="w-3 h-3 mr-1" />}
                      Subir Logo
                    </Button>
                    {(pendingBrandingFields?.logoUrl || brandingFields.logoUrl) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-6 text-[9px] text-destructive hover:text-destructive"
                        onClick={() => {
                          setPendingBrandingFields({ logoUrl: '' });
                          setHasUnsavedChanges(true);
                        }}
                      >
                        <X className="w-3 h-3 mr-1" />
                        Quitar
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons - Compact and always visible */}
              <div className="p-3 pt-2 border-t border-border/30 space-y-1.5 shrink-0 bg-card/80">
                {/* Scheduled Mode Toggle */}
                <div className={`p-2 rounded-lg border transition-all ${isScheduledMode ? 'bg-primary/10 border-primary/30' : 'bg-muted/30 border-border/30'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Calendar className={`w-3.5 h-3.5 ${isScheduledMode ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="text-[10px] font-medium">Modo Programado</span>
                    </div>
                    <Switch
                      checked={isScheduledMode}
                      onCheckedChange={(checked) => {
                        setIsScheduledMode(checked);
                        if (!checked) {
                          setScheduledDateTime(null);
                          setScheduledTitle('');
                        }
                      }}
                      className="scale-75"
                    />
                  </div>
                  
                  {isScheduledMode && (
                    <div className="space-y-2 pt-2 border-t border-border/30">
                      <div>
                        <Label className="text-[9px] text-muted-foreground">Título (opcional)</Label>
                        <Input
                          value={scheduledTitle}
                          onChange={(e) => setScheduledTitle(e.target.value)}
                          placeholder="Ej: Actualización Navidad"
                          className="h-7 text-[10px] mt-0.5"
                        />
                      </div>
                      <div>
                        <Label className="text-[9px] text-muted-foreground">Fecha y hora de publicación</Label>
                        <Input
                          type="datetime-local"
                          value={scheduledDateTime && isValid(scheduledDateTime) ? format(scheduledDateTime, "yyyy-MM-dd'T'HH:mm") : ''}
                          onChange={(e) => {
                            if (e.target.value) {
                              const newDate = new Date(e.target.value);
                              setScheduledDateTime(isValid(newDate) ? newDate : null);
                            } else {
                              setScheduledDateTime(null);
                            }
                          }}
                          min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                          className="h-7 text-[10px] mt-0.5"
                        />
                      </div>
                      {scheduledDateTime && isValid(scheduledDateTime) && (
                        <p className="text-[9px] text-primary">
                          📅 Se publicará: {format(scheduledDateTime, "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <Button 
                  className={`w-full h-9 rounded-lg transition-opacity shadow-lg text-sm ${
                    isScheduledMode 
                      ? 'bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-primary/20' 
                      : 'bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-primary/20'
                  }`}
                  onClick={handleSaveOrSchedule}
                  disabled={!hasUnsavedChanges || saving || (isScheduledMode && !scheduledDateTime)}
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : isScheduledMode ? (
                    <Calendar className="w-3.5 h-3.5 mr-1.5" />
                  ) : (
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  {isScheduledMode 
                    ? (scheduledDateTime ? 'Programar Cambios' : 'Selecciona fecha/hora')
                    : (hasUnsavedChanges ? 'Guardar Cambios' : 'Sin cambios')
                  }
                </Button>

                <div className="flex gap-1.5">
                  <Button 
                    variant="outline" 
                    className="flex-1 h-8 rounded-lg border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all text-xs" 
                    onClick={() => {
                      resetAllChanges();
                      setIsScheduledMode(false);
                      setScheduledDateTime(null);
                      setScheduledTitle('');
                    }}
                    disabled={!hasUnsavedChanges || saving}
                  >
                    <X className="w-3.5 h-3.5 mr-1" />
                    Descartar
                  </Button>

                  <Button 
                    variant="ghost" 
                    className="flex-1 h-8 rounded-lg text-muted-foreground hover:text-foreground text-xs" 
                    onClick={handleResetColors}
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Resetear
                  </Button>
                </div>

                {/* View scheduled content button */}
                <Button 
                  variant="outline"
                  className="w-full h-8 rounded-lg border-border/50 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all text-xs"
                  onClick={() => setShowScheduleCalendar(true)}
                >
                  <Eye className="w-3 h-3 mr-1.5" />
                  Ver Programaciones
                </Button>
              </div>
            </>
          ) : (
            /* Suggestions Tab Content */
            <div className="flex-1 overflow-y-auto">
              <div className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium text-foreground">Notas Pendientes</span>
                  </div>
                  <Link 
                    to="/admin/sugerencias" 
                    className="text-[10px] text-primary hover:underline"
                  >
                    Ver todas
                  </Link>
                </div>

                {pendingSuggestions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">¡Sin tareas pendientes!</p>
                    <p className="text-xs mt-1 opacity-70">Las notas aparecerán aquí</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pendingSuggestions.map((suggestion) => {
                      const isConfirming = confirmingComplete === suggestion.id;
                      const targetDate = suggestion.target_date ? new Date(suggestion.target_date) : null;
                      const isOverdue = targetDate && isPast(targetDate) && !isToday(targetDate);
                      const isDueToday = targetDate && isToday(targetDate);
                      const isDueTomorrow = targetDate && isTomorrow(targetDate);
                      const daysUntil = targetDate ? differenceInDays(targetDate, new Date()) : null;
                      
                      return (
                        <div 
                          key={suggestion.id} 
                          className={`p-3 rounded-lg border text-sm transition-all ${
                            isConfirming 
                              ? 'bg-green-500/20 border-green-500/50 ring-1 ring-green-500/30'
                              : suggestion.priority === 'urgent' 
                              ? 'bg-destructive/10 border-destructive/30 text-destructive' 
                              : suggestion.priority === 'high'
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
                              : 'bg-muted/30 border-border/30 text-muted-foreground'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="shrink-0 mt-0.5 text-base">
                              {suggestion.suggestion_type === 'note' ? '📝' : 
                               suggestion.suggestion_type === 'task' ? '✅' : 
                               suggestion.suggestion_type === 'idea' ? '💡' : '📌'}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-foreground">{suggestion.title}</p>
                              {suggestion.description && (
                                <p className="text-xs opacity-75 line-clamp-3 mt-1">{suggestion.description}</p>
                              )}
                              {/* Target date display */}
                              {targetDate && (
                                <p className={`text-[10px] mt-2 flex items-center gap-1 ${
                                  isOverdue ? 'text-destructive font-medium' : 
                                  isDueToday ? 'text-amber-600 dark:text-amber-400 font-medium' : 
                                  isDueTomorrow ? 'text-blue-600 dark:text-blue-400' :
                                  'opacity-60'
                                }`}>
                                  <Calendar className="w-3 h-3" />
                                  {isOverdue ? '⚠️ Vencida: ' : isDueToday ? '🔔 Hoy: ' : isDueTomorrow ? '📅 Mañana: ' : ''}
                                  {format(targetDate, "d 'de' MMM", { locale: es })}
                                  {suggestion.target_time && (
                                    <span className="text-primary font-medium ml-0.5">
                                      {suggestion.target_time.slice(0, 5)}
                                    </span>
                                  )}
                                  {daysUntil !== null && daysUntil > 1 && ` (en ${daysUntil} días)`}
                                </p>
                              )}
                            </div>
                            {/* Complete button with double confirmation */}
                            <div className="shrink-0">
                              {isConfirming ? (
                                <div className="flex items-center gap-1">
                                  {confirmStep === 1 ? (
                                    <>
                                      <span className="text-[9px] text-green-600 dark:text-green-400 mr-0.5">¿Completar?</span>
                                      <button
                                        onClick={() => handleCompleteSuggestion(suggestion.id)}
                                        className="p-1.5 rounded bg-green-500 hover:bg-green-600 text-white transition-colors"
                                        title="Confirmar"
                                      >
                                        <Check className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={cancelConfirmation}
                                        className="p-1.5 rounded bg-muted hover:bg-muted/80 transition-colors"
                                        title="Cancelar"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-[9px] text-green-600 dark:text-green-400 mr-0.5 font-medium">¿Seguro?</span>
                                      <button
                                        onClick={() => handleCompleteSuggestion(suggestion.id)}
                                        className="p-1.5 rounded bg-green-600 hover:bg-green-700 text-white transition-colors animate-pulse"
                                        title="Sí, completar"
                                      >
                                        <CheckCircle2 className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={cancelConfirmation}
                                        className="p-1.5 rounded bg-destructive/80 hover:bg-destructive text-white transition-colors"
                                        title="No, cancelar"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleCompleteSuggestion(suggestion.id)}
                                  className="p-1.5 rounded hover:bg-green-500/20 text-muted-foreground hover:text-green-600 transition-colors"
                                  title="Marcar como completada"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {pendingSuggestionsCount > pendingSuggestions.length && (
                      <Link 
                        to="/admin/sugerencias"
                        className="block p-2 text-center text-xs text-primary hover:underline bg-muted/30 rounded-lg border border-border/30"
                      >
                        Ver {pendingSuggestionsCount - pendingSuggestions.length} notas más →
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Mobile Color Panel Modal - Enhanced */}
      <Dialog open={showColorPanel} onOpenChange={setShowColorPanel}>
        <DialogContent className="max-w-[95vw] sm:max-w-sm rounded-2xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-primary/10 text-primary">
                <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <span className="text-sm sm:text-base font-bold">Paleta de Colores</span>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-normal">Personaliza tu sitio</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-2 sm:space-y-3 mt-2">
            {[
              { key: 'primary' as const, label: 'Principal', icon: '🎨' },
              { key: 'secondary' as const, label: 'Secundario', icon: '✨' },
              { key: 'accent' as const, label: 'Acento', icon: '💫' },
              { key: 'background' as const, label: 'Fondo', icon: '🌙' },
              { key: 'headerBg' as const, label: 'Fondo Header', icon: '🔲' },
              { key: 'headerBorder' as const, label: 'Borde Header', icon: '📐' },
              { key: 'headerText' as const, label: 'Texto Header', icon: '📝' },
            ].map(({ key, label, icon }) => (
              <div key={key} className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-muted/30 border border-border/30">
                <Label className="text-[10px] sm:text-xs font-medium text-muted-foreground flex items-center gap-1 sm:gap-1.5 mb-1.5 sm:mb-2">
                  <span>{icon}</span> {label}
                </Label>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={pendingColors[key] || '#1a1a1a'}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl border-2 border-border/50 cursor-pointer"
                  />
                  <Input 
                    value={pendingColors[key] || ''}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    className="flex-1 text-[10px] sm:text-xs font-mono h-8 sm:h-10 rounded-lg"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Logo Upload Section - Mobile */}
          <div className="p-3 rounded-lg sm:rounded-xl bg-muted/30 border border-border/30">
            <Label className="text-[10px] sm:text-xs font-medium text-muted-foreground flex items-center gap-1 sm:gap-1.5 mb-2">
              🏷️ Logo del Sitio
            </Label>
            <div className="flex items-center gap-3">
              {(pendingBrandingFields?.logoUrl || brandingFields.logoUrl) ? (
                <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-border/50 bg-muted/30">
                  <img 
                    src={pendingBrandingFields?.logoUrl || brandingFields.logoUrl} 
                    alt="Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-lg border border-dashed border-border/50 bg-muted/30 flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-muted-foreground/50" />
                </div>
              )}
              <div className="flex-1 space-y-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs"
                  onClick={() => logoImageRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
                  Subir Logo
                </Button>
                {(pendingBrandingFields?.logoUrl || brandingFields.logoUrl) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-7 text-[10px] text-destructive hover:text-destructive"
                    onClick={() => {
                      setPendingBrandingFields({ logoUrl: '' });
                      setHasUnsavedChanges(true);
                    }}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Quitar Logo
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Button 
              className="w-full h-9 sm:h-11 rounded-lg sm:rounded-xl bg-gradient-to-r from-primary to-secondary text-xs sm:text-sm" 
              onClick={saveAllChanges}
              disabled={!hasUnsavedChanges || saving}
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              )}
              {hasUnsavedChanges ? 'Guardar' : 'Sin cambios'}
            </Button>

            <Button 
              variant="outline" 
              className="w-full h-8 sm:h-10 rounded-lg sm:rounded-xl text-xs sm:text-sm" 
              onClick={resetAllChanges}
              disabled={!hasUnsavedChanges || saving}
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Descartar
            </Button>

            <Button 
              variant="ghost" 
              className="w-full h-7 sm:h-9 rounded-lg sm:rounded-xl text-[10px] sm:text-xs text-muted-foreground" 
              onClick={handleResetColors}
            >
              <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" />
              Restablecer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hero Edit Modal - Mobile optimized */}
      <Dialog open={showHeroEditor} onOpenChange={setShowHeroEditor}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-xl sm:rounded-2xl p-3 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-muted text-foreground">
                <Video className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <span className="text-sm sm:text-lg font-bold">Editar Hero</span>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-normal">Sección principal</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Título Principal</Label>
                <Input 
                  value={heroForm.mainTitle} 
                  onChange={(e) => setHeroForm({ ...heroForm, mainTitle: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Título Acento</Label>
                <Input 
                  value={heroForm.accentTitle} 
                  onChange={(e) => setHeroForm({ ...heroForm, accentTitle: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Etiqueta Sábado</Label>
                <Input 
                  value={heroForm.saturdayLabel} 
                  onChange={(e) => setHeroForm({ ...heroForm, saturdayLabel: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Hora Sábado</Label>
                <Input 
                  value={heroForm.saturdayTime} 
                  onChange={(e) => setHeroForm({ ...heroForm, saturdayTime: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Etiqueta Domingo</Label>
                <Input 
                  value={heroForm.sundayLabel} 
                  onChange={(e) => setHeroForm({ ...heroForm, sundayLabel: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Hora Domingo</Label>
                <Input 
                  value={heroForm.sundayTime} 
                  onChange={(e) => setHeroForm({ ...heroForm, sundayTime: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Tagline 1</Label>
                <Input 
                  value={heroForm.tagline1} 
                  onChange={(e) => setHeroForm({ ...heroForm, tagline1: e.target.value })}
                  className="h-9 text-sm"
                  placeholder="CREE."
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Tagline 2</Label>
                <Input 
                  value={heroForm.tagline2} 
                  onChange={(e) => setHeroForm({ ...heroForm, tagline2: e.target.value })}
                  className="h-9 text-sm"
                  placeholder="PERTENECE."
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Tagline 3</Label>
                <Input 
                  value={heroForm.tagline3} 
                  onChange={(e) => setHeroForm({ ...heroForm, tagline3: e.target.value })}
                  className="h-9 text-sm"
                  placeholder="TRANSFORMA."
                />
              </div>
            </div>

            {/* Device Tab Selection */}
            <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-lg">
              <button
                type="button"
                onClick={() => setHeroDeviceTab('desktop')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  heroDeviceTab === 'desktop' 
                    ? 'bg-background shadow-sm text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Monitor className="w-4 h-4" /> Escritorio
              </button>
              <button
                type="button"
                onClick={() => setHeroDeviceTab('mobile')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  heroDeviceTab === 'mobile' 
                    ? 'bg-background shadow-sm text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Smartphone className="w-4 h-4" /> Móvil
              </button>
            </div>

            {/* Desktop Media Configuration */}
            {heroDeviceTab === 'desktop' && (
              <div className="space-y-4 p-4 bg-muted/30 rounded-xl border border-border">
                <div className="flex flex-col gap-2">
                  <Label className="flex items-center gap-2">
                    <Monitor className="w-4 h-4" /> Fondo para Escritorio
                  </Label>
                  <div className="flex flex-wrap items-center gap-1 bg-background rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => setHeroMediaForm({ ...heroMediaForm, mediaType: 'video' })}
                      className={`px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-1 ${
                        heroMediaForm.mediaType === 'video' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Video className="w-3 h-3" /> YouTube
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeroMediaForm({ ...heroMediaForm, mediaType: 'video_file' })}
                      className={`px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-1 ${
                        heroMediaForm.mediaType === 'video_file' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Upload className="w-3 h-3" /> Subir Video
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeroMediaForm({ ...heroMediaForm, mediaType: 'image' })}
                      className={`px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-1 ${
                        heroMediaForm.mediaType === 'image' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <ImageIcon className="w-3 h-3" /> Imagen
                    </button>
                  </div>
                </div>
                
                {heroMediaForm.mediaType === 'video' && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">URL del Video (YouTube)</Label>
                    <Input 
                      value={heroMediaForm.videoUrl} 
                      onChange={(e) => setHeroMediaForm({ ...heroMediaForm, videoUrl: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=... o youtu.be/..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Pega cualquier URL de YouTube - se convertirá automáticamente al formato correcto.
                    </p>
                  </div>
                )}

                {heroMediaForm.mediaType === 'video_file' && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Subir Video (MP4, WebM, MOV - máx. 100MB)</Label>
                    <input 
                      type="file" 
                      ref={heroVideoRef}
                      onChange={handleHeroVideoUploadForMedia}
                      accept="video/mp4,video/webm,video/ogg,video/quicktime"
                      className="hidden"
                    />
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => heroVideoRef.current?.click()}
                        disabled={uploading}
                        className="flex-1"
                      >
                        {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                        Subir Video
                      </Button>
                      {heroMediaForm.videoFileUrl && (
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="icon"
                          onClick={() => setHeroMediaForm({ ...heroMediaForm, videoFileUrl: '' })}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {heroMediaForm.videoFileUrl && (
                      <div className="mt-2 rounded-lg overflow-hidden border border-border">
                        <video src={heroMediaForm.videoFileUrl} className="w-full h-32 object-cover" muted />
                        <p className="text-xs text-center py-1 bg-muted text-muted-foreground">Video cargado</p>
                      </div>
                    )}
                  </div>
                )}

                {heroMediaForm.mediaType === 'image' && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Imagen de Fondo</Label>
                    <input 
                      type="file" 
                      ref={heroImageRef}
                      onChange={handleHeroImageUploadForMedia}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => heroImageRef.current?.click()}
                        disabled={uploading}
                        className="flex-1"
                      >
                        {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                        Subir Imagen
                      </Button>
                      {heroMediaForm.imageUrl && (
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="icon"
                          onClick={() => setHeroMediaForm({ ...heroMediaForm, imageUrl: '' })}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {heroMediaForm.imageUrl && (
                      <div className="mt-2 rounded-lg overflow-hidden border border-border">
                        <img src={heroMediaForm.imageUrl} alt="Preview" className="w-full h-32 object-cover" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Mobile Media Configuration */}
            {heroDeviceTab === 'mobile' && (
              <div className="space-y-4 p-4 bg-muted/30 rounded-xl border border-border">
                <div className="flex flex-col gap-2">
                  <Label className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4" /> Fondo para Móvil
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Configura un fondo específico para dispositivos móviles. Si no se configura, se usará el de escritorio.
                  </p>
                  <div className="flex flex-wrap items-center gap-1 bg-background rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => setHeroMediaForm({ ...heroMediaForm, mobileMediaType: undefined })}
                      className={`px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-1 ${
                        !heroMediaForm.mobileMediaType 
                          ? 'bg-primary text-primary-foreground' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Usar escritorio
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeroMediaForm({ ...heroMediaForm, mobileMediaType: 'video' })}
                      className={`px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-1 ${
                        heroMediaForm.mobileMediaType === 'video' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Video className="w-3 h-3" /> YouTube
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeroMediaForm({ ...heroMediaForm, mobileMediaType: 'video_file' })}
                      className={`px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-1 ${
                        heroMediaForm.mobileMediaType === 'video_file' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Upload className="w-3 h-3" /> Subir Video
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeroMediaForm({ ...heroMediaForm, mobileMediaType: 'image' })}
                      className={`px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-1 ${
                        heroMediaForm.mobileMediaType === 'image' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <ImageIcon className="w-3 h-3" /> Imagen
                    </button>
                  </div>
                </div>
                
                {heroMediaForm.mobileMediaType === 'video' && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">URL del Video (YouTube) para Móvil</Label>
                    <Input 
                      value={heroMediaForm.mobileVideoUrl || ''} 
                      onChange={(e) => setHeroMediaForm({ ...heroMediaForm, mobileVideoUrl: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=... o youtu.be/..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Recomendamos usar un video vertical o cuadrado para móviles.
                    </p>
                  </div>
                )}

                {heroMediaForm.mobileMediaType === 'video_file' && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Subir Video para Móvil (MP4, WebM, MOV)</Label>
                    <input 
                      type="file" 
                      ref={heroMobileVideoRef}
                      onChange={handleHeroMobileVideoUpload}
                      accept="video/mp4,video/webm,video/ogg,video/quicktime"
                      className="hidden"
                    />
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => heroMobileVideoRef.current?.click()}
                        disabled={uploading}
                        className="flex-1"
                      >
                        {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                        Subir Video Móvil
                      </Button>
                      {heroMediaForm.mobileVideoFileUrl && (
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="icon"
                          onClick={() => setHeroMediaForm({ ...heroMediaForm, mobileVideoFileUrl: '' })}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {heroMediaForm.mobileVideoFileUrl && (
                      <div className="mt-2 rounded-lg overflow-hidden border border-border">
                        <video src={heroMediaForm.mobileVideoFileUrl} className="w-full h-32 object-cover" muted />
                        <p className="text-xs text-center py-1 bg-muted text-muted-foreground">Video móvil cargado</p>
                      </div>
                    )}
                  </div>
                )}

                {heroMediaForm.mobileMediaType === 'image' && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Imagen de Fondo para Móvil</Label>
                    <input 
                      type="file" 
                      ref={heroMobileImageRef}
                      onChange={handleHeroMobileImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => heroMobileImageRef.current?.click()}
                        disabled={uploading}
                        className="flex-1"
                      >
                        {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                        Subir Imagen Móvil
                      </Button>
                      {heroMediaForm.mobileImageUrl && (
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="icon"
                          onClick={() => setHeroMediaForm({ ...heroMediaForm, mobileImageUrl: '' })}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {heroMediaForm.mobileImageUrl && (
                      <div className="mt-2 rounded-lg overflow-hidden border border-border">
                        <img src={heroMediaForm.mobileImageUrl} alt="Preview móvil" className="w-full h-32 object-cover" />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Recomendamos una imagen vertical (9:16) para mejor visualización en móviles.
                    </p>
                  </div>
                )}

                {!heroMediaForm.mobileMediaType && (
                  <div className="p-4 bg-background rounded-lg border border-dashed border-border text-center">
                    <p className="text-sm text-muted-foreground">
                      Se usará el mismo fondo configurado para escritorio en dispositivos móviles.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowHeroEditor(false)}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={saveHeroChanges}>
              <Save className="w-4 h-4 mr-2" />
              Aplicar Cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Section Edit Modal */}
      <Dialog open={editingSection !== null} onOpenChange={(open) => !open && setEditingSection(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
              {editingField === 'title' && <Type className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />}
              {editingField === 'content' && <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />}
              {editingField === 'media' && <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />}
              {editingField === 'all' && <Layout className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />}
              Editar {editingSection === 'hero' ? 'Inicio' : editingSection === 'about' ? 'Nosotros' : editingSection === 'contact' ? 'Contacto' : editingSection}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 sm:space-y-4">
            {(editingField === 'all' || editingField === 'title') && (
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="flex items-center gap-2 text-xs sm:text-sm">
                  <Type className="w-3 h-3 sm:w-4 sm:h-4" /> Título
                </Label>
                <Input 
                  value={formData.title} 
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                  placeholder="Título de la sección"
                  className="h-9 text-sm"
                />
              </div>
            )}
            
            {(editingField === 'all' || editingField === 'subtitle') && (
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Subtítulo</Label>
                <Input 
                  value={formData.subtitle} 
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Subtítulo opcional"
                  className="h-9 text-sm"
                />
              </div>
            )}
            
            {(editingField === 'all' || editingField === 'content') && (
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="flex items-center gap-2 text-xs sm:text-sm">
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4" /> Contenido
                </Label>
                <Textarea 
                  value={formData.content} 
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })} 
                  rows={3}
                  placeholder="Contenido de la sección"
                  className="text-sm"
                />
              </div>
            )}
            
            {/* Media Field - Hero with Video/Image Toggle */}
            {(editingField === 'all' || editingField === 'media') && editingSection === 'hero' && (
              <div className="space-y-4 p-4 bg-muted/30 rounded-xl border border-border">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Video className="w-4 h-4" /> Tipo de Fondo
                  </Label>
                  <div className="flex items-center gap-1 bg-background rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, media_type: 'video' })}
                      className={`px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-1 ${
                        formData.media_type === 'video' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Video className="w-3 h-3" /> Video
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, media_type: 'image' })}
                      className={`px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-1 ${
                        formData.media_type === 'image' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <ImageIcon className="w-3 h-3" /> Imagen
                    </button>
                  </div>
                </div>
                
                {formData.media_type === 'video' ? (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">URL del Video (YouTube)</Label>
                    <Input 
                      value={formData.video_url} 
                      onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                      placeholder="https://www.youtube.com/embed/..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Usa el formato embed: https://www.youtube.com/embed/VIDEO_ID
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Imagen de Fondo</Label>
                    <input 
                      type="file" 
                      ref={heroImageRef}
                      onChange={handleHeroImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => heroImageRef.current?.click()}
                        disabled={uploading}
                        className="flex-1"
                      >
                        {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                        Subir Imagen
                      </Button>
                      {formData.image_url && (
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="icon"
                          onClick={() => setFormData({ ...formData, image_url: '' })}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {formData.image_url && (
                      <div className="mt-2 rounded-lg overflow-hidden border border-border">
                        <img src={formData.image_url} alt="Preview" className="w-full h-32 object-cover" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Media Field - Other Sections */}
            {(editingField === 'all' || editingField === 'media') && editingSection !== 'hero' && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> Imagen
                </Label>
                <input 
                  type="file" 
                  ref={sectionImageRef}
                  onChange={handleSectionImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => sectionImageRef.current?.click()}
                    disabled={uploading}
                    className="flex-1"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    Subir Imagen
                  </Button>
                  {formData.image_url && (
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="icon"
                      onClick={() => setFormData({ ...formData, image_url: '' })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {formData.image_url && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-border">
                    <img src={formData.image_url} alt="Preview" className="w-full h-32 object-cover" />
                  </div>
                )}
              </div>
            )}
            
            <div className="flex gap-2 justify-end pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setEditingSection(null)}>
                <X className="w-4 h-4 mr-1" /> Cancelar
              </Button>
              <Button onClick={saveSectionContent} disabled={saving || uploading}>
                {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />} Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Service Edit Modal */}
      <Dialog open={editingService !== null} onOpenChange={(open) => !open && setEditingService(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Church className="w-4 h-4 sm:w-5 sm:h-5 text-turquoise" />
              Editar Servicio
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">Título *</Label>
              <Input value={serviceForm.title} onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })} className="h-9 text-sm" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Día</Label>
                <Input value={serviceForm.day} onChange={(e) => setServiceForm({ ...serviceForm, day: e.target.value })} placeholder="Ej: Domingo" className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Hora</Label>
                <Input value={serviceForm.time} onChange={(e) => setServiceForm({ ...serviceForm, time: e.target.value })} placeholder="Ej: 10:00 AM" className="h-9 text-sm" />
              </div>
            </div>
            
            {/* Visual Icon Selector */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">Seleccionar Icono</Label>
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 p-3 bg-muted/30 rounded-xl border border-border max-h-48 overflow-y-auto">
                {Object.entries(iconMap).map(([iconName, IconComponent]) => (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setServiceForm({ ...serviceForm, icon: iconName })}
                    className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
                      serviceForm.icon === iconName 
                        ? 'bg-turquoise text-background ring-2 ring-turquoise ring-offset-2 ring-offset-background' 
                        : 'bg-card hover:bg-card/80 text-muted-foreground hover:text-foreground border border-border'
                    }`}
                    title={iconLabels[iconName] || iconName}
                  >
                    <IconComponent className="w-5 h-5" />
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                Seleccionado: <span className="text-turquoise font-medium">{iconLabels[serviceForm.icon] || serviceForm.icon}</span>
              </p>
            </div>
            
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">Descripción Breve (se muestra en la tarjeta)</Label>
              <Textarea value={serviceForm.description} onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })} rows={2} className="text-sm" placeholder="Descripción breve del servicio" />
            </div>
            
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">Contenido Detallado (se muestra en "Más Información")</Label>
              <Textarea value={serviceForm.extended_content} onChange={(e) => setServiceForm({ ...serviceForm, extended_content: e.target.value })} rows={4} className="text-sm" placeholder="Información detallada del servicio que aparece al hacer clic en 'Más Información'" />
            </div>
            
            <div className="flex gap-2 justify-between pt-3 sm:pt-4 border-t border-border">
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={deleteService} 
                disabled={saving}
              >
                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Eliminar
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditingService(null)}><X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Cancelar</Button>
                <Button size="sm" onClick={saveService} disabled={saving}>
                  {saving ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 animate-spin" /> : <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />} Guardar
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Service Modal */}
      <Dialog open={showAddService} onOpenChange={setShowAddService}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-turquoise" />
              Nuevo Servicio
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">Título *</Label>
              <Input value={serviceForm.title} onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })} placeholder="Nombre del servicio" className="h-9 text-sm" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Día</Label>
                <Input value={serviceForm.day} onChange={(e) => setServiceForm({ ...serviceForm, day: e.target.value })} placeholder="Ej: Domingo" className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Hora</Label>
                <Input value={serviceForm.time} onChange={(e) => setServiceForm({ ...serviceForm, time: e.target.value })} placeholder="Ej: 10:00 AM" className="h-9 text-sm" />
              </div>
            </div>
            
            {/* Visual Icon Selector */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">Seleccionar Icono</Label>
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 p-3 bg-muted/30 rounded-xl border border-border max-h-48 overflow-y-auto">
                {Object.entries(iconMap).map(([iconName, IconComponent]) => (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setServiceForm({ ...serviceForm, icon: iconName })}
                    className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
                      serviceForm.icon === iconName 
                        ? 'bg-turquoise text-background ring-2 ring-turquoise ring-offset-2 ring-offset-background' 
                        : 'bg-card hover:bg-card/80 text-muted-foreground hover:text-foreground border border-border'
                    }`}
                    title={iconLabels[iconName] || iconName}
                  >
                    <IconComponent className="w-5 h-5" />
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                Seleccionado: <span className="text-turquoise font-medium">{iconLabels[serviceForm.icon] || serviceForm.icon}</span>
              </p>
            </div>
            
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">Descripción Breve (se muestra en la tarjeta)</Label>
              <Textarea value={serviceForm.description} onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })} rows={2} className="text-sm" placeholder="Descripción breve del servicio" />
            </div>
            
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">Contenido Detallado (se muestra en "Más Información")</Label>
              <Textarea value={serviceForm.extended_content} onChange={(e) => setServiceForm({ ...serviceForm, extended_content: e.target.value })} rows={4} className="text-sm" placeholder="Información detallada del servicio que aparece al hacer clic en 'Más Información'" />
            </div>
            
            <div className="flex gap-2 justify-end pt-3 sm:pt-4 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setShowAddService(false)}><X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Cancelar</Button>
              <Button size="sm" onClick={addService} disabled={saving}>
                {saving ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 animate-spin" /> : <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />} Crear
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Announcement Edit Modal */}
      <Dialog open={editingAnnouncement !== null} onOpenChange={(open) => !open && setEditingAnnouncement(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Megaphone className="w-4 h-4 sm:w-5 sm:h-5 text-pink" />
              Editar Anuncio
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">Título *</Label>
              <Input value={announcementForm.title} onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">Descripción (breve)</Label>
              <Textarea value={announcementForm.description} onChange={(e) => setAnnouncementForm({ ...announcementForm, description: e.target.value })} rows={2} className="text-sm" placeholder="Texto que aparecerá sobre la imagen" />
            </div>
            
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">Imagen del Anuncio *</Label>
              <input 
                type="file" 
                ref={announcementImageRef}
                onChange={handleAnnouncementImageUpload}
                accept="image/*"
                className="hidden"
              />
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => announcementImageRef.current?.click()}
                  disabled={uploading}
                  className="flex-1"
                >
                  {uploading ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" /> : <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />}
                  Subir Imagen
                </Button>
                {announcementForm.image_url && (
                  <Button 
                    type="button" 
                    variant="destructive" 
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setAnnouncementForm({ ...announcementForm, image_url: '' })}
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                )}
              </div>
              {announcementForm.image_url && (
                <div className="mt-2 rounded-lg overflow-hidden border border-border">
                  <img src={announcementForm.image_url} alt="Preview" className="w-full h-32 sm:h-40 object-cover" />
                </div>
              )}
              <p className="text-xs text-muted-foreground">La imagen se mostrará como fondo del anuncio en el carrusel</p>
            </div>
            
            <div className="flex gap-2 justify-between pt-3 sm:pt-4 border-t border-border">
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={deleteAnnouncement} 
                disabled={saving}
              >
                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Eliminar
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditingAnnouncement(null)}><X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Cancelar</Button>
                <Button size="sm" onClick={saveAnnouncement} disabled={saving || uploading}>
                  {saving ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 animate-spin" /> : <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />} Guardar
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Announcement Modal */}
      <Dialog open={showAddAnnouncement} onOpenChange={setShowAddAnnouncement}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-pink" />
              Nuevo Anuncio
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">Título *</Label>
              <Input value={announcementForm.title} onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })} placeholder="Título del anuncio" className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">Descripción (breve)</Label>
              <Textarea value={announcementForm.description} onChange={(e) => setAnnouncementForm({ ...announcementForm, description: e.target.value })} rows={2} placeholder="Texto que aparecerá sobre la imagen" className="text-sm" />
            </div>
            
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">Imagen *</Label>
              <input 
                type="file" 
                onChange={handleAnnouncementImageUpload}
                accept="image/*"
                className="hidden"
                id="new-announcement-image"
              />
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('new-announcement-image')?.click()}
                  disabled={uploading}
                  className="flex-1"
                >
                  {uploading ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" /> : <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />}
                  Subir Imagen
                </Button>
              </div>
              {announcementForm.image_url && (
                <div className="mt-2 rounded-lg overflow-hidden border border-border">
                  <img src={announcementForm.image_url} alt="Preview" className="w-full h-32 sm:h-40 object-cover" />
                </div>
              )}
              <p className="text-xs text-muted-foreground">Sube una imagen atractiva para el carrusel de anuncios</p>
            </div>
            
            <div className="flex gap-2 justify-end pt-3 sm:pt-4 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setShowAddAnnouncement(false)}><X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Cancelar</Button>
              <Button size="sm" onClick={addAnnouncement} disabled={saving || uploading}>
                {saving ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 animate-spin" /> : <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />} Crear
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* About Field Edit Modal */}
      <Dialog open={editingAboutField !== null} onOpenChange={(open) => !open && setEditingAboutField(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Edit3 className="w-4 h-4 sm:w-5 sm:h-5 text-purple" />
              Editar: {editingAboutField ? getAboutFieldLabel(editingAboutField) : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">Nuevo Valor</Label>
              {editingAboutField && ['content', 'secondParagraph', 'value1Desc', 'value2Desc', 'value3Desc'].includes(editingAboutField) ? (
                <Textarea 
                  value={aboutFieldValue} 
                  onChange={(e) => setAboutFieldValue(e.target.value)}
                  rows={4}
                  className="text-sm"
                  placeholder="Escribe aquí..."
                />
              ) : (
                <Input 
                  value={aboutFieldValue} 
                  onChange={(e) => setAboutFieldValue(e.target.value)}
                  className="h-9 text-sm"
                  placeholder="Escribe aquí..."
                />
              )}
            </div>
            <div className="flex gap-2 justify-end pt-3 sm:pt-4 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setEditingAboutField(null)}>
                <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Cancelar
              </Button>
              <Button size="sm" onClick={saveAboutField}>
                <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Aplicar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Section Header Edit Modal (Ministries / Services / Announcements) */}
      <Dialog open={editingSectionHeader !== null} onOpenChange={(open) => !open && setEditingSectionHeader(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Edit3 className="w-4 h-4 sm:w-5 sm:h-5 text-purple" />
              Editar encabezado — {editingSectionHeader ? SECTION_HEADER_LABELS[editingSectionHeader.section] : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">{editingSectionHeader?.field === 'subtitle' ? 'Subtítulo' : 'Título'} de la sección</Label>
              <Input
                value={sectionHeaderValue}
                onChange={(e) => setSectionHeaderValue(e.target.value)}
                className="h-9 text-sm"
                placeholder="Escribe aquí..."
              />
            </div>
            <div className="flex gap-2 justify-end pt-3 sm:pt-4 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setEditingSectionHeader(null)}>
                <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Cancelar
              </Button>
              <Button size="sm" onClick={saveSectionHeader}>
                <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Aplicar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* About Image Edit Modal */}
      <Dialog open={showAboutImageEditor} onOpenChange={setShowAboutImageEditor}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
              <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-turquoise" />
              Editar Imagen de Nosotros
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">Imagen Actual</Label>
              {aboutImageUrl && (
                <div className="rounded-lg overflow-hidden border border-border">
                  <img src={aboutImageUrl} alt="Preview" className="w-full h-40 object-cover" />
                </div>
              )}
            </div>
            
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">Subir Nueva Imagen</Label>
              <input 
                type="file" 
                ref={aboutImageRef}
                onChange={handleAboutImageUpload}
                accept="image/*"
                className="hidden"
              />
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => aboutImageRef.current?.click()}
                  disabled={uploading}
                  className="flex-1"
                >
                  {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  Seleccionar Imagen
                </Button>
                {aboutImageUrl && (
                  <Button 
                    type="button" 
                    variant="destructive" 
                    size="icon"
                    onClick={() => setAboutImageUrl('')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            
            <div className="flex gap-2 justify-end pt-3 sm:pt-4 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setShowAboutImageEditor(false)}>
                <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Cancelar
              </Button>
              <Button size="sm" onClick={saveAboutImage} disabled={saving || uploading}>
                {saving ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 animate-spin" /> : <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />} Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Field Edit Modal */}
      <Dialog open={editingContactField !== null} onOpenChange={(open) => !open && setEditingContactField(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Edit3 className="w-4 h-4 sm:w-5 sm:h-5 text-turquoise" />
              Editar: {editingContactField ? getContactFieldLabel(editingContactField) : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">Nuevo Valor</Label>
              {editingContactField === 'mapUrl' ? (
                <Textarea 
                  value={contactFieldValue} 
                  onChange={(e) => setContactFieldValue(e.target.value)}
                  rows={3}
                  className="text-sm font-mono"
                  placeholder="https://www.google.com/maps/embed?pb=..."
                />
              ) : (
                <Input 
                  value={contactFieldValue} 
                  onChange={(e) => setContactFieldValue(e.target.value)}
                  className="h-9 text-sm"
                  placeholder="Escribe aquí..."
                />
              )}
              {editingContactField === 'mapUrl' && (
                <p className="text-xs text-muted-foreground">
                  Pega el código de embed de Google Maps (el URL del iframe)
                </p>
              )}
            </div>
            <div className="flex gap-2 justify-end pt-3 sm:pt-4 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setEditingContactField(null)}>
                <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Cancelar
              </Button>
              <Button size="sm" onClick={saveContactField}>
                <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Aplicar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer Field Edit Modal */}
      <Dialog open={editingFooterField !== null} onOpenChange={(open) => !open && setEditingFooterField(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Edit3 className="w-4 h-4 sm:w-5 sm:h-5 text-mint" />
              Editar: {editingFooterField ? getFooterFieldLabel(editingFooterField) : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">URL</Label>
              <Input 
                value={footerFieldValue} 
                onChange={(e) => setFooterFieldValue(e.target.value)}
                className="h-9 text-sm"
                placeholder={editingFooterField === 'emailUrl' ? 'mailto:info@ejemplo.com' : 'https://...'}
              />
              <p className="text-xs text-muted-foreground">
                {editingFooterField === 'emailUrl' 
                  ? 'Usa el formato: mailto:correo@ejemplo.com'
                  : 'Ingresa la URL completa de tu perfil en esta red social'
                }
              </p>
            </div>
            <div className="flex gap-2 justify-end pt-3 sm:pt-4 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setEditingFooterField(null)}>
                <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Cancelar
              </Button>
              <Button size="sm" onClick={saveFooterField}>
                <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Aplicar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Gallery Image Edit Modal */}
      <Dialog open={!!editingGalleryImage} onOpenChange={(open) => !open && setEditingGalleryImage(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Imagen de Galería</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Texto Alternativo</Label>
              <Input 
                value={galleryImageForm.alt_text}
                onChange={(e) => setGalleryImageForm(prev => ({ ...prev, alt_text: e.target.value }))}
                placeholder="Descripción de la imagen"
              />
            </div>
            <input
              type="file"
              ref={galleryImageRef}
              className="hidden"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = await uploadImage(file, 'images');
                  if (url) setGalleryImageForm(prev => ({ ...prev, image_url: url }));
                }
              }}
            />
            <Button variant="outline" onClick={() => galleryImageRef.current?.click()} className="w-full">
              <Upload className="w-4 h-4 mr-2" /> Subir Nueva Imagen
            </Button>
            {galleryImageForm.image_url && (
              <img src={galleryImageForm.image_url} alt="Preview" className="w-full h-32 object-cover rounded" />
            )}
            <Button 
              className="w-full"
              onClick={() => {
                if (editingGalleryImage) {
                  // Store in pending changes instead of saving directly
                  setPendingGalleryChanges(prev => {
                    const newMap = new Map(prev);
                    newMap.set(editingGalleryImage.id, {
                      image_url: galleryImageForm.image_url,
                      alt_text: galleryImageForm.alt_text
                    });
                    return newMap;
                  });
                  // Update local state for preview
                  setAboutGallery(prev => prev.map(img => 
                    img.id === editingGalleryImage.id 
                      ? { ...img, image_url: galleryImageForm.image_url, alt_text: galleryImageForm.alt_text }
                      : img
                  ));
                  setHasUnsavedChanges(true);
                  setEditingGalleryImage(null);
                  toast({ title: "Cambios aplicados", description: "Presiona 'Guardar Cambios' para guardar definitivamente" });
                }
              }}
            >
              Aplicar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Prayer Banner Edit Modal */}
      <Dialog open={showPrayerEditor} onOpenChange={setShowPrayerEditor}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Edit3 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Editar Sección de Oración
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            {/* Background Image */}
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm">Imagen de Fondo</Label>
              <div className="relative h-32 rounded-lg overflow-hidden border border-border bg-muted/30">
                {prayerFields.backgroundImage ? (
                  <img 
                    src={prayerFields.backgroundImage} 
                    alt="Fondo" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-primary to-primary/50">
                    <span className="text-white/70 text-xs">Sin imagen (usa color primario)</span>
                  </div>
                )}
              </div>
              <input
                ref={prayerImageRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = await uploadImage(file, 'images/prayer');
                    if (url) setPrayerFields(prev => ({ ...prev, backgroundImage: url }));
                  }
                }}
              />
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => prayerImageRef.current?.click()}
                  disabled={uploading}
                  className="flex-1 text-xs"
                >
                  {uploading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
                  {prayerFields.backgroundImage ? 'Cambiar' : 'Subir'} Imagen
                </Button>
                {prayerFields.backgroundImage && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => setPrayerFields(prev => ({ ...prev, backgroundImage: '' }))}
                    className="text-xs"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm">Título Principal</Label>
              <Input 
                value={prayerFields.title} 
                onChange={(e) => setPrayerFields(prev => ({ ...prev, title: e.target.value }))}
                className="h-9 text-sm"
                placeholder="ORACIÓN"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm">Subtítulo</Label>
              <Input 
                value={prayerFields.subtitle} 
                onChange={(e) => setPrayerFields(prev => ({ ...prev, subtitle: e.target.value }))}
                className="h-9 text-sm"
                placeholder="CONGREGACIONAL"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm">Horario</Label>
                <Input 
                  value={prayerFields.schedule} 
                  onChange={(e) => setPrayerFields(prev => ({ ...prev, schedule: e.target.value }))}
                  className="h-9 text-sm"
                  placeholder="Lunes a Viernes"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm">Hora</Label>
                <Input 
                  value={prayerFields.time} 
                  onChange={(e) => setPrayerFields(prev => ({ ...prev, time: e.target.value }))}
                  className="h-9 text-sm"
                  placeholder="05:30 hs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm">Texto del Botón</Label>
                <Input 
                  value={prayerFields.buttonText} 
                  onChange={(e) => setPrayerFields(prev => ({ ...prev, buttonText: e.target.value }))}
                  className="h-9 text-sm"
                  placeholder="PARTICIPAR"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm">URL del Botón</Label>
                <Input 
                  value={prayerFields.buttonUrl} 
                  onChange={(e) => setPrayerFields(prev => ({ ...prev, buttonUrl: e.target.value }))}
                  className="h-9 text-sm"
                  placeholder="https://wa.me/1234567890"
                />
                <p className="text-[10px] text-muted-foreground">
                  Usa una URL de WhatsApp (ej: https://wa.me/1234567890) o un enlace interno (#contacto)
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-3 sm:pt-4 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setShowPrayerEditor(false)}>
                <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Cancelar
              </Button>
              <Button size="sm" onClick={() => {
                setPendingPrayerFields({ ...prayerFields });
                setHasUnsavedChanges(true);
                setShowPrayerEditor(false);
                toast({ title: "Cambios aplicados", description: "Presiona 'Guardar Cambios' para guardar definitivamente" });
              }}>
                <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Aplicar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quote Section Edit Modal */}
      <Dialog open={showQuoteEditor} onOpenChange={setShowQuoteEditor}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Edit3 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Editar Cita / Foto
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            {/* Image Preview */}
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm">Foto</Label>
              <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden border-2 border-border">
                <img 
                  src={quoteFields.imageUrl} 
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <input
                ref={quoteImageRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = await uploadImage(file, 'images/quote');
                    if (url) setQuoteFields(prev => ({ ...prev, imageUrl: url }));
                  }
                }}
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => quoteImageRef.current?.click()}
                disabled={uploading}
                className="w-full text-xs"
              >
                {uploading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
                Cambiar Foto
              </Button>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm">Cita / Frase</Label>
              <Textarea 
                value={quoteFields.quote} 
                onChange={(e) => setQuoteFields(prev => ({ ...prev, quote: e.target.value }))}
                rows={3}
                className="text-sm"
                placeholder="Escribe la cita aquí..."
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm">Autor</Label>
              <Input 
                value={quoteFields.author} 
                onChange={(e) => setQuoteFields(prev => ({ ...prev, author: e.target.value }))}
                className="h-9 text-sm"
                placeholder="Pra. Nombre Apellido"
              />
            </div>
            <div className="flex gap-2 justify-end pt-3 sm:pt-4 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setShowQuoteEditor(false)}>
                <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Cancelar
              </Button>
              <Button size="sm" onClick={() => {
                setPendingQuoteFields({ ...quoteFields });
                setHasUnsavedChanges(true);
                setShowQuoteEditor(false);
                toast({ title: "Cambios aplicados", description: "Presiona 'Guardar Cambios' para guardar definitivamente" });
              }}>
                <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Aplicar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Admins Dialog */}
      <ManageAdminsDialog 
        open={showAddAdmin} 
        onOpenChange={setShowAddAdmin} 
        isPastor={isPastor} 
      />

      {/* ========== WHATSAPP BUTTON (Fixed, at root level) ========== */}
      {initialLoadComplete && (
        <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 lg:right-[calc(18rem+1.5rem)] z-[9999]">
          <EditableWrapper
            onClick={() => {
              setFooterFieldValue(footerFields.whatsappNumber || '');
              setEditingFooterField('whatsappNumber');
            }}
            label="Editar WhatsApp"
          >
            <button
              className="w-14 h-14 md:w-16 md:h-16 bg-[#25D366] hover:bg-[#20BA5A] rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110"
              aria-label="Editar WhatsApp"
            >
              <MessageCircle className="w-7 h-7 md:w-8 md:h-8 text-white" />
            </button>
          </EditableWrapper>
        </div>
      )}

      {/* Floating Color Palette for Mobile */}
      {initialLoadComplete && (
        <FloatingColorPalette
          pendingColors={pendingColors}
          onColorChange={handleColorChange}
          onSave={handleSaveOrSchedule}
          onReset={handleResetColors}
          hasUnsavedChanges={hasUnsavedChanges}
          saving={saving}
          onOpenScheduleCalendar={() => setShowScheduleCalendar(true)}
          isScheduledMode={isScheduledMode}
          onToggleScheduledMode={setIsScheduledMode}
          scheduledDateTime={scheduledDateTime}
          onScheduledDateTimeChange={setScheduledDateTime}
          scheduledTitle={scheduledTitle}
          onScheduledTitleChange={setScheduledTitle}
          logoUrl={pendingBrandingFields?.logoUrl || brandingFields.logoUrl || undefined}
          onLogoUpload={async (file: File) => {
            const url = await uploadImage(file, 'images');
            if (url) {
              setPendingBrandingFields({ logoUrl: url });
              setHasUnsavedChanges(true);
            }
          }}
          onLogoRemove={() => {
            setPendingBrandingFields({ logoUrl: '' });
            setHasUnsavedChanges(true);
          }}
          uploadingLogo={uploading}
        />
      )}

      {/* Welcome Dialog for first-time admins */}
      <WelcomeDialog />

      {/* Scheduled Content Calendar */}
      <ScheduledContentCalendar
        open={showScheduleCalendar}
        onOpenChange={setShowScheduleCalendar}
        getCurrentSnapshot={getCurrentSnapshot}
        externalScheduledItems={scheduledItems}
        onRefetch={refetchScheduledContent}
      />
    </div>
  );
};

export default Admin;