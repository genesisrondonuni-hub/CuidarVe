import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [balance, setBalance] = useState(0);
  const [isMasterOwner, setIsMasterOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('cuidarve_auth');
      const storedMaster = localStorage.getItem('cuidarve_is_master');

      if (storedMaster === 'true') {
        setIsMasterOwner(true);
      }

      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.token && parsed.user) {
          setUser(parsed.user);
          setToken(parsed.token);
          if (parsed.user.role === 'admin') {
            setIsMasterOwner(true);
            localStorage.setItem('cuidarve_is_master', 'true');
          }
          if (parsed.user.role === 'nurse') {
            setBalance(parsed.user.balance || 0);
            api.getTokenBalance()
              .then(data => {
                if (data.balance !== undefined) setBalance(data.balance);
              })
              .catch(() => {});
          }
        }
      }
    } catch (e) {
      console.error('Error cargando sesión previa', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSession = (newUser, newToken) => {
    setUser(newUser);
    setToken(newToken);
    if (newUser.role === 'admin') {
      setIsMasterOwner(true);
      localStorage.setItem('cuidarve_is_master', 'true');
    }
    if (newUser.role === 'nurse') {
      setBalance(newUser.balance || 0);
    }
    localStorage.setItem('cuidarve_auth', JSON.stringify({ user: newUser, token: newToken }));
  };

  const login = async (identifier, password) => {
    const data = await api.login(identifier, password);
    if (data.success && data.user && data.token) {
      saveSession(data.user, data.token);
      return data.user;
    }
    throw new Error('Respuesta inválida del servidor');
  };

  const register = async (userData) => {
    const data = await api.register(userData);
    if (data.success && data.user && data.token) {
      saveSession(data.user, data.token);
      return data.user;
    }
    throw new Error('Respuesta inválida del servidor');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setBalance(0);
    setIsMasterOwner(false);
    localStorage.removeItem('cuidarve_auth');
    localStorage.removeItem('cuidarve_is_master');
  };

  const updateBalance = (newBalance) => {
    setBalance(newBalance);
    if (user) {
      const updated = { ...user, balance: newBalance };
      setUser(updated);
      localStorage.setItem('cuidarve_auth', JSON.stringify({ user: updated, token }));
    }
  };

  const refreshBalance = async () => {
    if (user && user.role === 'nurse') {
      try {
        const data = await api.getTokenBalance();
        if (data.balance !== undefined) {
          updateBalance(data.balance);
        }
      } catch (e) {
        console.error('Error refrescando balance', e);
      }
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      balance,
      loading,
      isMasterOwner,
      login,
      register,
      logout,
      updateBalance,
      refreshBalance
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
