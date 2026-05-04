import { useAuth } from '../context/AuthContext';
import styles from '../styles/Header.module.css';

export default function Header() {
  const { user, logout } = useAuth();

  const horaActual = new Date().getHours();
  const saludo = horaActual < 12 ? 'Buenos días' : horaActual < 19 ? 'Buenas tardes' : 'Buenas noches';

  const iniciales = `${user.nombre[0]}${user.apellido[0]}`.toUpperCase();

  return (
    <header className={styles.header}>
      <div className={styles.greeting}>
        <span className={styles.greetingText}>{saludo},</span>
        <span className={styles.greetingName}>{user.nombre} {user.apellido}</span>
      </div>

      <div className={styles.actions}>
        <div className={styles.userChip}>
          <div className={styles.avatar}>{iniciales}</div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user.username}</span>
            <span className={styles.userRole}>{user.rol}</span>
          </div>
        </div>

        <button className={styles.logout} onClick={logout}>
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}