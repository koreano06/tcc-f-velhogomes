const express = require("express");
const asyncHandler = require("./utils/asyncHandler");
const { authenticate, authorize } = require("./middlewares/auth");
const authController = require("./controllers/authController");
const { listarEstoque } = require("./controllers/estoqueController");
const {
  listarMateriais,
  criarMaterial,
  atualizarMaterial,
  desativarMaterial,
} = require("./controllers/materialController");
const { registrarVenda, registrarCompra } = require("./controllers/transactionController");
const {
  financeiroPorPeriodo,
  lucroPorMaterial,
  totalVendidoPorMaterial,
} = require("./controllers/relatorioController");
const managementController = require("./controllers/management.controller");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

router.post("/auth/login", asyncHandler(authController.login));

// Daqui para baixo, toda rota exige usuario autenticado.
router.use(asyncHandler(authenticate));

router.get("/auth/me", asyncHandler(authController.me));

router.get("/estoque", authorize("owner", "employee", "viewer"), asyncHandler(listarEstoque));

router.get("/materiais", authorize("owner", "employee", "viewer"), asyncHandler(listarMateriais));
router.post("/materiais", authorize("owner"), asyncHandler(criarMaterial));
router.put("/materiais/:id", authorize("owner"), asyncHandler(atualizarMaterial));
router.delete("/materiais/:id", authorize("owner"), asyncHandler(desativarMaterial));

router.post("/sales", authorize("owner", "employee"), asyncHandler(registrarVenda));
router.post("/purchases", authorize("owner", "employee"), asyncHandler(registrarCompra));

router.get("/reports/financial", authorize("owner"), asyncHandler(financeiroPorPeriodo));
router.get("/reports/profit-by-material", authorize("owner"), asyncHandler(lucroPorMaterial));
router.get("/reports/materials", authorize("owner"), asyncHandler(totalVendidoPorMaterial));

router.get("/management/overview", authorize("owner"), asyncHandler(managementController.getOverview));
router.get("/management/finance", authorize("owner"), asyncHandler(managementController.getFinance));
router.get("/management/partners", authorize("owner"), asyncHandler(managementController.getPartners));
router.get("/management/audit", authorize("owner"), asyncHandler(managementController.getAudit));

module.exports = router;

