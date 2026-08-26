const express = require("express");

const battleController = require("../controllers/battle.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/", authMiddleware, battleController.createBattle);

router.get("/:battleId", authMiddleware, battleController.getBattleById);

module.exports = router;