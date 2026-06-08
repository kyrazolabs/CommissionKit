import { describe, test, expect } from "bun:test";
import { jsonpathGet } from "./jsonpath";

describe("jsonpathGet", () => {
  test("returns undefined for empty path", () => {
    expect(jsonpathGet({}, "")).toBeUndefined();
  });

  test("returns undefined for null/undefined object", () => {
    expect(jsonpathGet(null, "foo")).toBeUndefined();
    expect(jsonpathGet(undefined, "foo")).toBeUndefined();
  });

  test("top-level property access", () => {
    expect(jsonpathGet({ name: "Alice" }, "name")).toBe("Alice");
    expect(jsonpathGet({ age: 30 }, "age")).toBe(30);
  });

  test("nested dot notation", () => {
    const obj = { user: { profile: { name: "Bob" } } };
    expect(jsonpathGet(obj, "user.profile.name")).toBe("Bob");
  });

  test("array index notation", () => {
    const obj = { items: ["a", "b", "c"] };
    expect(jsonpathGet(obj, "items[0]")).toBe("a");
    expect(jsonpathGet(obj, "items[2]")).toBe("c");
  });

  test("nested object with array index", () => {
    const obj = { data: { users: [{ name: "Alice" }, { name: "Bob" }] } };
    expect(jsonpathGet(obj, "data.users[0].name")).toBe("Alice");
    expect(jsonpathGet(obj, "data.users[1].name")).toBe("Bob");
  });

  test("returns undefined for missing path", () => {
    expect(jsonpathGet({ a: { b: "c" } }, "a.x.z")).toBeUndefined();
  });

  test("returns undefined for null intermediate value", () => {
    expect(jsonpathGet({ a: null }, "a.b")).toBeUndefined();
  });

  test("returns undefined for out of bounds array index", () => {
    expect(jsonpathGet({ items: [1, 2] }, "items[5]")).toBeUndefined();
  });

  test("returns undefined when intermediate is not an array for index access", () => {
    expect(jsonpathGet({ items: { notArray: true } }, "items[0]")).toBeUndefined();
  });

  test("boolean false values are returned", () => {
    expect(jsonpathGet({ active: false }, "active")).toBe(false);
  });

  test("numeric zero is returned", () => {
    expect(jsonpathGet({ count: 0 }, "count")).toBe(0);
  });
});
