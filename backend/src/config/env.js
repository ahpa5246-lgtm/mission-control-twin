// Loads and validates required environment variables at startup.
// If any required variable is missing, the server exits immediately
// instead of failing later, silently, mid-request.

require("dotenv").config();

// Add any new required key here as the project grows
const REQUIRED_ENV_VARS = ["GEMINI_API_KEY"];

function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:", missing.join(", "));
    process.exit(1);
  }

  console.log("✅ Environment variables validated.");
}

module.exports = {
  validateEnv,
  PORT: process.env.PORT || 3000,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
};