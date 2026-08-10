import { generateLessonsForAllAgeBands } from "../src/services/generation";

async function main() {
  const force = process.argv.includes("--force");
  console.log(`Generating age-band lessons${force ? " (force)" : ""}…`);
  const details = await generateLessonsForAllAgeBands({ force });
  console.log(JSON.stringify(details, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
