const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// Middleware functions for validation
function hasRequiredFields(req, res, next) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const data = req.body.data || {};
  const requiredFields = ["deliverTo", "mobileNumber", "dishes"];
  for (const field of requiredFields) {
    if (!data[field]) {
      return next({
        status: 400,
        message: `Order must include a ${field}`,
      });
    }
  }
  next();
}

function dishesPropertyIsValid(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  // Checks if dishes exists and is defined
  if (
    (Array.isArray(dishes) && !dishes.length) ||
    !Array.isArray(dishes) ||
    dishes === undefined
  ) {
    return next({
      status: 400,
      message: "dish",
    });
  }
  // Checks the quantity property of dishes
  for (let index = 0; index < dishes.length; index++) {
    const dish = dishes[index];

    if (
      dish.quantity == undefined ||
      dish.quantity <= 0 ||
      !Number.isInteger(dish.quantity)
    ) {
      return next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  }
  next();
}

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId); // find input order in orders
  if (foundOrder) {
    res.locals.foundOrder = foundOrder; // set foundOrder to local variable
    return next();
  }
  next({
    status: 404,
    message: `Order doesn't exist: ${orderId}`,
  });
}

function statusIsValid(req, res, next) {
  const { data: { status } = {} } = req.body;
  const validStatuses = ["pending", "preparing", "out-for-delivery"];
  if (status == undefined || status === "" || !validStatuses.includes(status)) {
    return next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery, delivered",
    });
  } else if (status === "delivered") {
    return next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  }
  next();
}

// Checks if order Id in route and request body match
function bodyOrderIdRouteOrderIdMatch(req, res, next) {
  const { orderId } = req.params;
  const { data: { id } = {} } = req.body;
  if (id && orderId !== id) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
    });
  }
  next();
}

// Only pending orders can be deleted
function statusIsPending(req, res, next) {
  const order = res.locals.foundOrder;
  if (order.status === "pending") {
    return next();
  }
  next({
    status: 400,
    message: "An order cannot be deleted unless it is pending",
  });
}

// Handlers
function list(req, res, next) {
  res.json({ data: orders });
}

function create(req, res, next) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function read(req, res, next) {
  res.json({ data: res.locals.foundOrder });
}

function update(req, res, next) {
  const order = res.locals.foundOrder;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  // update the profile
  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;

  res.json({ data: order });
}

function destroy(req, res, next) {
  const orderId = req.params;
  const index = orders.findIndex((order) => order.id === orderId); // find index of order to be deleted
  orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  create: [hasRequiredFields, dishesPropertyIsValid, create],
  read: [orderExists, read],
  update: [
    orderExists,
    bodyOrderIdRouteOrderIdMatch,
    hasRequiredFields,
    dishesPropertyIsValid,
    statusIsValid,
    update,
  ],
  destroy: [orderExists, statusIsPending, destroy],
};
