import { generateDailyForAllActiveChildren } from "../src/services/generation";

async function main() {
  console.log("Starting daily generation…");
  const details = await generateDailyForAllActiveChildren("github_action");
  console.log(JSON.stringify(details, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
