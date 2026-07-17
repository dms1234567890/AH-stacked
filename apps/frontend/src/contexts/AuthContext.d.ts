import React from 'react';
interface User {
    id: string;
    username: string;
    name: string;
    email?: string;
    mobile?: string;
    post: string;
    role: string;
}
interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
}
export declare function AuthProvider({ children }: {
    children: React.ReactNode;
}): React.JSX.Element;
export declare function useAuth(): AuthContextType;
export {};
//# sourceMappingURL=AuthContext.d.ts.map