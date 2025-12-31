// API utility functions for making HTTP requests
// Get API URL from environment variable or use production fallback
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  // Check if envUrl is a valid string (not undefined, null, or empty)
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '' && envUrl !== 'undefined') {
    return envUrl.trim();
  }
  
  // Production fallback
  return 'https://wms.servx24.com/api';
};

const API_BASE_URL = getApiBaseUrl();

// Log API URL in development for debugging (remove in production)
if (import.meta.env.DEV) {
  console.log('🔍 API Base URL:', API_BASE_URL);
}


// Generic API request function
export const apiRequest = async (endpoint, options = {}) => {
  // Validate API_BASE_URL before constructing URL
  if (!API_BASE_URL || API_BASE_URL === 'undefined' || API_BASE_URL.includes('undefined')) {
    console.error('❌ Invalid API_BASE_URL:', API_BASE_URL);
    throw new Error('API base URL is not configured. Please check environment variables.');
  }
  
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Additional validation for the final URL
  if (url.includes('undefined')) {
    console.error('❌ Invalid API URL constructed:', url);
    throw new Error(`Invalid API URL: ${url}. API base URL may not be configured correctly.`);
  }
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  // Add authentication token if available
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      // Try to get the error response body
      let errorData;
      try {
        errorData = await response.json();
        console.error('🔍 API Error Response:', errorData);
        if (errorData.errors) {
          console.error('🔍 Detailed Validation Errors:', errorData.errors);
          Object.keys(errorData.errors).forEach(field => {
            console.error(`🔍 Field "${field}" error:`, errorData.errors[field]);
          });
        }
      } catch (jsonError) {
        console.error('🔍 Could not parse error response as JSON');
      }
      
      const error = new Error(`HTTP error! status: ${response.status}`);
      error.response = { data: errorData, status: response.status };
      throw error;
    }
    
    // Check if response is HTML (404 page) instead of JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      throw new Error('Server returned HTML instead of JSON - endpoint may not exist');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// GET request
export const apiGet = (endpoint, options = {}) => {
  return apiRequest(endpoint, { ...options, method: 'GET' });
};

// POST request
export const apiPost = (endpoint, data, options = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// PUT request
export const apiPut = (endpoint, data, options = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

// PATCH request
export const apiPatch = (endpoint, data, options = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

// DELETE request
export const apiDelete = (endpoint, options = {}) => {
  return apiRequest(endpoint, { ...options, method: 'DELETE' });
};

