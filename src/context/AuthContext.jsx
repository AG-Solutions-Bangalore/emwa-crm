import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { fetchPanelDotenv, logoutUser } from '../services/api';

const AuthContext = createContext(null);
const TOKEN_KEY = 'emwa_crm_token';
const USER_KEY = 'emwa_crm_user';
const DOTENV_KEY = 'emwa_crm_dotenv';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem(USER_KEY);
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [dotenvConfig, setDotenvConfig] = useState(() => {
    const saved = localStorage.getItem(DOTENV_KEY);
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Load dotenv config on startup
  useEffect(() => {
    (async () => {
      try {
        const envData = await fetchPanelDotenv();
        const dotenvHash = typeof envData === 'string' ? envData : (envData?.data || envData);
        if (dotenvHash) {
          localStorage.setItem(DOTENV_KEY, JSON.stringify(dotenvHash));
          setDotenvConfig(dotenvHash);
          console.info('[AuthContext] panel-fetch-dotenv loaded hash:', dotenvHash);
        }
      } catch (err) {
        console.warn('[AuthContext] panel-fetch-dotenv failed:', err.message);
      }
    })();
  }, []);

  /* ── LOGIN ── */
  const login = async (payload) => {
    const responseData = payload?.data || payload || {};
    const userInfo =
      responseData?.UserInfo ||
      responseData?.userInfo ||
      responseData?.data?.UserInfo ||
      responseData?.data ||
      responseData;

    const nextToken =
      userInfo?.token ||
      responseData.token ||
      responseData.access_token ||
      responseData?.data?.token ||
      responseData?.data?.access_token;

    if (!nextToken) {
      throw new Error('Invalid login response. No authentication token returned.');
    }

    const nextUser =
      userInfo?.user ||
      responseData.user ||
      responseData?.data?.user || {
        username:
          responseData.username ||
          responseData?.data?.username ||
          userInfo?.name ||
          userInfo?.username ||
          'Admin',
      };

    const tokenExpiresAt = userInfo?.token_expires_at || responseData?.token_expires_at || null;

    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    if (tokenExpiresAt) {
      localStorage.setItem('emwa_crm_token_expires_at', tokenExpiresAt);
    }

    setToken(nextToken);
    setUser(nextUser);

    // Fetch server-side dotenv config right after login
    try {
      const envData = await fetchPanelDotenv();
      const dotenvHash = typeof envData === 'string' ? envData : (envData?.data || envData);
      if (dotenvHash) {
        localStorage.setItem(DOTENV_KEY, JSON.stringify(dotenvHash));
        setDotenvConfig(dotenvHash);
        console.info('[AuthContext] panel-fetch-dotenv loaded hash:', dotenvHash);
      }
    } catch (err) {
      console.warn('[AuthContext] panel-fetch-dotenv failed (non-fatal):', err.message);
    }
  };

  /* ── LOGOUT ── */
  const logout = async () => {
    try {
      const currentToken = localStorage.getItem(TOKEN_KEY);
      if (currentToken) {
        await logoutUser();
      }
    } catch (err) {
      console.warn('[AuthContext] Logout API call error:', err.message);
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(DOTENV_KEY);
      localStorage.removeItem('emwa_crm_token_expires_at');
      setToken(null);
      setUser(null);
      setDotenvConfig(null);
    }
  };

  const value = useMemo(
    () => ({
      token,
      user,
      dotenvConfig,
      isAuthenticated: Boolean(token),
      login,
      logout,
      refreshDotenv: async () => {
        try {
          const envData = await fetchPanelDotenv();
          const dotenvHash = typeof envData === 'string' ? envData : (envData?.data || envData);
          if (dotenvHash) {
            localStorage.setItem(DOTENV_KEY, JSON.stringify(dotenvHash));
            setDotenvConfig(dotenvHash);
            return dotenvHash;
          }
        } catch (err) {
          console.warn('refreshDotenv error:', err);
        }
      },
    }),
    [token, user, dotenvConfig]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext must be used inside AuthProvider');
  return context;
};

export default AuthContext;
