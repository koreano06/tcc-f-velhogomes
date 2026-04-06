const express = require("express");
const asyncHandler = require("./utils/asyncHandler");
const { dashboard } = require("./controllers/dashboardController");
const { listarEstoque } = require("./controllers/estoqueController");
const {
  listarMateriais,
  criarMaterial,
  atualizarMaterial,
  desativarMaterial,
} = require("./controllers/materialController");
const { registrarVenda, registrarCompra } = require("./controllers/transactionController");
const { financeiroPorPeriodo, totalVendidoPorMaterial } = require("./controllers/relatorioController");
const { totalVendidoPorCliente } = require("./controllers/relatorioClienteController");
const { totalVendidoPorPeriodo } = require("./controllers/relatorioPeriodoController");
const managementController = require("./controllers/management.controller");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

router.get("/estoque", asyncHandler(listarEstoque));

router.get("/materiais", asyncHandler(listarMateriais));
router.post("/materiais", asyncHandler(criarMaterial));
router.put("/materiais/:id", asyncHandler(atualizarMaterial));
router.delete("/materiais/:id", asyncHandler(desativarMaterial));

router.post("/sales", asyncHandler(registrarVenda));
router.post("/purchases", asyncHandler(registrarCompra));

router.get("/dashboard", asyncHandler(dashboard));
router.get("/reports/financial", asyncHandler(financeiroPorPeriodo));
router.get("/reports/materials", asyncHandler(totalVendidoPorMaterial));
router.get("/reports/clients", asyncHandler(totalVendidoPorCliente));
router.get("/reports/period", asyncHandler(totalVendidoPorPeriodo));
router.get("/management/overview", asyncHandler(managementController.getOverview));
router.get("/management/finance", asyncHandler(managementController.getFinance));
router.get("/management/partners", asyncHandler(managementController.getPartners));
router.get("/management/audit", asyncHandler(managementController.getAudit));

module.exports = router;
