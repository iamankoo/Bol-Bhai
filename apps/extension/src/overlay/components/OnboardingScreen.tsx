import { memo, useCallback, type FormEvent } from "react";
import { useUsernameForm } from "../../core/hooks/useUsernameForm";
import { APP_CONFIG } from "../../core/config/appConfig";

type OnboardingScreenProps = {
  onComplete: (username: string) => Promise<void>;
};

export const OnboardingScreen = memo(function OnboardingScreen({
  onComplete
}: OnboardingScreenProps) {
  const { value, error, isSubmitting, isValid, setValue, submit } = useUsernameForm({
    onSubmit: onComplete
  });

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void submit();
    },
    [submit]
  );

  return (
    <form className="bol-bhai-panel" onSubmit={handleSubmit}>
      <header className="bol-bhai-popup-header">
        <h2 id="bol-bhai-popup-title">Welcome to {APP_CONFIG.name}</h2>
        <p>Choose your name</p>
      </header>

      <label className="bol-bhai-field">
        <span>Name</span>
        <input
          autoFocus
          className="bol-bhai-input"
          type="text"
          value={value}
          minLength={3}
          maxLength={20}
          inputMode="text"
          autoComplete="nickname"
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? "bol-bhai-name-error" : undefined}
          onChange={(event) => setValue(event.currentTarget.value)}
        />
      </label>

      {error ? (
        <p id="bol-bhai-name-error" className="bol-bhai-error" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        className="bol-bhai-popup-action bol-bhai-primary-action"
        disabled={!isValid || isSubmitting}
      >
        Continue
      </button>
    </form>
  );
});
