import { usePageTracking } from "@/hooks/usePageTracking";

interface PageTrackerProps {
  children: React.ReactNode;
}

export const PageTracker = ({ children }: PageTrackerProps) => {
  usePageTracking();
  return <>{children}</>;
};

export default PageTracker;
