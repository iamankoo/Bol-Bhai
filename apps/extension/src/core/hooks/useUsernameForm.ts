import { useCallback, useMemo, useState } from "react";
import { usernameSchema } from "../storage/schemas";

type UseUsernameFormOptions = {
  initialValue?: string;
  onSubmit: (username: string) => Promise<void>;
};

type UseUsernameFormResult = {
  value: string;
  error: string | null;
  isSubmitting: boolean;
  isValid: boolean;
  setValue: (value: string) => void;
  submit: () => Promise<void>;
};

export function useUsernameForm({
  initialValue = "",
  onSubmit
}: UseUsernameFormOptions): UseUsernameFormResult {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validationResult = useMemo(() => usernameSchema.safeParse(value), [value]);
  const isValid = validationResult.success;

  const handleValueChange = useCallback((nextValue: string) => {
    setValue(nextValue);
    setError(null);
  }, []);

  const submit = useCallback(async () => {
    const result = usernameSchema.safeParse(value);

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Enter a valid name.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(result.data);
      setValue(result.data);
      setError(null);
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit, value]);

  return {
    value,
    error,
    isSubmitting,
    isValid,
    setValue: handleValueChange,
    submit
  };
}
