import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean; // Add this
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode | ((props: { user: User | null }) => ReactNode) }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (storedToken && storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser && parsedUser._id) { // Validate user object
              setToken(storedToken);
              setUser(parsedUser);
            } else {
              // Invalid user data, clear storage
              localStorage.removeItem('token');
              localStorage.removeItem('user');
            }
          } catch (e) {
            // JSON parse error, clear storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
      } catch (e) {
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // If children is a function, call it with the user
  if (typeof children === 'function') {
    return (
      <AuthContext.Provider value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token,
        isLoading
      }}>
        {children({ user })}
      </AuthContext.Provider>
    );
  }

  // Otherwise render normally
  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      isAuthenticated: !!token,
      isLoading
    }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
