const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function list(req, res, next) {
  res.json({ data: dishes });
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

  if (price < 0) {
    return next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0",
    });
  }

  next();
}

function create(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;

  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

module.exports = {
  list,
  create: [hasRequiredFields, priceGreaterThanZero, create],
};
