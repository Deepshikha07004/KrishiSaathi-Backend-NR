import AsyncStorage from "@react-native-async-storage/async-storage";

// ======================================
// BASE API URL
// ======================================
const BASE_URL = "http://192.168.29.33:3000";

// ======================================
// IN-MEMORY TOKEN (FASTER THAN STORAGE)
// ======================================
let authToken = null;

// ======================================
// SET TOKEN AFTER LOGIN/SIGNUP
// ======================================
export const setAuthToken = (token) => {
  authToken = token;
};

// ======================================
// LOAD TOKEN FROM STORAGE (ON APP START)
// ======================================
export const loadStoredToken = async () => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    authToken = token;
  }
};

// ======================================
// GENERIC API REQUEST FUNCTION
// ======================================
export const apiRequest = async (endpoint, method = "GET", body = null) => {
  try {

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
      body: body ? JSON.stringify(body) : null,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || "API request failed");
    }

    return data;

  } catch (error) {

    console.error("API Error:", error);

    throw error;

  }
};


// ======================================
// REGISTER FARMER
// ======================================
export const registerFarmer = async (name, phoneNumber, language) => {
  return apiRequest("/api/auth/register", "POST", {
    name,
    phoneNumber,
    language,
  });
};


// ======================================
// LOGIN FARMER
// ======================================
export const loginFarmer = async (phoneNumber) => {
  return apiRequest("/api/auth/login", "POST", {
    phoneNumber,
  });
};


// ======================================
// TEST BACKEND CONNECTION
// ======================================
export const testBackend = async () => {
  return apiRequest("/", "GET");
};