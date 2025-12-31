import { apiGet } from '../utils/api';

export const fetchLandingPageData = async (cityName = 'Pune') => {
  // Ensure we have a valid city name (handle null, undefined, or string "null")
  const validCityName = (cityName && cityName !== 'null' && cityName.trim() !== '') 
    ? cityName 
    : 'Pune';
  
  console.log(`Fetching landing page data for city: ${validCityName}`);
  
  try {
    // Use the same endpoint as old website
    const cityParam = validCityName.toLowerCase();
    const response = await apiGet(`/active-cities/?city=${cityParam}`);
    
    console.log("✅ API Response Data (landing page):", response);

    // Handle response structure like old website: { status: "success", data: { cities: [...], filter: {...}, banners: [...] } }
    if (response.status === "success" && response.data) {
      return response.data;
    }

    // Return null if API response structure is unexpected (like old website)
    return null;
  } catch (error) {
    if (error.code === "ECONNABORTED" || error.message?.includes('timeout')) {
      console.error("❌ Request timed out. Backend may be slow or unreachable.");
    } else {
      console.error("❌ API Error:", error.message);
    }
    return null; // Return null on error (like old website)
  }
};

