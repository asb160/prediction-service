const express = require("express");
const predictionRoutes = require("./routes/prediction.routes");

const app = express();

app.use(express.json());
app.use("/", predictionRoutes);

module.exports = app;