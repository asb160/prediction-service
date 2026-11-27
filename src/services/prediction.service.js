const ort = require("onnxruntime-node");
const path = require("path");
const fs = require("fs");
const Prediction = require("../models/prediction.model");

const MODEL_VERSION = "v1.0";
const modelPath = path.join(__dirname, "../../modelo/modelo.onnx");
const normPath = path.join(__dirname, "../../modelo/normalizacion.json");

const norm = JSON.parse(fs.readFileSync(normPath, "utf8"));

let session = null;

async function initModel() {
    session = await ort.InferenceSession.create(modelPath);
    console.log("Modelo ONNX cargado correctamente");
}

function isReady() {
    return session !== null;
}

function getModelVersion() {
    return MODEL_VERSION;
}

function getFeatures() {
    return norm.features;
}

async function predict(features) {
    if (!isReady()) {
        const error = new Error("Model is not ready");
        error.status = 503;
        throw error;
    }

    if (
        !Array.isArray(features) ||
        features.length !== norm.mean.length ||
        !features.every((v) => typeof v === "number" && Number.isFinite(v))
    ) {
        const error = new Error(
            `Se esperan ${norm.mean.length} valores numéricos finitos`
        );
        error.status = 400;
        throw error;
    }

    const inicio = performance.now();

    const datos = features.map(
        (valor, i) => (valor - norm.mean[i]) / norm.scale[i]
    );

    const tensor = new ort.Tensor(
        "float32",
        Float32Array.from(datos),
        [1, datos.length]
    );

    const resultado = await session.run({
        [session.inputNames[0]]: tensor
    });

    const latencyMs = Number((performance.now() - inicio).toFixed(2));
    const prediction = Number(resultado[session.outputNames[0]].data[0]);

    return { prediction, latencyMs };
}

async function savePrediction({ features, prediction, latencyMs, meta = {} }) {
    const doc = new Prediction({
        dataId: meta.dataId || null,
        features,
        prediction,
        featureCount: meta.featureCount ?? features.length,
        source: meta.source || "unknown",
        correlationId: meta.correlationId || null,
        latencyMs,
        timestamp: new Date()
    });

    return await doc.save();
}

module.exports = {
    initModel,
    isReady,
    getModelVersion,
    getFeatures,
    predict,
    savePrediction
};