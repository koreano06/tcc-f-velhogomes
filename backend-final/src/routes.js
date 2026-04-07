const express = require('express');
const router  = express.Router();

const materialController    = require('./controllers/materialController');
const compraController      = require('./controllers/compraController');
const vendaController       = require('./controllers/vendaController');
const estoqueController     = require('./controllers/estoqueController');
const managementController  = require('./controllers/managementController');
const relatorioController   = require('./controllers/relatorioController');

// Health check
router.get('/', (req, res) => res.json({ message: 'API Ferro Velho Gomes funcionando.' }));

// ── Materiais ─────────────────────────────────────────────
router.get   ('/materiais',      materialController.listarMateriais);
router.post  ('/materiais',      materialController.criarMaterial);
router.put   ('/materiais/:id',  materialController.atualizarMaterial);
router.delete('/materiais/:id',  materialController.deletarMaterial);

// ── Compras ───────────────────────────────────────────────
router.post('/purchases', compraController.registrarCompra);

// ── Vendas ────────────────────────────────────────────────
router.post('/sales', vendaController.registrarVenda);

// ── Estoque ───────────────────────────────────────────────
router.get('/estoque', estoqueController.getEstoque);

// ── Gerenciamento (owner) ─────────────────────────────────
router.get('/management/overview', managementController.getOverview);
router.get('/management/finance',  managementController.getFinance);
router.get('/management/partners', managementController.getPartners);
router.get('/management/audit',    managementController.getAudit);

// ── Relatórios ────────────────────────────────────────────
router.get('/reports/financial',        relatorioController.getFinancialReport);
router.get('/reports/profit-by-material', relatorioController.getProfitByMaterial);

module.exports = router;
