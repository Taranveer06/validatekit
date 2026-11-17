# ValidateKit

A lightweight, zero-dependency JavaScript validation library for validating user inputs, registration forms, API request payloads, and general JavaScript objects.

Designed to be simple, predictable, and easy to understand without any complex abstractions or external dependencies.

---

## Features

- **Zero Runtime Dependencies**: Uses 100% pure modern JavaScript and Node.js built-ins.
- **Framework Independent**: Works seamlessly with Express, Fastify, Vanilla Node.js, or client-side JavaScript.
- **Collects All Errors**: Evaluates all fields and rules completely without halting on the first error.
- **Configurable Built-in Rules**: Includes essential validators for emails, passwords, phone numbers, lengths, numeric ranges, and required fields.
- **Robust Numeric Handling**: Safely rejects `NaN`, `Infinity`, and whitespace-only strings.
- **Extensible Custom Rules**: Easily create your own validation logic using synchronous `rules.custom()`.
- **Defensive & Safe**: Built-in protection against invalid schemas, missing data, malformed rules, and runtime crashes.
- **Tested**: Comprehensive test suite using Node.js built-in `node:test` runner.

---

## Installation

Install via npm:

```bash
npm install @taranveer_singh/validatekit
```

---

## Quick Start

```javascript
const { validate, rules } = require("@taranveer_singh/validatekit");

// 1. Define your validation schema
const userSchema = {
  name: [
    rules.required("Name is required"),
    rules.minLength(3, "Name must be at least 3 characters")
  ],
  email: [
    rules.required("Email is required"),
    rules.email("Please provide a valid email address")
  ],
  password: [
    rules.required("Password is required"),
    rules.password() // Default: 8+ chars, uppercase, lowercase, number, special char
  ],
  age: [
    rules.required("Age is required"),
    rules.min(18, "You must be at least 18 years old")
  ]
};

// 2. Validate input data
const result = validate({
  name: "Taranveer",
  email: "test@gmail.com",
  password: "Hello123!",
  age: 20
}, userSchema);

console.log(result);
```

### Result Format

If valid:
```json
{
  "valid": true,
  "errors": {}
}
```

If invalid:
```json
{
  "valid": false,
  "errors": {
    "password": [
      "Password must contain a special character"
    ]
  }
}
```

---

## Available Validation Rules

### `rules.required(customMessage)`
Ensures a value is provided. Rejects `undefined`, `null`, and empty or whitespace-only strings (`""`, `"   "`).

```javascript
rules.required("Username is required")
```

---

### `rules.email(customMessage)`
Validates that the input matches standard email syntax (`name@domain.tld`). Rejects consecutive dots, missing domain/TLD, or whitespace.

> **Note**: If a field is optional, omit `rules.required()`. Empty strings or undefined values will pass `rules.email()`.

```javascript
rules.email("Invalid email address")
```

---

### `rules.password(options)`
Validates password complexity. By default, requires at least 8 characters, an uppercase letter, a lowercase letter, a digit, and a special character. Safely handles missing, non-object, or invalid options.

```javascript
// Default options
rules.password()

// Customized options
rules.password({
  minLength: 10,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false, // Turn off special character requirement
  message: "Password does not meet our security policy"
})
```

> **Security Disclaimer**: This rule checks password complexity and formatting. It does not replace server-side password hashing (e.g. bcrypt, argon2) or guarantee password security against breach databases.

---

### `rules.phone(customMessage)`
Validates international and domestic phone numbers containing 7 to 15 digits (ITU-T E.164 standard).
Supports formats such as:
- `+1 555-555-5555`
- `+1 (555) 555-5555`
- `+91 9876543210`
- `(555) 555-5555`
- `555-555-5555`
- `9876543210`

Strictly rejects malformed parentheses (e.g. unmatched `(555-555-5555`, inverted `)555(5555555`), misplaced `+` symbols, consecutive separators (`--`, `..`), and non-numeric characters.

> **Limitation**: Phone validation verifies structural format and digit count. It does not verify carrier assignment, line activity, or SMS deliverability.

```javascript
rules.phone("Please enter a valid phone number")
```

---

### `rules.minLength(min, customMessage)` & `rules.maxLength(max, customMessage)`
Checks whether a string or array satisfies length boundaries. Configuration arguments must be valid, non-negative finite numbers.

```javascript
rules.minLength(5, "Must be at least 5 characters long")
rules.maxLength(50, "Must not exceed 50 characters")
```

---

### `rules.min(minValue, customMessage)` & `rules.max(maxValue, customMessage)`
Validates numeric boundaries. Works on numbers and numeric strings (e.g. `"25"`).
- Rejects non-numbers, booleans, whitespace-only strings (`"   "`), `NaN`, `Infinity`, and `-Infinity`.
- Configuration arguments `minValue` and `maxValue` must be valid finite numbers.

```javascript
rules.min(18, "Must be at least 18")
rules.max(100, "Must be 100 or less")
```

---

### `rules.custom(validatorFunction, errorMessage)`
Allows you to create custom validation logic without modifying the package.

The `validatorFunction` receives the value and must return `true` if valid, or `false` if invalid.

> **IMPORTANT**: Custom validation functions must be **synchronous**. Returning a `Promise` (or `async` function) is not supported and will automatically fail validation.

```javascript
const schema = {
  username: [
    rules.required(),
    rules.custom(
      value => typeof value === "string" && value.includes("admin"),
      "Value must contain admin"
    )
  ]
};
```

---

## Express.js Integration Example

ValidateKit works cleanly as request validation middleware:

```javascript
const express = require("express");
const { validate, rules } = require("@taranveer_singh/validatekit");

const app = express();
app.use(express.json());

// Registration Schema
const registrationSchema = {
  username: [rules.required(), rules.minLength(3)],
  email: [rules.required(), rules.email()],
  password: [rules.required(), rules.password()],
  age: [rules.required(), rules.min(18)]
};

app.post("/api/register", (req, res) => {
  const result = validate(req.body, registrationSchema);

  if (!result.valid) {
    return res.status(400).json({
      status: "fail",
      errors: result.errors
    });
  }

  // Input is valid: proceed to hash password and save user
  res.status(201).json({
    status: "success",
    message: "User registered successfully!"
  });
});

app.listen(3000, () => console.log("Server running on port 3000"));
```

---

## Running Tests

Run the built-in test runner:

```bash
npm test
```

---

## License

MIT © [Taranveer Singh](LICENSE)
