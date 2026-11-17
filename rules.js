/**
 * ValidateKit - Built-in Validation Rules
 * 
 * Each rule is a factory function that returns a validator function:
 *   (value) => { valid: true } or { valid: false, message: "..." }
 */

/**
 * Checks whether a value is provided.
 * Rejects: undefined, null, and empty/whitespace-only strings.
 * 
 * @param {string} [customMessage] - Optional custom error message.
 * @returns {Function}
 */
function required(customMessage) {
  return function (value) {
    if (value === undefined || value === null) {
      return {
        valid: false,
        message: customMessage || "This field is required"
      };
    }

    if (typeof value === "string" && value.trim() === "") {
      return {
        valid: false,
        message: customMessage || "This field is required"
      };
    }

    return { valid: true };
  };
}

/**
 * Validates whether a value is a valid email address.
 * Empty or null values pass (use required() to enforce presence).
 * 
 * @param {string} [customMessage] - Optional custom error message.
 * @returns {Function}
 */
function email(customMessage) {
  // Matches standard email format: username @ domain . tld (rejects consecutive dots, missing TLD, etc.)
  const emailRegex = /^[^\s@]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;

  return function (value) {
    if (value === undefined || value === null || value === "") {
      return { valid: true };
    }

    if (typeof value !== "string" || !emailRegex.test(value.trim())) {
      return {
        valid: false,
        message: customMessage || "Please enter a valid email address"
      };
    }

    return { valid: true };
  };
}

/**
 * Validates a password against configurable security criteria.
 * 
 * Default options:
 * - minLength: 8
 * - requireUppercase: true
 * - requireLowercase: true
 * - requireNumber: true
 * - requireSpecial: true
 * 
 * Note: Password validation checks complexity, but does not guarantee password security.
 * Handles invalid options safely with sensible fallbacks.
 * 
 * @param {Object} [options={}] - Custom configuration options.
 * @returns {Function}
 */
function password(options = {}) {
  // Guard against non-object or null options
  const safeOptions = options && typeof options === "object" && !Array.isArray(options) ? options : {};

  // Validate minLength configuration safely (non-negative finite number)
  const safeMinLength = typeof safeOptions.minLength === "number" && Number.isFinite(safeOptions.minLength) && safeOptions.minLength >= 0
    ? Math.floor(safeOptions.minLength)
    : 8;

  const config = {
    minLength: safeMinLength,
    requireUppercase: safeOptions.requireUppercase !== undefined ? Boolean(safeOptions.requireUppercase) : true,
    requireLowercase: safeOptions.requireLowercase !== undefined ? Boolean(safeOptions.requireLowercase) : true,
    requireNumber: safeOptions.requireNumber !== undefined ? Boolean(safeOptions.requireNumber) : true,
    requireSpecial: safeOptions.requireSpecial !== undefined ? Boolean(safeOptions.requireSpecial) : true,
    message: typeof safeOptions.message === "string" ? safeOptions.message : undefined
  };

  const specialCharRegex = /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/]/;

  return function (value) {
    if (value === undefined || value === null || value === "") {
      return { valid: true };
    }

    if (typeof value !== "string") {
      return {
        valid: false,
        message: config.message || "Password must be a string"
      };
    }

    if (value.length < config.minLength) {
      return {
        valid: false,
        message: config.message || `Password must be at least ${config.minLength} characters long`
      };
    }

    if (config.requireUppercase && !/[A-Z]/.test(value)) {
      return {
        valid: false,
        message: config.message || "Password must contain at least one uppercase letter"
      };
    }

    if (config.requireLowercase && !/[a-z]/.test(value)) {
      return {
        valid: false,
        message: config.message || "Password must contain at least one lowercase letter"
      };
    }

    if (config.requireNumber && !/[0-9]/.test(value)) {
      return {
        valid: false,
        message: config.message || "Password must contain at least one number"
      };
    }

    if (config.requireSpecial && !specialCharRegex.test(value)) {
      return {
        valid: false,
        message: config.message || "Password must contain a special character"
      };
    }

    return { valid: true };
  };
}

/**
 * Validates a phone number using standard formats.
 * Supports domestic and international phone numbers (e.g. +1 555-555-5555, (555) 555-5555, +919876543210).
 * Rejects malformed parentheses, misplaced '+' symbols, and invalid character combinations.
 * 
 * Limitation Note:
 * Phone number validation checks format and character structure (7 to 15 digits, optional country code).
 * It does not verify whether the number is actively in service or assigned to a carrier.
 * 
 * @param {string} [customMessage] - Optional custom error message.
 * @returns {Function}
 */
function phone(customMessage) {
  return function (value) {
    if (value === undefined || value === null || value === "") {
      return { valid: true };
    }

    if (typeof value !== "string") {
      return {
        valid: false,
        message: customMessage || "Phone number must be a valid string"
      };
    }

    const trimmed = value.trim();

    // Check basic allowed characters only: digits, +, spaces, hyphens, dots, parentheses
    if (!/^[0-9+\s\-().]+$/.test(trimmed)) {
      return {
        valid: false,
        message: customMessage || "Please enter a valid phone number"
      };
    }

    // '+' is only allowed as the very first character
    if (trimmed.indexOf("+") > 0 || (trimmed.match(/\+/g) || []).length > 1) {
      return {
        valid: false,
        message: customMessage || "Please enter a valid phone number"
      };
    }

    // Must start with '+' or a digit or '('
    if (!/^[+0-9(]/.test(trimmed)) {
      return {
        valid: false,
        message: customMessage || "Please enter a valid phone number"
      };
    }

    // Must end with a digit
    if (!/[0-9]$/.test(trimmed)) {
      return {
        valid: false,
        message: customMessage || "Please enter a valid phone number"
      };
    }

    // Parentheses check: either no parentheses, or exactly one balanced pair containing digits
    const openParenCount = (trimmed.match(/\(/g) || []).length;
    const closeParenCount = (trimmed.match(/\)/g) || []).length;
    if (openParenCount !== closeParenCount || openParenCount > 1) {
      return {
        valid: false,
        message: customMessage || "Please enter a valid phone number"
      };
    }

    if (openParenCount === 1) {
      const openIdx = trimmed.indexOf("(");
      const closeIdx = trimmed.indexOf(")");
      // '(' must appear before ')', and inside must be 2 to 6 digits
      if (openIdx >= closeIdx) {
        return {
          valid: false,
          message: customMessage || "Please enter a valid phone number"
        };
      }
      const insideParen = trimmed.slice(openIdx + 1, closeIdx);
      if (!/^[0-9]{2,6}$/.test(insideParen)) {
        return {
          valid: false,
          message: customMessage || "Please enter a valid phone number"
        };
      }
    }

    // Reject consecutive separators (e.g. '--', '..', '.-', '-.')
    if (/[-.]{2,}/.test(trimmed)) {
      return {
        valid: false,
        message: customMessage || "Please enter a valid phone number"
      };
    }

    // Extract digits count (ITU-T E.164: 7 to 15 digits)
    const digitsOnly = trimmed.replace(/\D/g, "");
    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
      return {
        valid: false,
        message: customMessage || "Phone number must contain between 7 and 15 digits"
      };
    }

    return { valid: true };
  };
}

/**
 * Checks if a string or array has at least the minimum length.
 * 
 * @param {number} min - Minimum allowed length (must be a non-negative number).
 * @param {string} [customMessage] - Optional custom error message.
 * @returns {Function}
 */
function minLength(min, customMessage) {
  if (typeof min !== "number" || !Number.isFinite(min) || min < 0) {
    throw new TypeError("minLength rule requires a valid non-negative number");
  }

  return function (value) {
    if (value === undefined || value === null || value === "") {
      return { valid: true };
    }

    if (typeof value !== "string" && !Array.isArray(value)) {
      return {
        valid: false,
        message: customMessage || "Value must be a string or array"
      };
    }

    if (value.length < min) {
      return {
        valid: false,
        message: customMessage || `Must be at least ${min} characters long`
      };
    }

    return { valid: true };
  };
}

/**
 * Checks if a string or array does not exceed the maximum length.
 * 
 * @param {number} max - Maximum allowed length (must be a non-negative number).
 * @param {string} [customMessage] - Optional custom error message.
 * @returns {Function}
 */
function maxLength(max, customMessage) {
  if (typeof max !== "number" || !Number.isFinite(max) || max < 0) {
    throw new TypeError("maxLength rule requires a valid non-negative number");
  }

  return function (value) {
    if (value === undefined || value === null || value === "") {
      return { valid: true };
    }

    if (typeof value !== "string" && !Array.isArray(value)) {
      return {
        valid: false,
        message: customMessage || "Value must be a string or array"
      };
    }

    if (value.length > max) {
      return {
        valid: false,
        message: customMessage || `Must be at most ${max} characters long`
      };
    }

    return { valid: true };
  };
}

/**
 * Validates that a numeric value is at least the specified minimum.
 * Rejects whitespace-only strings, NaN, and Infinity.
 * 
 * @param {number} minValue - Minimum numerical value (must be a finite number).
 * @param {string} [customMessage] - Optional custom error message.
 * @returns {Function}
 */
function min(minValue, customMessage) {
  if (typeof minValue !== "number" || !Number.isFinite(minValue)) {
    throw new TypeError("min rule requires a valid finite number");
  }

  return function (value) {
    if (value === undefined || value === null || value === "") {
      return { valid: true };
    }

    // Handle whitespace-only strings: reject as invalid number rather than coercing to 0
    if (typeof value === "string" && value.trim() === "") {
      return {
        valid: false,
        message: customMessage || "Value must be a valid number"
      };
    }

    // Reject boolean, arrays, and objects which Number() coerces to numbers (e.g. Number(true) is 1, Number([]) is 0)
    if (typeof value === "boolean" || typeof value === "object") {
      return {
        valid: false,
        message: customMessage || "Value must be a valid number"
      };
    }

    const num = Number(value);
    // Reject NaN, Infinity, -Infinity
    if (!Number.isFinite(num)) {
      return {
        valid: false,
        message: customMessage || "Value must be a valid number"
      };
    }

    if (num < minValue) {
      return {
        valid: false,
        message: customMessage || `Value must be at least ${minValue}`
      };
    }

    return { valid: true };
  };
}

/**
 * Validates that a numeric value does not exceed the specified maximum.
 * Rejects whitespace-only strings, NaN, and Infinity.
 * 
 * @param {number} maxValue - Maximum numerical value (must be a finite number).
 * @param {string} [customMessage] - Optional custom error message.
 * @returns {Function}
 */
function max(maxValue, customMessage) {
  if (typeof maxValue !== "number" || !Number.isFinite(maxValue)) {
    throw new TypeError("max rule requires a valid finite number");
  }

  return function (value) {
    if (value === undefined || value === null || value === "") {
      return { valid: true };
    }

    // Handle whitespace-only strings: reject as invalid number rather than coercing to 0
    if (typeof value === "string" && value.trim() === "") {
      return {
        valid: false,
        message: customMessage || "Value must be a valid number"
      };
    }

    // Reject boolean, arrays, and objects
    if (typeof value === "boolean" || typeof value === "object") {
      return {
        valid: false,
        message: customMessage || "Value must be a valid number"
      };
    }

    const num = Number(value);
    // Reject NaN, Infinity, -Infinity
    if (!Number.isFinite(num)) {
      return {
        valid: false,
        message: customMessage || "Value must be a valid number"
      };
    }

    if (num > maxValue) {
      return {
        valid: false,
        message: customMessage || `Value must be at most ${maxValue}`
      };
    }

    return { valid: true };
  };
}

/**
 * Allows developers to define custom validation functions.
 * 
 * IMPORTANT:
 * Custom validation functions must be SYNCHRONOUS.
 * Async or Promise-returning functions are not supported; returning a Promise
 * will result in a validation error instead of being treated as truthy.
 * 
 * @param {Function} validatorFn - Synchronous function receiving value and returning boolean.
 * @param {string} [errorMessage] - Error message returned if validatorFn returns false or fails.
 * @returns {Function}
 */
function custom(validatorFn, errorMessage) {
  return function (value) {
    if (typeof validatorFn !== "function") {
      return {
        valid: false,
        message: "Custom rule validator must be a function"
      };
    }

    try {
      const result = validatorFn(value);

      // Detect Promise-returning validators (async functions)
      if (result && typeof result.then === "function") {
        return {
          valid: false,
          message: "Custom validator must be synchronous and cannot return a Promise"
        };
      }

      const isValid = Boolean(result);
      if (!isValid) {
        return {
          valid: false,
          message: errorMessage || "Field is invalid"
        };
      }
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        message: errorMessage || `Validation error: ${error.message}`
      };
    }
  };
}

module.exports = {
  required,
  email,
  password,
  phone,
  minLength,
  maxLength,
  min,
  max,
  custom
};
