const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
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
};

export const userService = {
  register: async (credentials: { userName: string; email: string; password: string }) => {
    return fetchAPI('/api/user/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  login: async (credentials: { email: string; password: string }) => {
    return fetchAPI('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  logout: async () => {
    try {
      await fetchAPI('/api/auth/logout', {
        method: 'POST',
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