/**
 * ValidateKit - Automated Test Suite
 * 
 * Uses Node.js built-in test runner (`node:test`) and assert library (`node:assert`).
 * Run with: npm test
 */

const { test, describe } = require("node:test");
const assert = require("node:assert");
const { validate, rules } = require("./index.js");

describe("ValidateKit Test Suite", () => {

  describe("Required Rule", () => {
    const schema = { name: [rules.required("Name is required")] };

    test("should reject missing, null, undefined, and empty string", () => {
      assert.strictEqual(validate({}, schema).valid, false);
      assert.strictEqual(validate({ name: undefined }, schema).valid, false);
      assert.strictEqual(validate({ name: null }, schema).valid, false);
      assert.strictEqual(validate({ name: "" }, schema).valid, false);
      assert.strictEqual(validate({ name: "   " }, schema).valid, false);

      const res = validate({ name: "" }, schema);
      assert.deepStrictEqual(res.errors.name, ["Name is required"]);
    });

    test("should accept non-empty values", () => {
      assert.strictEqual(validate({ name: "Taranveer" }, schema).valid, true);
      assert.strictEqual(validate({ name: 0 }, schema).valid, true);
      assert.strictEqual(validate({ name: false }, schema).valid, true);
    });
  });

  describe("Email Rule", () => {
    const schema = { email: [rules.required(), rules.email()] };

    test("should accept valid email addresses", () => {
      assert.strictEqual(validate({ email: "user@example.com" }, schema).valid, true);
      assert.strictEqual(validate({ email: "john.doe+test@domain.co.uk" }, schema).valid, true);
    });

    test("should reject invalid email formats", () => {
      const invalidEmails = ["plainaddress", "missing@domain", "@missinguser.com", "user@.com", "user@domain..com"];
      for (const email of invalidEmails) {
        const res = validate({ email }, schema);
        assert.strictEqual(res.valid, false, `Expected ${email} to be invalid`);
        assert.ok(res.errors.email.length > 0);
      }
    });

    test("should allow empty email if not marked required", () => {
      const optionalSchema = { email: [rules.email()] };
      assert.strictEqual(validate({ email: "" }, optionalSchema).valid, true);
      assert.strictEqual(validate({}, optionalSchema).valid, true);
    });
  });

  describe("Password Rule", () => {
    const defaultSchema = { password: [rules.required(), rules.password()] };

    test("should accept valid password meeting all default requirements", () => {
      const res = validate({ password: "SecurePass123!" }, defaultSchema);
      assert.strictEqual(res.valid, true);
      assert.deepStrictEqual(res.errors, {});
    });

    test("should reject password that is too short", () => {
      const res = validate({ password: "Pass1!" }, defaultSchema);
      assert.strictEqual(res.valid, false);
      assert.ok(res.errors.password.some(msg => msg.includes("at least 8 characters")));
    });

    test("should reject password missing uppercase letter", () => {
      const res = validate({ password: "securepass123!" }, defaultSchema);
      assert.strictEqual(res.valid, false);
      assert.ok(res.errors.password.some(msg => msg.includes("uppercase")));
    });

    test("should reject password missing lowercase letter", () => {
      const res = validate({ password: "SECUREPASS123!" }, defaultSchema);
      assert.strictEqual(res.valid, false);
      assert.ok(res.errors.password.some(msg => msg.includes("lowercase")));
    });

    test("should reject password missing number", () => {
      const res = validate({ password: "SecurePassword!" }, defaultSchema);
      assert.strictEqual(res.valid, false);
      assert.ok(res.errors.password.some(msg => msg.includes("number")));
    });

    test("should reject password missing special character", () => {
      const res = validate({ password: "SecurePassword123" }, defaultSchema);
      assert.strictEqual(res.valid, false);
      assert.ok(res.errors.password.some(msg => msg.includes("special character")));
    });

    test("should support custom configuration options", () => {
      const customSchema = {
        password: [
          rules.password({
            minLength: 4,
            requireUppercase: false,
            requireSpecial: false
          })
        ]
      };
      assert.strictEqual(validate({ password: "test1" }, customSchema).valid, true);
      assert.strictEqual(validate({ password: "abc" }, customSchema).valid, false);
    });

    test("should handle invalid password configuration safely", () => {
      // options is null
      const nullOptsSchema = { password: [rules.password(null)] };
      assert.strictEqual(validate({ password: "SecurePass123!" }, nullOptsSchema).valid, true);
      assert.strictEqual(validate({ password: "short" }, nullOptsSchema).valid, false);

      // options is primitive
      const primOptsSchema = { password: [rules.password("not-an-object")] };
      assert.strictEqual(validate({ password: "SecurePass123!" }, primOptsSchema).valid, true);

      // options contains negative or invalid minLength
      const negLengthSchema = { password: [rules.password({ minLength: -5 })] };
      assert.strictEqual(validate({ password: "SecurePass123!" }, negLengthSchema).valid, true);
      assert.strictEqual(validate({ password: "weak" }, negLengthSchema).valid, false);

      const nanLengthSchema = { password: [rules.password({ minLength: NaN })] };
      assert.strictEqual(validate({ password: "SecurePass123!" }, nanLengthSchema).valid, true);
    });
  });

  describe("Phone Rule", () => {
    const schema = { phone: [rules.required(), rules.phone()] };

    test("should accept valid international and domestic phone numbers", () => {
      const validNumbers = [
        "+1 555-555-5555",
        "+1 (555) 555-5555",
        "+91 9876543210",
        "(555) 555-5555",
        "555-555-5555",
        "+44 20 7946 0991",
        "9876543210"
      ];
      for (const number of validNumbers) {
        assert.strictEqual(validate({ phone: number }, schema).valid, true, `Expected ${number} to be valid`);
      }
    });

    test("should reject invalid phone numbers", () => {
      const invalidNumbers = [
        "123",              // Too short
        "abc-def-ghij",      // Letters
        "123456789012345678" // Too many digits (>15)
      ];
      for (const number of invalidNumbers) {
        const res = validate({ phone: number }, schema);
        assert.strictEqual(res.valid, false, `Expected ${number} to be invalid`);
      }
    });

    test("should reject malformed parentheses and invalid character combinations", () => {
      const malformedNumbers = [
        "(555-555-5555",      // Unclosed open parenthesis
        ")555(5555555",       // Inverted parentheses
        "555) 555-5555",      // Stray closing parenthesis
        "555((555))5555",     // Double parentheses
        "555--555--5555",     // Consecutive hyphens
        "555..555..5555",     // Consecutive dots
        "-5555555555",        // Leading hyphen
        "5555555555-",        // Trailing hyphen
        "1+5555555555",       // '+' not at the beginning
        "+1++5555555555",     // Multiple '+' characters
        "(5) 5555555",        // Too few digits in parenthesis
        "()"                  // Empty parentheses
      ];
      for (const num of malformedNumbers) {
        const res = validate({ phone: num }, schema);
        assert.strictEqual(res.valid, false, `Expected malformed phone '${num}' to be rejected`);
      }
    });
  });

  describe("String Length Rules (minLength & maxLength)", () => {
    const schema = {
      bio: [rules.minLength(5), rules.maxLength(10)]
    };

    test("should validate minimum string length", () => {
      assert.strictEqual(validate({ bio: "Hello" }, schema).valid, true);
      const shortRes = validate({ bio: "Hi" }, schema);
      assert.strictEqual(shortRes.valid, false);
      assert.ok(shortRes.errors.bio.some(msg => msg.includes("at least 5")));
    });

    test("should validate maximum string length", () => {
      assert.strictEqual(validate({ bio: "1234567890" }, schema).valid, true);
      const longRes = validate({ bio: "12345678901" }, schema);
      assert.strictEqual(longRes.valid, false);
      assert.ok(longRes.errors.bio.some(msg => msg.includes("at most 10")));
    });

    test("should reject negative or non-numeric minLength and maxLength configuration values", () => {
      assert.throws(() => rules.minLength(-1), TypeError);
      assert.throws(() => rules.minLength("5"), TypeError);
      assert.throws(() => rules.minLength(NaN), TypeError);
      assert.throws(() => rules.minLength(Infinity), TypeError);

      assert.throws(() => rules.maxLength(-1), TypeError);
      assert.throws(() => rules.maxLength("10"), TypeError);
      assert.throws(() => rules.maxLength(NaN), TypeError);
      assert.throws(() => rules.maxLength(Infinity), TypeError);
    });
  });

  describe("Numeric Rules (min & max)", () => {
    const schema = {
      age: [rules.required(), rules.min(18), rules.max(65)]
    };

    test("should accept valid numeric values within range", () => {
      assert.strictEqual(validate({ age: 18 }, schema).valid, true);
      assert.strictEqual(validate({ age: 30 }, schema).valid, true);
      assert.strictEqual(validate({ age: "45" }, schema).valid, true); // numeric string
      assert.strictEqual(validate({ age: 65 }, schema).valid, true);
    });

    test("should reject numbers below minimum or above maximum", () => {
      const tooYoung = validate({ age: 17 }, schema);
      assert.strictEqual(tooYoung.valid, false);
      assert.ok(tooYoung.errors.age.some(msg => msg.includes("at least 18")));

      const tooOld = validate({ age: 66 }, schema);
      assert.strictEqual(tooOld.valid, false);
      assert.ok(tooOld.errors.age.some(msg => msg.includes("at most 65")));
    });

    test("should reject non-numeric values", () => {
      const notNum = validate({ age: "twenty" }, schema);
      assert.strictEqual(notNum.valid, false);
      assert.ok(notNum.errors.age.some(msg => msg.includes("valid number")));
    });

    test("should reject whitespace-only strings consistently", () => {
      const res = validate({ age: "   " }, schema);
      assert.strictEqual(res.valid, false);
      assert.ok(res.errors.age.length > 0);
    });

    test("should reject NaN, Infinity, and -Infinity values", () => {
      assert.strictEqual(validate({ age: NaN }, schema).valid, false);
      assert.strictEqual(validate({ age: Infinity }, schema).valid, false);
      assert.strictEqual(validate({ age: -Infinity }, schema).valid, false);
      assert.strictEqual(validate({ age: "Infinity" }, schema).valid, false);
    });

    test("should validate min and max configuration values", () => {
      assert.throws(() => rules.min("invalid"), TypeError);
      assert.throws(() => rules.min(NaN), TypeError);
      assert.throws(() => rules.min(Infinity), TypeError);
      assert.throws(() => rules.min(-Infinity), TypeError);
      assert.throws(() => rules.min(null), TypeError);

      assert.throws(() => rules.max("invalid"), TypeError);
      assert.throws(() => rules.max(NaN), TypeError);
      assert.throws(() => rules.max(Infinity), TypeError);
      assert.throws(() => rules.max(-Infinity), TypeError);
      assert.throws(() => rules.max(undefined), TypeError);
    });
  });

  describe("Custom Validation Rule", () => {
    test("should support user-provided custom validation functions", () => {
      const schema = {
        role: [
          rules.required(),
          rules.custom(
            val => typeof val === "string" && val.includes("admin"),
            "Role must include admin"
          )
        ]
      };

      assert.strictEqual(validate({ role: "super-admin" }, schema).valid, true);

      const failRes = validate({ role: "user" }, schema);
      assert.strictEqual(failRes.valid, false);
      assert.deepStrictEqual(failRes.errors.role, ["Role must include admin"]);
    });

    test("should safely catch runtime exceptions in custom validator", () => {
      const schema = {
        tag: [
          rules.custom(val => {
            return val.toUpperCase() === "TECH";
          }, "Tag must be TECH")
        ]
      };

      const res = validate({ tag: null }, schema);
      assert.strictEqual(res.valid, false);
      assert.ok(res.errors.tag.length > 0);
    });

    test("should detect Promise-returning validators and return a validation error", () => {
      const asyncSchema = {
        asyncField: [
          rules.custom(async (val) => {
            return val === "test";
          }, "Field validation failed")
        ]
      };

      const res = validate({ asyncField: "test" }, asyncSchema);
      assert.strictEqual(res.valid, false);
      assert.ok(res.errors.asyncField[0].includes("synchronous and cannot return a Promise"));
    });
  });

  describe("Multiple Errors & Object Validation", () => {
    const userSchema = {
      name: [rules.required(), rules.minLength(3)],
      email: [rules.required(), rules.email()],
      password: [rules.required(), rules.password()],
      age: [rules.required(), rules.min(18)]
    };

    test("should validate a completely successful object", () => {
      const data = {
        name: "Taranveer",
        email: "test@gmail.com",
        password: "Hello123!",
        age: 20
      };

      const result = validate(data, userSchema);
      assert.strictEqual(result.valid, true);
      assert.deepStrictEqual(result.errors, {});
    });

    test("should collect multiple errors across multiple fields without stopping at first", () => {
      const data = {
        name: "T",          // Fails minLength(3)
        email: "bad-email", // Fails email()
        password: "short",  // Fails length, uppercase, number, special char
        age: 12             // Fails min(18)
      };

      const result = validate(data, userSchema);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.name);
      assert.ok(result.errors.email);
      assert.ok(result.errors.password);
      assert.ok(result.errors.age);
    });
  });

  describe("Invalid Schema & Edge Cases Handling", () => {
    test("should handle null or non-object schema without crashing", () => {
      const res1 = validate({ a: 1 }, null);
      assert.strictEqual(res1.valid, false);
      assert.ok(res1.errors._schema);

      const res2 = validate({ a: 1 }, "not-a-schema");
      assert.strictEqual(res2.valid, false);
      assert.ok(res2.errors._schema);
    });

    test("should handle non-array field rules gracefully", () => {
      const brokenSchema = { name: "invalid-rule-format" };
      const res = validate({ name: "test" }, brokenSchema);
      assert.strictEqual(res.valid, false);
      assert.ok(res.errors.name[0].includes("must be an array"));
    });

    test("should handle non-function rule items gracefully", () => {
      const brokenRuleSchema = { name: [12345] };
      const res = validate({ name: "test" }, brokenRuleSchema);
      assert.strictEqual(res.valid, false);
      assert.ok(res.errors.name[0].includes("must be a function"));
    });

    test("should handle missing data input (null or undefined) gracefully", () => {
      const schema = { name: [rules.required()] };
      const resNull = validate(null, schema);
      assert.strictEqual(resNull.valid, false);
      assert.ok(resNull.errors.name);

      const resUndef = validate(undefined, schema);
      assert.strictEqual(resUndef.valid, false);
      assert.ok(resUndef.errors.name);
    });

    test("should handle malformed rule return values safely", () => {
      const badReturnSchema = {
        name: [() => null, () => false, () => "not-an-object"]
      };
      const res = validate({ name: "test" }, badReturnSchema);
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.errors.name.length, 3);
      assert.ok(res.errors.name.every(msg => msg.includes("invalid result format")));
    });

    test("should safely handle primitive data inputs", () => {
      const schema = { name: [rules.required()] };
      assert.strictEqual(validate("primitive-string", schema).valid, false);
      assert.strictEqual(validate(12345, schema).valid, false);
      assert.strictEqual(validate(true, schema).valid, false);
    });
  });

});
