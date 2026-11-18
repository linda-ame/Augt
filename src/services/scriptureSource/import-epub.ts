import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { createServiceClient } from "@/lib/supabase/admin";
import {
  epubContentDir,
  parseMieramTuvuEpub,
} from "@/services/scriptureSource/mieramtuvu-epub";

export type ImportEpubResult = {
  fileName: string;
  month: string;
  imported: number;
  dates: string[];
  errors: Array<{ date: string; error: string }>;
};

/**
 * Parse EPUB, save under content/mieramtuvu/YYYY-MM.epub, upsert daily_readings.
 */
export async function importMieramTuvuEpub(options: {
  buffer: Buffer;
  originalName?: string;
  /** Also write/copy into content/mieramtuvu (local / deploy artifact). */
  persistFile?: boolean;
}): Promise<ImportEpubResult> {
  const originalName = options.originalName || "mieramtuvu.epub";
  const days = await parseMieramTuvuEpub(options.buffer, originalName);
  const month = days[0]!.date.slice(0, 7);
  const fileName = `${month}.epub`;

  if (options.persistFile !== false) {
    const dir = epubContentDir();
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, fileName), options.buffer);
  }

  const admin = createServiceClient();
  const errors: Array<{ date: string; error: string }> = [];
  const dates: string[] = [];

  for (const day of days) {
    const { error } = await admin.from("daily_readings").upsert(
      {
        reading_date: day.date,
        liturgical_day: day.liturgicalDay ?? null,
        daily_quote: day.dailyQuote ?? null,
        source_url: `epub:${fileName}#${day.date}`,
        readings: day.readings,
        source_text: day.sourceText,
        retrieved_at: new Date().toISOString(),
      },
      { onConflict: "reading_date" },
    );
    if (error) {
      errors.push({ date: day.date, error: error.message });
    } else {
      dates.push(day.date);
    }
  }

  return {
    fileName,
    month,
    imported: dates.length,
    dates,
    errors,
  };
}

/** Copy an on-disk EPUB into the content folder and import. */
export async function importMieramTuvuEpubFromPath(
  filePath: string,
): Promise<ImportEpubResult> {
  const { readFile } = await import("fs/promises");
  const buffer = await readFile(filePath);
  const dir = epubContentDir();
  await mkdir(dir, { recursive: true });
  // Parse first to learn YYYY-MM, then persist with canonical name via importMieramTuvuEpub
  return importMieramTuvuEpub({
    buffer,
    originalName: path.basename(filePath),
    persistFile: true,
  });
}
