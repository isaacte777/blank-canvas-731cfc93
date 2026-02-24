import { useState } from "react";
import KSHeader from "@/components/kappascore/KSHeader";

const Index = () => {
  const [activeNav, setActiveNav] = useState(0);

  return (
    <div className="min-h-screen bg-background">
      <KSHeader activeNav={activeNav} onNavChange={setActiveNav} />
    </div>
  );
};

export default Index;
