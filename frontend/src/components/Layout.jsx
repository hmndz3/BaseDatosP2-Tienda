import Sidebar from './Sidebar';
import Header from './Header';
import styles from '../styles/Layout.module.css';

export default function Layout({ active, onNavigate, children }) {
  return (
    <div className={styles.shell}>
      <Sidebar active={active} onNavigate={onNavigate} />
      <div className={styles.main}>
        <Header />
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
}