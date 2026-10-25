import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Verify your email",
  description: "Verify the email address associated with your Adlas account.",
  path: "/verify-email",
  index: false,
});

import { Suspense } from "react";
import VerifyEmailForm from "./verify-email-form";

type VerifyEmailPageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

async function VerifyEmailContent({
  searchParams,
}: VerifyEmailPageProps) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";

  return <VerifyEmailForm token={token} />;
}

export default function VerifyEmailPage(props: VerifyEmailPageProps) {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-lg px-6 py-16">
          <p role="status">Loading email verification...</p>
        </main>
      }
    >
      <VerifyEmailContent {...props} />
    </Suspense>
  );
}
