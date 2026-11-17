/**
 * ValidateKit
 * A lightweight, zero-dependency JavaScript validation library.
 */

const { validate } = require("./validator");
const rules = require("./rules");

module.exports = {
  validate,
  rules
};

