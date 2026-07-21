import { describe, it, expect } from "vitest";
import {
  Provider,
  isKizunaManagedProvider,
  kizunaBaseProvider,
  isPantarheiManagedProvider,
  pantarheiBaseProvider,
} from "./Provider";

describe("kizuna-managed provider helpers", () => {
  it("identifies the two relay-managed providers", () => {
    expect(isKizunaManagedProvider(Provider.KIZUNA_AI_OPENAI_TRANSLATE)).toBe(true);
    expect(isKizunaManagedProvider(Provider.KIZUNA_AI_VOLCENGINE_AST2)).toBe(true);
    expect(isKizunaManagedProvider(Provider.OPENAI_TRANSLATE)).toBe(false);
  });
  it("maps each to its base provider", () => {
    expect(kizunaBaseProvider(Provider.KIZUNA_AI_OPENAI_TRANSLATE)).toBe(Provider.OPENAI_TRANSLATE);
    expect(kizunaBaseProvider(Provider.KIZUNA_AI_VOLCENGINE_AST2)).toBe(Provider.VOLCENGINE_AST2);
    expect(kizunaBaseProvider(Provider.OPENAI)).toBeUndefined();
  });
});

describe("pantarhei-managed provider helpers", () => {
  it("identifies the pantarhei relay-managed provider", () => {
    expect(isPantarheiManagedProvider(Provider.PANTARHEI_GEMINI)).toBe(true);
    expect(isPantarheiManagedProvider(Provider.GEMINI)).toBe(false);
  });
  it("maps it to its base provider", () => {
    expect(pantarheiBaseProvider(Provider.PANTARHEI_GEMINI)).toBe(Provider.GEMINI);
    expect(pantarheiBaseProvider(Provider.OPENAI)).toBeUndefined();
  });
});
