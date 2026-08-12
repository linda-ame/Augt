import { generateLessonsForAllAgeBands } from "../src/services/generation";

/** Ensure gospel listen audio exists for all age bands (uses existing lesson text). */
async function main() {
  const force = process.argv.includes("--force");
  console.log(
    `Ensuring age-band lessons + gospel audio${force ? " (force regenerate text)" : ""}…`,
  );
  const details = await generateLessonsForAllAgeBands({ force });
  console.log(JSON.stringify(details, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
