import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '../types';

interface AuthRoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  toggleRole: () => void;
  isAuthority: boolean;
}

const AuthRoleContext = createContext<AuthRoleContextType | undefined>(undefined);

export const AuthRoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>(() => {
    return (localStorage.getItem('resq_guard_user_role') as UserRole) || 'authority';
  });

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem('resq_guard_user_role', newRole);
  };

  const toggleRole = () => {
    const nextRole = role === 'authority' ? 'analyst' : 'authority';
    setRole(nextRole);
  };

  return (
    <AuthRoleContext.Provider
      value={{
        role,
        setRole,
        toggleRole,
        isAuthority: role === 'authority'
      }}
    >
      {children}
    </AuthRoleContext.Provider>
  );
};

export const useAuthRole = (): AuthRoleContextType => {
  const context = useContext(AuthRoleContext);
  if (!context) {
    throw new Error('useAuthRole must be used within an AuthRoleProvider');
  }
  return context;
};
