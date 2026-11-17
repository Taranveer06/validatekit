/**
 * ValidateKit - Core Validator Engine
 * 
 * Provides the main `validate(data, schema)` function.
 */

/**
 * Validates a data object against a schema definition.
 * 
 * @param {Object} data - The input data to validate.
 * @param {Object} schema - The schema describing validation rules for each field.
 * @returns {{ valid: boolean, errors: Object.<string, string[]> }}
 */
function validate(data, schema) {
  // Validate schema input to prevent crashes
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
    return {
      valid: false,
      errors: {
        _schema: ["Schema must be a valid non-null object"]
      }
    };
  }

  // Ensure data is treated as an object safely without throwing errors
  const safeData = data && typeof data === "object" && !Array.isArray(data) ? data : {};

  const errors = {};

  // Iterate over each field defined in the schema
  for (const field of Object.keys(schema)) {
    const rulesList = schema[field];

    // Schema rules for a field must be an array
    if (!Array.isArray(rulesList)) {
      errors[field] = ["Validation rules for this field must be an array"];
      continue;
    }

    const value = safeData[field];

    // Run every rule on the field's value and collect all errors
    for (const rule of rulesList) {
      if (typeof rule !== "function") {
        if (!errors[field]) {
          errors[field] = [];
        }
        errors[field].push("Invalid rule: rule must be a function");
        continue;
      }

      let result;
      try {
        result = rule(value);
      } catch (err) {
        result = {
          valid: false,
          message: `Rule execution failed: ${err.message}`
        };
      }

      // Check if the rule returned a valid result object
      if (result && typeof result === "object") {
        if (!result.valid) {
          if (!errors[field]) {
            errors[field] = [];
          }
          errors[field].push(result.message || "Invalid value");
        }
      } else {
        // Guard against malformed rules returning null, undefined, or primitive values
        if (!errors[field]) {
          errors[field] = [];
        }
        errors[field].push("Rule returned an invalid result format");
      }
    }
  }

  // The result is valid if no errors were found in any field
  const isValid = Object.keys(errors).length === 0;

  return {
    valid: isValid,
    errors: errors
  };
}

module.exports = {
  validate
};
