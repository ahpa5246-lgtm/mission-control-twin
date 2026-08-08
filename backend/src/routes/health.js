// Simple health-check endpoint — confirms the server is running.
// Useful later for uptime monitoring (e.g. Render health checks).

const express = require("express");
const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;