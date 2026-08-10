import { generateLessonForAgeBand } from "../src/services/generation";
import { isAgeBandId } from "../src/lib/age-bands";

async function main() {
  const band = process.argv[2];
  if (!isAgeBandId(band)) {
    console.error("Usage: tsx scripts/regen-band.ts age_10_12");
    process.exit(1);
  }
  const r = await generateLessonForAgeBand(band, { force: true });
  if (r.skipped) {
    console.log("skipped", r.reason);
    return;
  }
  console.log(
    JSON.stringify(
      {
        band,
        application: r.lesson.content_json.gospel.real_life_application,
        resolution: r.lesson.content_json.evening_prayer.resolution,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
