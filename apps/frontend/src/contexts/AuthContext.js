'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '@/lib/api';
const AuthContext = createContext(undefined);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        if (token && savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            }
            catch {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);
    const login = async (username, password) => {
        const response = await authApi.login({ username, password });
        // Backend returns: { user: {...}, tokens: { accessToken, refreshToken } }
        const { user: userData, tokens } = response.data;
        localStorage.setItem('token', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setUser(null);
        window.location.href = '/auth/login';
    };
    return (<AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>);
}
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
//# sourceMappingURL=AuthContext.js.map