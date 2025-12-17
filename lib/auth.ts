
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'; // Fallback for dev

// Cookie options for proper persistence
const getCookieOptions = (): Cookies.CookieAttributes => {
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  return {
    expires: 7, // 7 days
    path: '/',
    sameSite: 'lax',
    secure: isSecure,
  };
};

export interface LoginResponse {
  accessToken: string;
}

export const auth = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include', // Important for cookies
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Identifiants incorrects');
      }
      throw new Error('Une erreur est survenue lors de la connexion');
    }

    return response.json();
  },

  setToken(token: string) {
    // Set cookie with proper options for persistence
    Cookies.set('accessToken', token, getCookieOptions());
    console.log('[Auth] Token saved to cookie');
  },

  getToken() {
    return Cookies.get('accessToken');
  },

  logout() {
    Cookies.remove('accessToken', { path: '/' });
    window.location.href = '/auth/login';
  },
  
  isAuthenticated() {
    return !!Cookies.get('accessToken');
  }
};
