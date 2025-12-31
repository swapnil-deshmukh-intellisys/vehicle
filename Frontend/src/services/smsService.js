// SMS service for OTP functionality
// Get API URL from environment variable or use production fallback
const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  // Check if envUrl is a valid string (not undefined, null, or empty)
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '' && envUrl !== 'undefined') {
    return envUrl.trim();
  }
  
  // Production fallback
  return 'https://wms.servx24.com/api';
};

const API_URL = getApiUrl();

export const sendSMS = async (businessid, mobile) => {
  const url = `${API_URL}/send-sms/`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ businessid, mobile }),
    });

    const resData = await response.json();
    console.log("🔍 SMS API response:", resData);
    console.log("🔍 Response status code:", response.status);

    // Check if response is ok (status 200-299)
    if (!response.ok) {
      console.error('🔍 SMS sending failed with status:', response.status);
      return {
        status: false,
        message: resData.message || `Server error: ${response.status}`,
      };
    }

    if (resData.status === true) {
      return {
        status: true,
        message: resData.message || "OTP sent",
        otp: resData.otp || null,
      };
    } else {
      return {
        status: false,
        message: resData.message || "Failed to send OTP",
      };
    }
  } catch (error) {
    console.error("❌ Error sending SMS:", error.message);
    return {
      status: false,
      message: error?.message || "Failed to send SMS",
    };
  }
};

export const verifyOtp = async ({ businessid, mobile, otp }) => {
  try {
    const response = await fetch(`${API_URL}/verify-otp/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ businessid, mobile, otp }),
    });

    const resData = await response.json();
    console.log("🔍 OTP verification response:", resData);
    console.log("🔍 Response status code:", response.status);

    // Check if response is ok (status 200-299)
    if (!response.ok) {
      console.error('🔍 OTP verification failed with status:', response.status);
      return {
        status: false,
        message: resData.message || `Server error: ${response.status}`,
      };
    }

    return resData;
  } catch (error) {
    console.error('❌ OTP verification failed:', error);
    return {
      status: false,
      message: error?.message || 'Something went wrong. Please check your connection and try again.',
    };
  }
};
