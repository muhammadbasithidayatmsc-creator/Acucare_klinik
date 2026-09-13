import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { ClinicStore } from '../lib/storage';

interface AuthContextType {
  currentUser: User | null;
  role: UserRole;
  isOwner: boolean;
  isAdmin: boolean;
  login: (email: string, role?: UserRole) => boolean;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    ClinicStore.initialize();
    const storedUser = localStorage.getItem('acucare_current_user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch {
        // default to owner
        const users = ClinicStore.getUsers();
        setCurrentUser(users[0] || null);
      }
    } else {
      // Default to Yogi Pangestu (OWNER)
      const users = ClinicStore.getUsers();
      if (users.length > 0) {
        setCurrentUser(users[0]);
        localStorage.setItem('acucare_current_user', JSON.stringify(users[0]));
      }
    }
  }, []);

  const login = (email: string, preferredRole?: UserRole): boolean => {
    const users = ClinicStore.getUsers();
    const foundUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (foundUser) {
      setCurrentUser(foundUser);
      localStorage.setItem('acucare_current_user', JSON.stringify(foundUser));
      return true;
    }

    // If new login or demo
    const role: UserRole = preferredRole || (email.toLowerCase().includes('admin') ? 'ADMIN' : 'OWNER');
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: role === 'OWNER' ? 'Yogi Pangestu' : 'Staf Admin Klinik',
      email: email,
      role: role,
      created_at: new Date().toISOString(),
    };
    const updatedUsers = [...users, newUser];
    ClinicStore.saveUsers(updatedUsers);
    setCurrentUser(newUser);
    localStorage.setItem('acucare_current_user', JSON.stringify(newUser));
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('acucare_current_user');
  };

  const switchRole = (newRole: UserRole) => {
    if (!currentUser) return;
    const updated: User = {
      ...currentUser,
      role: newRole,
      name: newRole === 'OWNER' ? 'Yogi Pangestu' : 'Siti Rahma (Admin)',
      email: newRole === 'OWNER' ? 'yogi.acucare@gmail.com' : 'admin@acucare.clinic',
    };
    setCurrentUser(updated);
    localStorage.setItem('acucare_current_user', JSON.stringify(updated));
  };

  const role: UserRole = currentUser?.role || 'OWNER';
  const isOwner = role === 'OWNER';
  const isAdmin = role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isOwner,
        isAdmin,
        login,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
