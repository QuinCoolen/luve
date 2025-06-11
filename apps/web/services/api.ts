const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

export const auctionService = {
  getAllAuctions: async () => {
    return fetchAPI('/api/auctions');
  },

  getAuctionById: async (id: string) => {
    return fetchAPI(`/api/auctions/${id}`);
  },

  getMyAuctions: async (cookie?: string) => {
    try {
      return await fetchAPI('/api/auctions/user', {
        credentials: 'include',
        headers: cookie ? {
          Cookie: cookie
        } : undefined
      });
    } catch (error: any) {
      if (error.message.includes('401')) {
        return [];
      }
      throw error;
    }
  }
};

export const userService = {
  register: async (credentials: { username: string; email: string; password: string }) => {
    return fetchAPI('/api/user/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  login: async (credentials: { email: string; password: string }) => {
    return fetchAPI('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      credentials: 'include',
    });
  },

  logout: async () => {
    try {
      await fetchAPI('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  },

  me: async () => {
    try {
      return await fetchAPI('/api/user/me', {
        credentials: 'include',
      });
    } catch (error: any) {
      if (error.message.includes('401')) {
        return null;
      }
    }
  }
};

export const checkoutService = {
  createCheckoutSession: async (auctionId: number) => {
    const response = await fetch(`${API_URL}/create-checkout-session?auctionId=${auctionId}`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return { redirectUrl: data.url };
  }
};