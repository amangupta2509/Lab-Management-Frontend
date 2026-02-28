import axios from "axios";

const RAILWAY_BACKEND_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  "https://backend-production-cbbc.up.railway.app/api";

export async function testBackendConnection() {
  console.log("🔍 Testing backend connection...");
  console.log("🌐 Target URL:", RAILWAY_BACKEND_URL);

  try {
    // Test the health endpoint
    const response = await axios.get(
      `${RAILWAY_BACKEND_URL.replace("/api", "")}/health`,
      {
        timeout: 10000,
      }
    );

    console.log("✅ Backend connected successfully!");
    console.log("📊 Response:", response.data);
    return true;
  } catch (error: any) {
    console.error("❌ Backend connection failed!");
    console.error("🔴 Error:", error.message);

    if (error.response) {
      console.error("📛 Status:", error.response.status);
      console.error("📛 Data:", error.response.data);
    }

    return false;
  }
}
