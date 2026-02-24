import KSHeader from "@/components/kappascore/KSHeader";
import "@/components/kappascore/KSHeader.css";

const Index = () => {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#f0f0f0" }}>
      <KSHeader />

      {/* Placeholder content */}
      <main
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "40px 20px",
        }}
      >
        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            marginBottom: 8,
          }}
        >
          Kappa<span style={{ color: "#22c55e" }}>score</span>
        </h1>
        <p style={{ color: "#888", fontSize: 14 }}>
          Live scores, statistics, and results — coming soon.
        </p>
      </main>
    </div>
  );
};

export default Index;
