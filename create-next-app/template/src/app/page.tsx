import Image from "next/image";
import "./page.css";

const SPACING_STEPS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

/**
 * Token names and CSS expressions are substituted at scaffold time for the
 * chosen palette preset and format - these are the real theme.css tokens.
 */
const SWATCHES = [
  { label: "Background", token: "{{T_BACKGROUND}}", value: "{{C_BACKGROUND}}" },
  { label: "Foreground", token: "{{T_FOREGROUND}}", value: "{{C_FOREGROUND}}" },
  { label: "Muted", token: "{{T_MUTED}}", value: "{{C_MUTED}}" },
  { label: "Accent", token: "{{T_ACCENT_SOLID}}", value: "{{C_ACCENT_SOLID}}" },
  { label: "Accent soft", token: "{{T_ACCENT_SOFT}}", value: "{{C_ACCENT_SOFT}}" },
  { label: "Line", token: "{{T_LINE}}", value: "{{C_LINE}}" },
] as const;

export default function Home() {
  return (
    <div className="page">
      <header className="header">
        <Image
          className="logo-light"
          src="/larsen-utvikling/logo-name.svg"
          alt="Larsen Utvikling"
          width={140}
          height={45}
          priority
        />
        <Image
          className="logo-dark"
          src="/larsen-utvikling/logo-name-dark.svg"
          alt="Larsen Utvikling"
          width={140}
          height={45}
          priority
        />
      </header>

      <main className="main">
        <section>
          <h1>{"{{APP_NAME}}"}</h1>
          <p className="lead">
            A clean Next.js start: newest stable version, App Router, and a
            vanilla CSS design system. No utility framework - just tokens.
          </p>
        </section>

        <section className="tokens">
          <h2>Spacing scale</h2>
          <p className="hint">
            8 steps, 4px base - <code>--space-1</code> to <code>--space-8</code>
          </p>
          <div className="spacing-demo" aria-hidden="true">
            {SPACING_STEPS.map((step) => (
              <div
                key={step}
                className="spacing-bar"
                style={{ width: `var(--space-${step})` }}
              />
            ))}
          </div>

          <h2>Color tokens</h2>
          <p className="hint">
            From <code>theme.css</code> - try switching your OS appearance, or
            set <code>data-theme=&quot;dark&quot;</code> on{" "}
            <code>&lt;html&gt;</code>
          </p>
          <ul className="swatches">
            {SWATCHES.map((swatch) => (
              <li key={swatch.token} className="swatch">
                <span
                  className="swatch-chip"
                  style={{ background: swatch.value }}
                />
                <span className="swatch-label">{swatch.label}</span>
                <code className="swatch-var">{swatch.token}</code>
              </li>
            ))}
          </ul>
        </section>

        <section className="steps">
          <h2>Next steps</h2>
          <ol>
            <li>
              Edit <code>src/app/page.tsx</code> - this welcome page is yours
              to replace
            </li>
            <li>
              Tokens live in <code>src/lib/design-system/</code> - spacing and
              widths in <code>core.css</code>, colors in <code>theme.css</code>
            </li>
            <li>
              Read <code>DESIGN.md</code> for the token reference and{" "}
              <code>AGENTS.md</code> for the project rules
            </li>
          </ol>
        </section>
      </main>

      <footer className="footer">
        <a
          href="https://www.larsenutvikling.no"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
        >
          <Image
            className="logo-light"
            src="/larsen-utvikling/logo.svg"
            alt=""
            width={20}
            height={20}
          />
          <Image
            className="logo-dark"
            src="/larsen-utvikling/logo-dark.svg"
            alt=""
            width={20}
            height={20}
          />
          <span>Built by Stian Larsen - Larsen Utvikling</span>
        </a>
      </footer>
    </div>
  );
}
