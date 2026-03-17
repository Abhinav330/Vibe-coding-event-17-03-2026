import { describe, expect, test } from "bun:test";
import { greet } from "../src/index";
import { add, capitalize } from "../src/lib/example";

describe("greet", () => {
  test("returns a greeting with the given name", () => {
    expect(greet("World")).toBe("Hello, World!");
    expect(greet("Bun")).toBe("Hello, Bun!");
  });
});

describe("add", () => {
  test("adds two numbers", () => {
    expect(add(1, 2)).toBe(3);
    expect(add(-1, 1)).toBe(0);
  });
});

describe("capitalize", () => {
  test("capitalizes first character and lowercases the rest", () => {
    expect(capitalize("hello")).toBe("Hello");
    expect(capitalize("HELLO")).toBe("Hello");
  });

  test("returns empty string for empty input", () => {
    expect(capitalize("")).toBe("");
  });
});
