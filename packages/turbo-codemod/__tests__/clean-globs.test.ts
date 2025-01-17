import { transformer, fixGlobPattern } from "../src/transforms/clean-globs";
import { setupTestFixtures } from "@turbo/test-utils";
import getTransformerHelpers from "../src/utils/getTransformerHelpers";

describe("clean-globs", () => {
  const { useFixture } = setupTestFixtures({
    directory: __dirname,
    test: "clean-globs",
  });

  test("basic", () => {
    // load the fixture for the test
    const { root, read, readJson } = useFixture({
      fixture: "clean-globs",
    });

    // run the transformer
    const result = transformer({
      root,
      options: { force: false, dry: false, print: false },
    });

    // result should be correct
    expect(result.fatalError).toBeUndefined();
    expect(result.changes).toMatchInlineSnapshot(`
      Object {
        "turbo.json": Object {
          "action": "modified",
          "additions": 6,
          "deletions": 6,
        },
      }
    `);
  });

  const { log } = getTransformerHelpers({
    transformer: "test",
    rootPath: ".",
    options: { force: false, dry: false, print: false },
  });

  test("collapses back-to-back doublestars", () => {
    let badGlobPatterns = [
      ["../../app-store/**/**", "../../app-store/**"],
      ["**/**/result.json", "**/result.json"],
      ["**/**/**/**", "**"],
      ["**/foo/**/**/bar/**", "**/foo/**/bar/**"],
      ["**/foo/**/**/**/bar/**/**", "**/foo/**/bar/**"],
      ["**/foo/**/**/**/**/bar/**/**/**", "**/foo/**/bar/**"],
    ];

    // Now let's test the function
    badGlobPatterns.forEach(([input, output]) => {
      expect(fixGlobPattern(input, log)).toBe(output);
    });
  });

  test("doesn't update valid globs and prints a message", () => {
    // Now let's test the function
    expect(fixGlobPattern("a/b/c/*", log)).toBe("a/b/c/*");
  });

  test("transforms '**ext' to '**/*ext'", () => {
    let badGlobPatterns = [
      ["cypress/integration/**.test.ts", "cypress/integration/**/*.test.ts"],
      ["scripts/**.mjs", "scripts/**/*.mjs"],
      ["scripts/**.js", "scripts/**/*.js"],
      ["src/types/generated/**.ts", "src/types/generated/**/*.ts"],
      ["**md", "**/*md"],
      ["**txt", "**/*txt"],
      ["**html", "**/*html"],
    ];

    // Now let's test the function
    badGlobPatterns.forEach(([input, output]) => {
      expect(fixGlobPattern(input, log)).toBe(output);
    });
  });

  test("transforms 'pre**' to pre*/**", () => {
    let badGlobPatterns = [
      ["pre**", "pre*/**"],
      ["pre**/foo", "pre*/**/foo"],
      ["pre**/foo/bar", "pre*/**/foo/bar"],
      ["pre**/foo/bar/baz", "pre*/**/foo/bar/baz"],
      ["pre**/foo/bar/baz/qux", "pre*/**/foo/bar/baz/qux"],
    ];

    // Now let's test the function
    badGlobPatterns.forEach(([input, output]) => {
      expect(fixGlobPattern(input, log)).toBe(output);
    });
  });

  it("should collapse back-to-back doublestars to a single doublestar", () => {
    expect(fixGlobPattern("../../app-store/**/**", log)).toBe(
      "../../app-store/**"
    );
    expect(fixGlobPattern("**/**/result.json", log)).toBe("**/result.json");
  });

  it("should change **.ext to **/*.ext", () => {
    expect(fixGlobPattern("**.js", log)).toBe("**/*.js");
    expect(fixGlobPattern("**.json", log)).toBe("**/*.json");
    expect(fixGlobPattern("**.ext", log)).toBe("**/*.ext");
  });

  it("should change prefix** to prefix*/**", () => {
    expect(fixGlobPattern("app**", log)).toBe("app*/**");
    expect(fixGlobPattern("src**", log)).toBe("src*/**");
    expect(fixGlobPattern("prefix**", log)).toBe("prefix*/**");
  });

  it("should collapse back-to-back doublestars and change **.ext to **/*.ext", () => {
    expect(fixGlobPattern("../../app-store/**/**/*.js", log)).toBe(
      "../../app-store/**/*.js"
    );
    expect(fixGlobPattern("**/**/result.json", log)).toBe("**/result.json");
  });

  it("should collapse back-to-back doublestars and change prefix** to prefix*/**", () => {
    expect(fixGlobPattern("../../app-store/**/**prefix**", log)).toBe(
      "../../app-store/**/*prefix*/**"
    );
    expect(fixGlobPattern("**/**/prefix**", log)).toBe("**/prefix*/**");
  });

  it("should not modify valid glob patterns", () => {
    expect(fixGlobPattern("src/**/*.js", log)).toBe("src/**/*.js");
    expect(fixGlobPattern("src/**/test/*.js", log)).toBe("src/**/test/*.js");
    expect(fixGlobPattern("src/**/test/**/*.js", log)).toBe(
      "src/**/test/**/*.js"
    );
    expect(fixGlobPattern("src/**/test/**/result.json", log)).toBe(
      "src/**/test/**/result.json"
    );
  });

  it("should handle glob patterns with non-ASCII characters", () => {
    expect(fixGlobPattern("src/日本語/**/*.js", log)).toBe(
      "src/日本語/**/*.js"
    );
    expect(fixGlobPattern("src/中文/**/*.json", log)).toBe(
      "src/中文/**/*.json"
    );
    expect(fixGlobPattern("src/русский/**/*.ts", log)).toBe(
      "src/русский/**/*.ts"
    );
  });
  it("should handle glob patterns with emojis", () => {
    expect(fixGlobPattern("src/👋**/*.js", log)).toBe("src/👋*/**/*.js");
    expect(fixGlobPattern("src/🌎**/*.json", log)).toBe("src/🌎*/**/*.json");
    expect(fixGlobPattern("src/🚀**/*.ts", log)).toBe("src/🚀*/**/*.ts");
  });
});
