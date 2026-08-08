const express = require("express");
const cors = require("cors");
const { validateEnv, PORT } = require("./src/config/env");
const healthRoute = require("./src/routes/health");
const errorHandler = require("./src/middleware/errorHandler");

validateEnv();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Mission Control Twin Backend is running 🚀"
  });
});

app.use("/api", healthRoute);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});