import { useEffect, useState } from 'react';

export default function usePwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true); // 설치 안내 UI 보이기
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const installApp = () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('사용자가 설치를 수락했습니다.');
      } else {
        console.log('사용자가 설치를 거부했습니다.');
      }
      setDeferredPrompt(null);
      setIsVisible(false);
    });
  };

  return { isVisible, installApp, closePrompt: () => setIsVisible(false) };
}
