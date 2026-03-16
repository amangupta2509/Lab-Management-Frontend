import axios from "axios";

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
