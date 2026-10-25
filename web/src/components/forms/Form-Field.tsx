
import type { InputHTMLAttributes, ReactNode } from "react";
import styles from "./auth.module.css";

type FormFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "id" | "aria-describedby"
> & {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  action?: ReactNode;
  describedBy?: string;
};

export default function FormField({
  id,
  label,
  hint,
  error,
  action,
  describedBy,
  ...inputProps
}: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  const descriptionIds = [
    describedBy,
    hintId,
    errorId,
  ].filter(Boolean).join(" ") || undefined;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>

      <input
        {...inputProps}
        id={id}
        className={styles.input}
        aria-invalid={error ? true : undefined}
        aria-describedby={descriptionIds}
      />

      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} className={styles.fieldError}>
          {error}
        </p>
      )}

      {action && <div className={styles.fieldAction}>{action}</div>}
    </div>
  );
}
