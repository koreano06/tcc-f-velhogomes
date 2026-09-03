const express = require("express");
const asyncHandler = require("./utils/asyncHandler");
const { authenticate, authorize } = require("./middlewares/auth");
const authController = require("./controllers/authController");
const { listarMateriais, criarMaterial, atualizarMaterial, desativarMaterial } = require("./controllers/materialController");
const { registrarVenda, registrarCompra } = require("./controllers/transactionController");
const { financeiroPorPeriodo, lucroPorMaterial } = require("./controllers/relatorioController");
const managementController = require("./controllers/management.controller");

const router = express.Router();

router.get("/saude", (req, res) => { res.json({ status: "ok" }); });

router.post("/autenticacao/entrar", asyncHandler(authController.login));

router.use(asyncHandler(authenticate));

router.get("/autenticacao/perfil", asyncHandler(authController.me));

router.get("/materiais", authorize("owner", "employee", "viewer"), asyncHandler(listarMateriais));
router.post("/materiais", authorize("owner"), asyncHandler(criarMaterial));
router.put("/materiais/:id", authorize("owner"), asyncHandler(atualizarMaterial));
router.delete("/materiais/:id", authorize("owner"), asyncHandler(desativarMaterial));

router.post("/vendas", authorize("owner", "employee"), asyncHandler(registrarVenda));
router.post("/compras", authorize("owner", "employee"), asyncHandler(registrarCompra));

router.get("/relatorios/financeiro", authorize("owner"), asyncHandler(financeiroPorPeriodo));
router.get("/relatorios/lucro-por-material", authorize("owner"), asyncHandler(lucroPorMaterial));

router.get("/gestao/resumo", authorize("owner"), asyncHandler(managementController.getOverview));
router.get("/gestao/financeiro", authorize("owner"), asyncHandler(managementController.getFinance));
router.get("/gestao/parceiros", authorize("owner"), asyncHandler(managementController.getPartners));
router.get("/gestao/auditoria", authorize("owner"), asyncHandler(managementController.getAudit));

module.exports = router;
