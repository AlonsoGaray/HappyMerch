import { useEffect, useState } from 'react';
import { getCurrentUser } from '../lib/auth';
import Login from './Login';
import IntroVideo from './IntroVideo';

const EntryGate = () => {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkUser() {
      try {
        const user = await getCurrentUser();
        setIsLoggedIn(!!user);
      } catch {
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    }
    checkUser();
  }, []);

  if (loading) return <div className="text-center text-white">Cargando...</div>;
  if (!isLoggedIn) return <Login />;
  return <IntroVideo />;
};

export default EntryGate; 