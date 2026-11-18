import path from "path";
import { importMieramTuvuEpubFromPath } from "../src/services/scriptureSource/import-epub";

async function main() {
  const fileArg = process.argv[2];
  if (!fileArg) {
    console.error(
      "Lietošana: npm run import:epub -- <ceļš-uz-failu.epub>\n" +
        "Piemērs: npm run import:epub -- content/mieramtuvu/2026-09.epub",
    );
    process.exit(1);
  }
  const filePath = path.resolve(fileArg);
  console.log(`Importē ${filePath}…`);
  const result = await importMieramTuvuEpubFromPath(filePath);
  console.log(
    JSON.stringify(
      {
        fileName: result.fileName,
        month: result.month,
        imported: result.imported,
        dates: result.dates,
        errors: result.errors,
      },
      null,
      2,
    ),
  );
  if (result.errors.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
