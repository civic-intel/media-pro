
import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./submit-button.module.css";

type SubmitButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> & {
  children: ReactNode;
  loading?: boolean;
  loadingLabel?: string;
};

export default function SubmitButton({
  children,
  type = "submit",
  loading = false,
  loadingLabel = "Please wait...",
  disabled,
  className,
  ...buttonProps
}: SubmitButtonProps) {
  return (
    <button
      {...buttonProps}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={[styles.button, className].filter(Boolean).join(" ")}
    >
      {loading ? loadingLabel : children}
    </button>
  );
}
