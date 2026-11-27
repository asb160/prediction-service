const predictionService = require("../services/prediction.service");

function getHealth(req, res) {
    res.status(200).json({
        status: "ok",
        service: "prediction-service"
    });
}

function getReady(req, res) {
    const modelVersion = predictionService.getModelVersion();

    if (predictionService.isReady()) {
        return res.status(200).json({
            ready: true,
            modelVersion
        });
    }

    return res.status(503).json({
        ready: false,
        modelVersion,
        message: "Model is not ready"
    });
}

function getFeatures(req, res) {
    res.status(200).json({
        features: predictionService.getFeatures()
    });
}

async function predict(req, res) {
    try {
        const { features, meta } = req.body || {};

        if (
            meta &&
            meta.featureCount !== undefined &&
            meta.featureCount !== predictionService.getFeatures().length
        ) {
            return res.status(400).json({
                error: "meta.featureCount debe ser 7"
            });
        }

        const { prediction, latencyMs } = await predictionService.predict(features);

        const saved = await predictionService.savePrediction({
            features,
            prediction,
            latencyMs,
            meta
        });

        return res.status(201).json({
            predictionId: saved._id.toString(),
            prediction: saved.prediction,
            timestamp: saved.timestamp.toISOString(),
            latencyMs: saved.latencyMs
        });
    } catch (error) {
        console.error(error);

        const status = error.status || 500;
        const message =
            status === 400 || status === 503
                ? error.message
                : "Error al ejecutar la predicción";

        return res.status(status).json({ error: message });
    }
}

module.exports = {
    getHealth,
    getReady,
    getFeatures,
    predict
};