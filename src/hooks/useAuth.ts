import {useState, useEffect} from 'react';

// Mock auth user for local development (no Firebase needed)
export interface MockAuthUser {
  uid: string;
  email: string;
  displayName: string;
}

const MOCK_USER: MockAuthUser = {
  uid: 'mock_veejay',
  email: 'veejay@budgettracker.local',
  displayName: 'Veejay',
};

let currentUser: MockAuthUser | null = null;
let authListeners: Array<(user: MockAuthUser | null) => void> = [];

function notifyAuthListeners() {
  authListeners.forEach(cb => cb(currentUser));
}

export function mockSignIn(_email: string, _password: string): MockAuthUser {
  currentUser = MOCK_USER;
  notifyAuthListeners();
  return currentUser;
}

export function mockSignOut(): void {
  currentUser = null;
  notifyAuthListeners();
}

export function getMockCurrentUser(): MockAuthUser | null {
  return currentUser;
}

export function useAuth() {
  const [user, setUser] = useState<MockAuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auto-login for local development
    currentUser = MOCK_USER;
    setUser(MOCK_USER);
    setLoading(false);

    const listener = (u: MockAuthUser | null) => setUser(u);
    authListeners.push(listener);

    return () => {
      authListeners = authListeners.filter(l => l !== listener);
    };
  }, []);

  return {user, loading};
}
