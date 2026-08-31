import { beforeEach, describe, expect, test } from "bun:test";
import { useSettingsDialog } from "./use-settings-dialog";

describe("useSettingsDialog", () => {
  beforeEach(() => {
    useSettingsDialog.setState({ isOpen: false });
  });

  test("starts closed", () => {
    expect(useSettingsDialog.getState().isOpen).toBe(false);
  });

  test("open() sets isOpen true", () => {
    useSettingsDialog.getState().open();
    expect(useSettingsDialog.getState().isOpen).toBe(true);
  });

  test("close() sets isOpen false", () => {
    useSettingsDialog.getState().open();
    useSettingsDialog.getState().close();
    expect(useSettingsDialog.getState().isOpen).toBe(false);
  });
});
