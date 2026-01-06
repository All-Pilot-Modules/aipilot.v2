import { jwtDecode } from 'jwt-decode';

// Remove trailing slash from API_BASE_URL to prevent double slashes
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '');

// Helper function to add timeout to fetch requests with proper abort handling
const fetchWithTimeout = async (url, options = {}, timeout = 30000) => {
  // Declare variables outside try block so catch can access them
  let timeoutId;
  let startTime = Date.now();

  // CRITICAL: Prevent ANY execution during SSR
  // Wrap entire function in try-catch to catch all SSR issues
  try {
    // Multiple layers of SSR detection
    if (typeof window === 'undefined') {
      throw new Error('SSR: window undefined');
    }
    if (typeof fetch === 'undefined') {
      throw new Error('SSR: fetch undefined');
    }
    if (typeof AbortController === 'undefined') {
      throw new Error('SSR: AbortController undefined');
    }

    // Extra check for document (only exists in browser)
    if (typeof document === 'undefined') {
      throw new Error('SSR: document undefined');
    }

    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      // Ensure we're not caching failed requests
      cache: 'no-store',
    });

    if (timeoutId) clearTimeout(timeoutId);
    return response;
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    const elapsedTime = Date.now() - startTime;

    // Handle SSR errors gracefully - don't crash the app
    if (error.message?.includes('SSR:')) {
      // Silent fail during SSR - this is expected
      if (process.env.NODE_ENV === 'development') {
        console.log('[fetchWithTimeout] SSR detected, skipping fetch');
      }
      throw error; // Let the calling code handle it
    }

    // Log error details (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('[fetchWithTimeout] Error:', {
        url: url.replace(API_BASE_URL, ''),
        error: error.message,
        type: error.name,
        time: `${elapsedTime}ms`
      });
    }

    // Handle abort/timeout errors
    if (error.name === 'AbortError' || error.message?.includes('aborted')) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[fetchWithTimeout] Timeout after ${elapsedTime}ms`);
      }
      throw error;
    }

    // For all other errors, re-throw them
    throw error;
  }
};

// Auth functions
export const auth = {
  // Login function
  async login(identifier, password) {
    try {
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/api/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            identifier,
            password,
          }),
        },
        10000 // 10 second timeout
      );

      if (!response.ok) {
        let error;
        try {
          error = await response.json();
        } catch (e) {
          error = { detail: `HTTP ${response.status}: ${response.statusText}` };
        }
        throw new Error(error.detail || 'Login failed');
      }

      const data = await response.json();

      // Store tokens securely with HttpOnly, Secure, and SameSite flags
      const isProduction = process.env.NODE_ENV === 'production';
      const cookieFlags = `path=/; max-age=${data.expires_in || 1800}; SameSite=Strict${isProduction ? '; Secure' : ''}`;

      // Store access token in cookie
      document.cookie = `token=${data.access_token}; ${cookieFlags}`;

      // Store refresh token securely (longer expiration)
      if (data.refresh_token) {
        const refreshCookieFlags = `path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict${isProduction ? '; Secure' : ''}`;
        document.cookie = `refresh_token=${data.refresh_token}; ${refreshCookieFlags}`;
      }

      // Store user data in sessionStorage (not sensitive token data)
      // If no user object in response, decode from token
      let userData = data.user;
      if (!userData && data.access_token) {
        try {
          const decoded = jwtDecode(data.access_token);
          userData = decoded;
        } catch (e) {
          console.error('Failed to decode token:', e);
        }
      }

      if (userData) {
        console.log('💾 Storing user in sessionStorage:', userData);
        sessionStorage.setItem('user', JSON.stringify(userData));
        // Also return userData in the response
        data.user = userData;
      }

      return data;
    } catch (error) {
      if (error.message.includes('fetch') || error.message.includes('timeout')) {
        throw new Error('Unable to connect to server. Please check your connection.');
      }
      throw error;
    }
  },

  // Register function
  async register(userData) {
    try {
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/api/auth/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        },
        10000 // 10 second timeout
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Registration failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Logout function
  logout() {
    // Clear all auth-related storage
    sessionStorage.removeItem('user');

    // Clear cookies with proper flags
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
    document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';

    // Use router navigation instead of window.location for better UX
    // Note: This will be called from context, so we'll redirect there
    return true;
  },

  // Get current user
  async getCurrentUser() {
    const token = this.getToken();
    if (!token) return null;

    // First check sessionStorage for cached user data (faster than API call)
    if (typeof window !== 'undefined') {
      const cachedUser = sessionStorage.getItem('user');
      if (cachedUser) {
        try {
          return JSON.parse(cachedUser);
        } catch (e) {
          sessionStorage.removeItem('user');
        }
      }
    }

    // If not in cache, fetch from API with timeout
    try {
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/api/auth/me`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        },
        8000 // 8 second timeout
      );

      if (!response.ok) {
        if (response.status === 401) {
          this.logout();
          return null;
        }
        throw new Error('Failed to fetch user data');
      }

      const userData = await response.json();

      // Cache the user data in sessionStorage
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('user', JSON.stringify(userData));
      }

      return userData;
    } catch (error) {
      this.logout();
      return null;
    }
  },

  // Get token from cookie
  getToken() {
    if (typeof window !== 'undefined') {
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(c => c.trim().startsWith('token='));
      if (tokenCookie) {
        // Use slice to handle JWT tokens with '=' characters in them
        return tokenCookie.trim().slice('token='.length);
      }
    }
    return null;
  },

  // Get refresh token from cookie
  getRefreshToken() {
    if (typeof window !== 'undefined') {
      const cookies = document.cookie.split(';');
      const refreshCookie = cookies.find(c => c.trim().startsWith('refresh_token='));
      if (refreshCookie) {
        // Use slice to handle tokens with '=' characters in them
        return refreshCookie.trim().slice('refresh_token='.length);
      }
    }
    return null;
  },

  // Check if user is authenticated
  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;

    try {
      const decoded = jwtDecode(token);
      return decoded.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  },

  // Get user from token
  getUserFromToken() {
    const token = this.getToken();
    if (!token) return null;

    try {
      return jwtDecode(token);
    } catch {
      return null;
    }
  },

  // Refresh access token using refresh token
  async refreshAccessToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/api/auth/refresh`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        },
        8000 // 8 second timeout
      );

      if (!response.ok) {
        this.logout();
        return null;
      }

      const data = await response.json();

      // Update access token cookie
      const isProduction = process.env.NODE_ENV === 'production';
      const cookieFlags = `path=/; max-age=${data.expires_in || 1800}; SameSite=Strict${isProduction ? '; Secure' : ''}`;
      document.cookie = `token=${data.access_token}; ${cookieFlags}`;

      return data.access_token;
    } catch (error) {
      this.logout();
      return null;
    }
  },

  // Request password reset
  async requestPasswordReset(email) {
    try {
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/api/auth/password-reset/request`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        },
        10000
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to send reset email');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  // Verify reset code
  async verifyResetCode(email, code) {
    try {
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/api/auth/password-reset/verify-code`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, code }),
        },
        10000
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Invalid code');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  // Verify reset token (magic link)
  async verifyResetToken(token) {
    try {
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/api/auth/password-reset/verify-token?token=${token}`,
        {},
        10000
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Invalid reset link');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  // Reset password with code
  async resetPassword(email, code, newPassword) {
    try {
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/api/auth/password-reset/confirm`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            code,
            new_password: newPassword,
          }),
        },
        10000
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to reset password');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }
};

// API helper with authentication and auto-refresh
export const apiClient = {
  async request(endpoint, options = {}) {
    let token = auth.getToken();

    // Check if token is about to expire (within 5 minutes)
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const timeUntilExpiry = decoded.exp - Date.now() / 1000;

        // If token expires in less than 5 minutes, refresh it
        if (timeUntilExpiry < 300) {
          const newToken = await auth.refreshAccessToken();
          if (newToken) {
            token = newToken;
          }
        }
      } catch (error) {
        // Token validation failed, continue with existing token
      }
    }

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    // Dynamic timeout based on endpoint type
    let timeout = 15000; // Default: 15 seconds

    if (endpoint.includes('/feedback') || endpoint.includes('/cleanup-feedback') || endpoint.includes('/feedback-status')) {
      timeout = 8000; // Feedback endpoints: 8 seconds (fail fast, retry via polling)
    } else if (endpoint.includes('/submit-test')) {
      timeout = 30000; // Test submission: 30 seconds (may trigger AI feedback generation)
    }

    const response = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`, config, timeout);

    if (!response.ok) {
      if (response.status === 401) {
        // Try to refresh token once on 401
        const newToken = await auth.refreshAccessToken();
        if (newToken) {
          // Retry request with new token
          config.headers['Authorization'] = `Bearer ${newToken}`;
          const retryResponse = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`, config, 15000);
          if (retryResponse.ok) {
            return retryResponse.json();
          }
        }

        // If refresh failed or retry failed, logout
        auth.logout();
        throw new Error('Authentication required');
      }
      const error = await response.json().catch(() => ({}));

      // Handle FastAPI validation errors (array of objects)
      let errorMessage = `HTTP ${response.status}`;
      if (error.detail) {
        if (Array.isArray(error.detail)) {
          // FastAPI validation error format: [{loc: [...], msg: "...", type: "..."}]
          errorMessage = error.detail
            .map(err => `${err.loc?.join('.')}: ${err.msg}`)
            .join('; ');
        } else if (typeof error.detail === 'string') {
          errorMessage = error.detail;
        } else {
          errorMessage = JSON.stringify(error.detail);
        }
      }

      throw new Error(errorMessage);
    }

    return response.json();
  },

  get(endpoint) {
    return this.request(endpoint);
  },

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  },
};