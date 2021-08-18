const router = require("express").Router();
const controller = require("./orders.controller");

// router: /orders/:orderId
router
    .route("/:orderId")
    .get(controller.read)
    .put(controller.update)
    .delete(controller.destroy);

// router: /orders
router
    .route("/")
    .get(controller.list)
    .post(controller.create);

module.exports = router;
