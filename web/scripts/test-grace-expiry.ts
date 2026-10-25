import { expireGracePeriods } from "../src/lib/billing/expire-grace-periods";

async function main() {
  const result = await expireGracePeriods({ dryRun: true });

  console.log("Grace-period dry-run:", result);

  if (result.dryRun !== true) {
    throw new Error("Expected dry-run mode.");
  }

  if (result.suspended !== 0) {
    throw new Error("Dry-run must not suspend subscriptions.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
