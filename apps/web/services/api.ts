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
  login: async (credentials: { email: string; password: string }) => {
    return fetchAPI('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },
  
  register: async (userData: any) => {
    return fetchAPI('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
}; 