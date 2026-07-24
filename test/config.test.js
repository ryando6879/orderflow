import { describe, it, expect, afterEach } from "vitest";
import { intFromEnv, boolFromEnv, strFromEnv, load } from "../src/config/index.js";

const TOUCHED = ["OF_TEST_INT", "OF_TEST_BOOL", "OF_TEST_STR", "PORT"];

afterEach(() => {
  TOUCHED.forEach((name) => delete process.env[name]);
});

describe("intFromEnv", () => {
  it("uses the default when the variable is unset", () => {
    expect(intFromEnv("OF_TEST_INT", 42)).toBe(42);
  });

  it("reads a configured value", () => {
    process.env.OF_TEST_INT = "8080";
    expect(intFromEnv("OF_TEST_INT", 42)).toBe(8080);
  });

  it("falls back when the value is not a number", () => {
    process.env.OF_TEST_INT = "banana";
    expect(intFromEnv("OF_TEST_INT", 42)).toBe(42);
  });
});

describe("boolFromEnv", () => {
  it("reads the truthy spellings", () => {
    for (const value of ["1", "true", "TRUE", "yes", "on"]) {
      process.env.OF_TEST_BOOL = value;
      expect(boolFromEnv("OF_TEST_BOOL")).toBe(true);
    }
  });

  it("reads the falsy spellings", () => {
    for (const value of ["0", "false", "no", "off"]) {
      process.env.OF_TEST_BOOL = value;
      expect(boolFromEnv("OF_TEST_BOOL")).toBe(false);
    }
  });

  it("uses the default when unset or empty", () => {
    expect(boolFromEnv("OF_TEST_BOOL", true)).toBe(true);
    process.env.OF_TEST_BOOL = "";
    expect(boolFromEnv("OF_TEST_BOOL", true)).toBe(true);
  });
});

describe("strFromEnv", () => {
  it("reads a value and falls back on an empty one", () => {
    process.env.OF_TEST_STR = "hello";
    expect(strFromEnv("OF_TEST_STR", "bye")).toBe("hello");
    process.env.OF_TEST_STR = "";
    expect(strFromEnv("OF_TEST_STR", "bye")).toBe("bye");
  });
});

describe("load", () => {
  it("builds a whole config tree", () => {
    const config = load();
    expect(config.port).toBeTypeOf("number");
    expect(config.payments.baseUrl).toBeTypeOf("string");
    expect(config.jobs.dunningMaxAttempts).toBeGreaterThan(0);
  });

  it("honours a configured port", () => {
    process.env.PORT = "4321";
    expect(load().port).toBe(4321);
  });
});
