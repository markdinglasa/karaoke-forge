import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "KaraokeForge — Create Karaoke Videos Instantly",
  description:
    "Upload your MP3, background image, and lyrics — KaraokeForge generates a professional karaoke video with perfectly synced lyrics in minutes.",
};

export default function HomePage() {
  return (
    <main>
      {/* ── HERO ── */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "60px 24px",
        }}
      >
        <h1
          className="animate-fade-up"
          style={{
            fontSize: "clamp(3rem, 8vw, 6rem)",
            fontWeight: 900,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            marginBottom: 24,
            animationDelay: "0.1s",
            opacity: 0,
          }}
        >
          Create Karaoke <span className="gradient-text">Videos</span>
          <br />
          In Minutes
        </h1>

        <p
          className="animate-fade-up"
          style={{
            fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
            color: "var(--text-secondary)",
            maxWidth: 560,
            lineHeight: 1.7,
            marginBottom: 48,
            animationDelay: "0.15s",
            opacity: 0,
          }}
        >
          Upload your MP3, a background image, and paste your lyrics. We handle
          the rest — generating a studio-quality karaoke video with perfectly
          synced, highlighted lyrics.
        </p>

        <div
          className="animate-fade-up"
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            justifyContent: "center",
            animationDelay: "0.2s",
            opacity: 0,
          }}
        >
          <Link
            href="/create"
            className="btn btn-primary btn-lg"
            id="cta-get-started"
          >
            Get Started — It&apos;s Free
          </Link>
          <a href="#how-it-works" className="btn btn-ghost btn-lg">
            See How It Works
          </a>
        </div>

        {/* Floating mockup */}
        <div
          className="glass-card animate-fade-up"
          style={{
            marginTop: 80,
            padding: 6,
            maxWidth: 720,
            width: "100%",
            animationDelay: "0.3s",
            opacity: 0,
          }}
        >
          <div
            style={{
              background: "#111",
              borderRadius: 12,
              aspectRatio: "16/9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Fake video BG */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(135deg, #1a0533 0%, #0a1628 50%, #0d0520 100%)",
              }}
            />
            {/* Fake lyric lines */}
            <div
              style={{
                position: "relative",
                zIndex: 1,
                textAlign: "center",
                padding: 24,
              }}
            >
              <p
                style={{
                  color: "rgba(255,255,255,0.35)",
                  fontSize: "clamp(0.7rem, 2vw, 1rem)",
                  marginBottom: 12,
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 600,
                }}
              >
                ♪ Your lyrics here...
              </p>
              <p
                style={{
                  background: "linear-gradient(135deg, #a855f7, #3b82f6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  fontSize: "clamp(1rem, 3.5vw, 1.8rem)",
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 800,
                  letterSpacing: "-0.01em",
                }}
              >
                ♪ Highlighted &amp; Synced Lyrics ♪
              </p>
              <p
                style={{
                  color: "rgba(255,255,255,0.35)",
                  fontSize: "clamp(0.7rem, 2vw, 1rem)",
                  marginTop: 12,
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 600,
                }}
              >
                ♪ Next line coming up...
              </p>
            </div>
            {/* Fake progress bar at bottom */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 3,
                background: "rgba(255,255,255,0.1)",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: "42%",
                  background: "linear-gradient(90deg, #7c3aed, #3b82f6)",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ padding: "100px 24px" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <h2
              style={{
                fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
                marginBottom: 16,
              }}
            >
              How It <span className="gradient-text">Works</span>
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem" }}>
              Three simple steps to your karaoke masterpiece
            </p>
          </div>

          <div
            className="stagger"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 24,
            }}
          >
            {[
              {
                step: "01",
                icon: "📁",
                title: "Upload Your Assets",
                desc: "Drop in your MP3 audio, a background image for lyrics, and a thumbnail cover. All major formats supported.",
              },
              {
                step: "02",
                icon: "🎯",
                title: "Sync Your Lyrics",
                desc: "Paste your lyrics and use our Tap-to-Sync editor — play the song and tap when each line starts. Easy and precise.",
              },
              {
                step: "03",
                icon: "🎬",
                title: "Generate & Download",
                desc: "Hit generate and download your professional karaoke MP4 video with burned-in, highlighted lyrics.",
              },
            ].map((card) => (
              <div
                key={card.step}
                className="glass-card animate-fade-up"
                style={{ padding: "36px 28px", opacity: 0 }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: "var(--grad-glow)",
                    border: "1px solid var(--color-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.6rem",
                    marginBottom: 20,
                  }}
                >
                  {card.icon}
                </div>
                <p
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "var(--color-primary)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  Step {card.step}
                </p>
                <h3 style={{ fontSize: "1.2rem", marginBottom: 10 }}>
                  {card.title}
                </h3>
                <p
                  style={{
                    color: "var(--text-secondary)",
                    lineHeight: 1.7,
                    fontSize: "0.95rem",
                  }}
                >
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: "80px 24px 120px" }}>
        <div className="container">
          <div
            className="glass-card"
            style={{
              padding: "60px 48px",
              textAlign: "center",
              background:
                "linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(59,130,246,0.1) 100%)",
            }}
          >
            <h2
              style={{
                fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
                marginBottom: 16,
              }}
            >
              Ready to make your first{" "}
              <span className="gradient-text">karaoke video</span>?
            </h2>
            <p
              style={{
                color: "var(--text-secondary)",
                marginBottom: 36,
                fontSize: "1.05rem",
              }}
            >
              It takes less than 5 minutes. No account needed.
            </p>
            <Link
              href="/create"
              className="btn btn-primary btn-lg"
              id="cta-footer-start"
            >
              Start Creating Now
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        style={{
          borderTop: "1px solid var(--color-border)",
          padding: "32px 24px",
          textAlign: "center",
        }}
      >
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
          © {new Date().getFullYear()} KaraokeForge — Built with ♥ for karaoke
          lovers
        </p>
      </footer>
    </main>
  );
}
