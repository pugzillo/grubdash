const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// Validation functions

// Checks if the dish Id in route and body match
function BodyIdRouteIdMatch(req, res, next) {
  const { dishId } = req.params; // route id
  const { data: { id } = {} } = req.body; // body id

  if (dishId && id) {
    if (dishId === id) {
      return next();
    }

    next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
  }
  next();
}

function hasRequiredFields(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const data = req.body.data || {};
  const requiredFields = ["name", "description", "price", "image_url"];
  for (const field of requiredFields) {
    if (!data[field]) {
      return next({
        status: 400,
        message: `Dish must include a ${field}`,
      });
    }
  }
  next();
}

function priceGreaterThanZero(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (price <= 0) {
    return next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0",
    });
  }
  next();
}

function priceIsANumber(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (typeof price !== "number") { // price must be a number
    return next({
      status: 400,
      message: "Dish price is not a number",
    });
  }
  next();
}

function dishIdExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.foundDish = foundDish; // local variable for all functions
    return next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${dishId}.`,
  });
}

// Handlers

// sends back all dishes
function list(req, res, next) {
  res.json({ data: dishes });
}

// get new dish
function create(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish); // add new dish
  res.status(201).json({ data: newDish });
}

// send back specific dish
function read(req, res, next) {
  res.status(200).json({ data: res.locals.foundDish });
}

function update(req, res, next) {
  const { data: { id, name, description, price, image_url } = {} } = req.body; // input
  const data = req.body.data || {};
  const dish = res.locals.foundDish; // original dish info
  const requiredFields = ["name", "description", "price", "image_url"];

  for (const field of requiredFields) {
    if (data[field] !== dish[field]) {
      dish[field] = data[field];
    }
  }

  res.json({ data: dish });
}

module.exports = {
  list,
  create: [hasRequiredFields, priceGreaterThanZero, create],
  read: [dishIdExists, read],
  update: [
    dishIdExists,
    hasRequiredFields,
    priceIsANumber,
    priceGreaterThanZero,
    BodyIdRouteIdMatch,
    update,
  ],
  dishIdExists,
};
