const mongoose = require("mongoose");
const app = require("./src/app");
const predictionService = require("./src/services/prediction.service");

const PORT = 3002;
const MONGO_URI = "mongodb://localhost:27017/predictions";

async function iniciar() {
    await mongoose.connect(MONGO_URI);
    console.log("Conexión a MongoDB establecida");

    await predictionService.initModel();

    app.listen(PORT, () => {
        console.log(`prediction-service escuchando en http://localhost:${PORT}`);
    });
}

iniciar().catch((error) => {
    console.error("Error al iniciar el servidor:", error);
    process.exit(1);
});