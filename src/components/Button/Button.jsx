import styles from './Button.module.css';

export default function Button({ children, variant = 'primary', size = 'medium', disabled = false, onClick, className = '' }) {
  return (
    <button className={`${styles.btn} ${styles[variant]} ${disabled ? styles.disabled : ''}  ${className}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
