import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { PrayerBanner } from "@/components/PrayerBanner";
import { Services } from "@/components/Services";
import { About } from "@/components/About";
import { Announcements } from "@/components/Announcements";
import { QuoteSection } from "@/components/QuoteSection";
import { Ministries } from "@/components/Ministries";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { usePageContent } from "@/hooks/usePageContent";
import { useColorPalette } from "@/hooks/useColorPalette";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";
import { useContentPublishListener } from "@/hooks/useContentPublishListener";
import { useSearchParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  // Check if we're in mobile preview mode
  const [searchParams] = useSearchParams();
  const isMobilePreview = searchParams.get('preview') === 'mobile';

  // Load custom colors on page load
  useColorPalette();
  // Enable smooth scrolling with inertia
  useSmoothScroll();
  // Listen for scheduled content publications and auto-reload
  useContentPublishListener(true);
  const { content, services, announcements, aboutGallery, ministries, footerFields, brandingFields, prayerFields, quoteFields, aboutExtraFields, contactExtraFields, loading } = usePageContent();

  // Show loading skeleton while content is being fetched
  if (loading) {
    return (
      <div className="min-h-screen bg-background w-full">
        {/* Hero skeleton */}
        <Skeleton className="h-screen w-full" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background w-full max-w-[100vw] overflow-x-hidden ${isMobilePreview ? 'scrollbar-hide' : ''}`}>
      <Navigation liveStreamUrl={footerFields.liveStreamUrl} customLogoUrl={brandingFields.logoUrl} />
      <main className="w-full max-w-[100vw] overflow-x-hidden">
        <div id="inicio">
          <Hero />
        </div>
        <div id="oracion" className="scroll-mt-16 md:scroll-mt-20">
          <PrayerBanner 
            title={prayerFields.title}
            subtitle={prayerFields.subtitle}
            schedule={prayerFields.schedule}
            time={prayerFields.time}
            buttonText={prayerFields.buttonText}
            buttonUrl={prayerFields.buttonUrl}
            backgroundImage={prayerFields.backgroundImage}
          />
        </div>
        <div id="anuncios" className="scroll-mt-16 md:scroll-mt-20">
          <Announcements announcements={announcements} />
        </div>
        <div id="cita" className="scroll-mt-16 md:scroll-mt-20">
          <QuoteSection 
            quote={quoteFields.quote}
            author={quoteFields.author}
            imageUrl={quoteFields.imageUrl}
          />
        </div>
        <div id="servicios" className="relative z-40 bg-background scroll-mt-16 md:scroll-mt-20">
          <Services services={services} />
        </div>
        <div id="nosotros" className="relative z-40 bg-background scroll-mt-16 md:scroll-mt-20">
          <About 
            title={content.about?.title}
            subtitle={content.about?.subtitle}
            content={aboutExtraFields.firstParagraph}
            image_url={content.about?.image_url}
            galleryImages={aboutGallery}
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
          />
        </div>
        <div id="ministerios" className="relative z-40 bg-background scroll-mt-16 md:scroll-mt-20">
          <Ministries ministries={ministries} />
        </div>
        <div id="contacto" className="relative z-40 bg-background scroll-mt-16 md:scroll-mt-20">
          <Contact 
            title={content.contact?.title}
            subtitle={content.contact?.subtitle}
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
      </main>
      <Footer 
        facebookUrl={footerFields.facebookUrl}
        instagramUrl={footerFields.instagramUrl}
        youtubeUrl={footerFields.youtubeUrl}
        emailUrl={footerFields.emailUrl}
        ministries={ministries}
      />
      <WhatsAppButton phoneNumber={footerFields.whatsappNumber} />
    </div>
  );
};

export default Index;
