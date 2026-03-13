
import React, { createContext, useContext, useState, useEffect, useMemo, PropsWithChildren } from 'react';
import { 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    updateProfile,
    signInWithPopup,
    sendEmailVerification,
    GoogleAuthProvider,
    User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../firebase';

interface User {
    id: string;
    email: string;
    displayName?: string | null;
    photoURL?: string | null;
    emailVerified: boolean;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    error: string | null;
    login: (credentials: any) => Promise<void>;
    signup: (credentials: any) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    updateUserProfile: (profile: { displayName?: string | null; photoURL?: string | null }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                setUser({
                    id: firebaseUser.uid,
                    email: firebaseUser.email || '',
                    displayName: firebaseUser.displayName,
                    photoURL: firebaseUser.photoURL,
                    emailVerified: firebaseUser.emailVerified
                });
            } else {
                setUser(null);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async ({ email, password }: any) => {
        setIsLoading(true);
        setError(null);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            setError(err.message || 'Login failed');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const signup = async ({ email, password, fullName }: any) => {
        setIsLoading(true);
        setError(null);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            if (userCredential.user) {
                await updateProfile(userCredential.user, { displayName: fullName });
                await sendEmailVerification(userCredential.user);
                return userCredential.user.uid;
            }
        } catch (err: any) {
            setError(err.message || 'Signup failed');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const loginWithGoogle = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (err: any) {
            setError(err.message || 'Google Login failed');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            await signOut(auth);
        } finally {
            setIsLoading(false);
        }
    };

    const updateUserProfile = async (profile: any) => {
        if (!auth.currentUser) return;
        setIsLoading(true);
        try {
            await updateProfile(auth.currentUser, profile);
            // Force refresh user state
            const firebaseUser = auth.currentUser;
            setUser({
                id: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
                emailVerified: firebaseUser.emailVerified
            });
        } finally {
            setIsLoading(false);
        }
    };

    const value = useMemo(() => ({
        user,
        isLoading,
        error,
        login,
        signup,
        loginWithGoogle,
        logout,
        updateUserProfile
    }), [user, isLoading, error]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
