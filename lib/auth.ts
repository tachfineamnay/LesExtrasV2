
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'; // Fallback for dev

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
    // Set cookie for 7 days
    Cookies.set('accessToken', token, { expires: 7, secure: window.location.protocol === 'https:' });
  },

  getToken() {
    return Cookies.get('accessToken');
  },

  logout() {
    Cookies.remove('accessToken');
    window.location.href = '/auth/login';
  },
  
  isAuthenticated() {
      return !!Cookies.get('accessToken');
  }
};
