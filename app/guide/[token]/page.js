import { cache } from 'react';
import { notFound } from 'next/navigation';

import { connectDB } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

const fetchGuideByToken = cache(async (token) => {
  const { db } = await connectDB();
  return db.collection('arrival_guides').findOne({ qrToken: token });
});

function formatDate(date) {
  if (!date) return '';
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'long',
    }).format(new Date(date));
  } catch (error) {
    return '';
  }
}

export async function generateMetadata({ params }) {
  const guide = await fetchGuideByToken(params.token);
  if (!guide) {
    return {
      title: "Guide d'arrivée introuvable",
    };
  }

  return {
    title: `Guide d'arrivée — ${guide.propertyName}`,
    description: `Toutes les informations utiles pour votre séjour à ${guide.propertyName}.`,
  };
}

export default async function GuidePublicPage({ params }) {
  const guide = await fetchGuideByToken(params.token);

  if (!guide) {
    notFound();
  }

  const lastUpdate = formatDate(guide.updatedAt || guide.createdAt);
  const recommendations = Array.isArray(guide.recommendations) ? guide.recommendations : [];

  const styles = {
    page: {
      fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      backgroundColor: '#f8fafc',
      color: '#0f172a',
      minHeight: '100vh',
      padding: '48px 16px 64px',
    },
    container: {
      maxWidth: '760px',
      margin: '0 auto',
      backgroundColor: '#ffffff',
      borderRadius: '28px',
      boxShadow: '0 20px 50px rgba(15, 23, 42, 0.08)',
      overflow: 'hidden',
    },
    header: {
      background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
      color: '#ffffff',
      padding: '48px 36px',
    },
    badge: {
      textTransform: 'uppercase',
      letterSpacing: '0.4em',
      fontSize: '12px',
      opacity: 0.8,
    },
    title: {
      fontSize: '34px',
      margin: '18px 0 12px',
      fontWeight: 600,
    },
    subtitle: {
      fontSize: '16px',
      opacity: 0.85,
    },
    content: {
      padding: '36px',
      background: 'linear-gradient(to bottom, #ffffff, #f8fafc)',
    },
    section: {
      borderRadius: '22px',
      border: '1px solid rgba(148, 163, 184, 0.24)',
      padding: '28px 24px',
      backgroundColor: '#ffffff',
      boxShadow: '0 10px 35px rgba(15, 23, 42, 0.06)',
      marginBottom: '24px',
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: 600,
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    wifiField: {
      marginBottom: '16px',
    },
    wifiLabel: {
      fontSize: '13px',
      fontWeight: 600,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      color: '#1e293b',
      marginBottom: '6px',
    },
    wifiValue: {
      fontFamily: "'DM Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
      backgroundColor: '#dbeafe',
      color: '#1d4ed8',
      borderRadius: '14px',
      padding: '10px 14px',
      display: 'inline-flex',
      alignItems: 'center',
    },
    paragraph: {
      color: '#475569',
      lineHeight: 1.6,
      whiteSpace: 'pre-line',
      margin: 0,
    },
    recommendation: {
      marginBottom: '20px',
    },
    recommendationTitle: {
      fontSize: '17px',
      fontWeight: 600,
      color: '#0f172a',
      marginBottom: '12px',
    },
    list: {
      margin: 0,
      paddingLeft: '20px',
      color: '#475569',
      lineHeight: 1.6,
    },
    linkButton: {
      marginTop: '12px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      backgroundColor: '#2563eb',
      color: '#ffffff',
      padding: '10px 18px',
      borderRadius: '999px',
      fontSize: '14px',
      textDecoration: 'none',
    },
    footer: {
      padding: '20px 36px 32px',
      backgroundColor: '#0f172a',
      color: '#cbd5f5',
      fontSize: '13px',
    },
  };

  return (
    <div style={styles.page}>
      <article style={styles.container}>
        <header style={styles.header}>
          <div style={styles.badge}>Guide d'arrivée</div>
          <h1 style={styles.title}>Bienvenue à {guide.propertyName}</h1>
          <p style={styles.subtitle}>{guide.address}</p>
          {lastUpdate && <p style={{ marginTop: '14px', fontSize: '14px', opacity: 0.85 }}>Dernière mise à jour : {lastUpdate}</p>}
        </header>
        <main style={styles.content}>
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>🔐 Wifi & connexion</h2>
            <div style={styles.wifiField}>
              <div style={styles.wifiLabel}>Nom du réseau</div>
              <div style={styles.wifiValue}>{guide.wifiName}</div>
            </div>
            <div style={styles.wifiField}>
              <div style={styles.wifiLabel}>Mot de passe</div>
              <div style={styles.wifiValue}>{guide.wifiPassword}</div>
            </div>
          </section>

          {guide.trashLocation && (
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>🗑️ Gestion des déchets</h2>
              <p style={styles.paragraph}>{guide.trashLocation}</p>
            </section>
          )}

          {recommendations.length > 0 && (
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>✨ Bonnes adresses</h2>
              <div>
                {recommendations.map((item) => (
                  <div key={item.id} style={styles.recommendation}>
                    <h3 style={styles.recommendationTitle}>{item.title}</h3>
                    {Array.isArray(item.lines) && item.lines.length > 0 && (
                      <ul style={styles.list}>
                        {item.lines.map((line, index) => (
                          <li key={`${item.id}-line-${index}`}>{line}</li>
                        ))}
                      </ul>
                    )}
                    {item.link?.url && (
                      <a
                        href={item.link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.linkButton}
                      >
                        {item.link.label || 'Ouvrir le lien'}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
        <footer style={styles.footer}>
          Pensez à conserver ce lien pour vos futurs séjours. À bientôt sur Checkinly !
        </footer>
      </article>
    </div>
  );
}
