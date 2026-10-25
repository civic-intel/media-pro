
import { useRef, type ReactNode } from "react";
import styles from "./auth.module.css";

type FormFeedbackProps = {
  type: "error" | "success";
  children: ReactNode;
};

export default function FormFeedback({
  type,
  children,
}: FormFeedbackProps) {

  const feedbackRef = useRef<HTMLDivElement>(null);

  return (
    <p
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
      className={
        type === "error"
          ? styles.feedbackError
          : styles.feedbackSuccess
      }
    >
      {children}
    </p>
  );
}
