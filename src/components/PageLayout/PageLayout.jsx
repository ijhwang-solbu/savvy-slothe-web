import Image from 'next/image';
import styles from './PageLayout.module.css';

export default function PageLayout({ children, showLogo = true, showLogout = true, pageTitle = '', showFooter = true, onLogout }) {
  return (
    <main
      style={{
        // padding: '0 1rem',
        maxWidth: '800px',
        minWidth: '300px',
        margin: '0 auto',
      }}>
      {/* Header */}
      {(showLogo || showLogout) && (
        <header className={styles.header}>
          {showLogo && (
            <div className={styles.logo}>
              작심
              <Image src='/logo.png' alt='Savvy Sloth' width={32} height={32} />일
            </div>
          )}
          {/* Page Title */}

          {showLogout && (
            <button className={styles.logoutBtn} onClick={onLogout}>
              로그아웃
            </button>
          )}
        </header>
      )}
      {pageTitle && <h1 style={{ fontSize: '1.3rem', fontWeight: '700', margin: '1rem 0.5rem' }}>{pageTitle}</h1>}

      {/* Content */}
      {children}

      {/* Footer */}
      {showFooter && (
        <footer
          style={{
            marginTop: '2rem',
            fontSize: '0.8rem',
            textAlign: 'center',
            color: '#888',
          }}>
          © 2025 Savvy Sloth. All rights reserved.
        </footer>
      )}
    </main>
  );
}
