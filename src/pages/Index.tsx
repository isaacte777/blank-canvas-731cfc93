import { useState } from "react";
import KSHeader from "@/components/kappascore/KSHeader";
import KSFooter from "@/components/kappascore/KSFooter";
import "@/components/kappascore/KSFooter.css";

const Index = () => {
  const [activeNav, setActiveNav] = useState(0);

  const handleNavigateToLive = () => {
    setActiveNav(2); // Live Score index
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <KSHeader activeNav={activeNav} onNavChange={setActiveNav} />
      
      <main className="max-w-[1200px] mx-auto px-4 py-8">
        {activeNav === 0 && (
          <div className="text-center py-20 text-gray-400">
            <h2 className="text-2xl font-bold mb-2">Results</h2>
            <p>Latest sports results will appear here.</p>
          </div>
        )}
        {activeNav === 1 && (
          <div className="text-center py-20 text-gray-400">
            <h2 className="text-2xl font-bold mb-2">Statistics</h2>
            <p>Sports statistics will appear here.</p>
          </div>
        )}
        {activeNav === 2 && (
          <div className="text-center py-20 text-gray-400">
            <h2 className="text-2xl font-bold mb-2">Live Score</h2>
            <p>Live scores will appear here.</p>
          </div>
        )}
      </main>

      <KSFooter onNavigateToLive={handleNavigateToLive} />
    </div>
  );
};

export default Index;
