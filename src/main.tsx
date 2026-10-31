import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('DRemote update available');
  },
  onOfflineReady() {
    console.log('DRemote is ready for offline and mobile PWA use');
  },
});

createRoot(document.getElementById('root')!).render(<App />);

