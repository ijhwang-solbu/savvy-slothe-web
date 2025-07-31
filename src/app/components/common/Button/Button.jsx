import styles from './Button.module.css';

export default function Button({ children, variant = 'primary', size = 'medium', disabled = false, pretended = false, onClick, className = '' }) {
  return (
    <button className={`${styles.btn} ${styles[variant]} ${disabled ? styles.disabled : ''} ${pretended ? styles.pretended : ''} ${className}`} onClick={onClick} disabled={disabled} pretended={pretended}>
      {children}
    </button>
  );
}
