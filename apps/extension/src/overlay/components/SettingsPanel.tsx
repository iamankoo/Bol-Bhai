import { memo, useCallback, type FormEvent } from "react";
import { APP_CONFIG } from "../../core/config/appConfig";
import { useUsernameForm } from "../../core/hooks/useUsernameForm";
import { useExtensionUpdateInfo } from "../../core/hooks/useExtensionUpdateInfo";

const GITHUB_RELEASES_URL = "https://github.com/iamankoo/Bol-Bhai/releases";

type SettingsPanelProps = {
  username: string;
  onClose: () => void;
  onSaveUsername: (username: string) => Promise<void>;
  onResetOverlayPosition: () => Promise<void>;
};

export const SettingsPanel = memo(function SettingsPanel({
  username,
  onClose,
  onSaveUsername,
  onResetOverlayPosition
}: SettingsPanelProps) {
  const { value, error, isSubmitting, isValid, setValue, submit } = useUsernameForm({
    initialValue: username,
    onSubmit: onSaveUsername
  });

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void submit();
    },
    [submit]
  );

  const handleResetOverlayPosition = useCallback(() => {
    void onResetOverlayPosition();
  }, [onResetOverlayPosition]);

  const updateChannel = useExtensionUpdateInfo();

  return (
    <form className="bol-bhai-panel" onSubmit={handleSubmit}>
      <header className="bol-bhai-popup-header bol-bhai-settings-header">
        <h2 id="bol-bhai-popup-title">Settings</h2>
        <button
          type="button"
          className="bol-bhai-close-button"
          onClick={onClose}
          aria-label="Close settings"
        >
          Close
        </button>
      </header>

      <label className="bol-bhai-field">
        <span>Username</span>
        <input
          className="bol-bhai-input"
          type="text"
          value={value}
          minLength={3}
          maxLength={20}
          autoComplete="nickname"
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? "bol-bhai-settings-name-error" : undefined}
          onChange={(event) => setValue(event.currentTarget.value)}
        />
      </label>

      {error ? (
        <p id="bol-bhai-settings-name-error" className="bol-bhai-error" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        className="bol-bhai-popup-action bol-bhai-primary-action"
        disabled={!isValid || isSubmitting}
      >
        Save
      </button>

      <button type="button" className="bol-bhai-popup-action" onClick={handleResetOverlayPosition}>
        Reset Overlay Position
      </button>

      <section className="bol-bhai-about" aria-label="About Bol Bhai">
        <span>About</span>
        <strong>Version</strong>
        <span>{APP_CONFIG.version}</span>
        <strong>Updates</strong>
        {updateChannel === "store" ? (
          <span>Installed via the Chrome Web Store — updates automatically.</span>
        ) : updateChannel === "unpacked" ? (
          <span>
            Loaded unpacked (dev build) — Chrome only auto-updates Web Store installs, so check{" "}
            <a href={GITHUB_RELEASES_URL} target="_blank" rel="noreferrer">
              GitHub Releases
            </a>{" "}
            for new versions.
          </span>
        ) : (
          <span>Update status unavailable.</span>
        )}
      </section>
    </form>
  );
});
