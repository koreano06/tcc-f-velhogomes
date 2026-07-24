const express = require("express");
const asyncHandler = require("./utils/asyncHandler");
<<<<<<< HEAD
const { authenticate, authorize } = require("./middlewares/auth");
const authController = require("./controllers/authController");
=======
const { dashboard } = require("./controllers/dashboardController");
>>>>>>> 9bd93b89a5a1c31e2b7bfb0c84358369ca6f1f7d
const { listarEstoque } = require("./controllers/estoqueController");
const {
  listarMateriais,
  criarMaterial,
  atualizarMaterial,
  desativarMaterial,
} = require("./controllers/materialController");
const { registrarVenda, registrarCompra } = require("./controllers/transactionController");
<<<<<<< HEAD
const {
  financeiroPorPeriodo,
  lucroPorMaterial,
  totalVendidoPorMaterial,
} = require("./controllers/relatorioController");
=======
const { financeiroPorPeriodo, totalVendidoPorMaterial } = require("./controllers/relatorioController");
const { totalVendidoPorCliente } = require("./controllers/relatorioClienteController");
const { totalVendidoPorPeriodo } = require("./controllers/relatorioPeriodoController");
>>>>>>> 9bd93b89a5a1c31e2b7bfb0c84358369ca6f1f7d
const managementController = require("./controllers/management.controller");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

<<<<<<< HEAD
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

=======
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
>>>>>>> 9bd93b89a5a1c31e2b7bfb0c84358369ca6f1f7d
