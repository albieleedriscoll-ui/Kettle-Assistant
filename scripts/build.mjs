// Runs on Netlify every time the site is deployed (see netlify.toml).
// It reads every restaurant file in the venues folder and:
//   1. checks each one for mistakes, and stops the deploy with a plain message if it finds any;
//   2. writes venues/_index.mjs, the list the chat uses;
//   3. writes public/forms.html, which tells Netlify about each restaurant's enquiry form;
//   4. writes public/venues/<id>.json, the name, greeting and colours the chat page shows.
// If a deploy is stopped, the live site carries on running the previous version.

import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { checkVenue, publicView } from "../lib/venue.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const venuesDir = path.join(root, "venues");

const FORM_FIELDS = [
  "subject", "venue", "type", "urgent", "question", "summary", "name", "contact", "date", "size", "sent",
];

const files = (await readdir(venuesDir))
  .filter((f) => f.endsWith(".mjs") && !f.startsWith("_"))
  .sort();

if (files.length === 0) {
  console.error("\nSTOPPED: there are no restaurant files in the venues folder.\n");
  process.exit(1);
}

const venues = [];
const errors = [];

for (const file of files) {
  const id = file.slice(0, -4);
  let venue;
  try {
    venue = (await import(pathToFileURL(path.join(venuesDir, file)).href)).default;
  } catch (err) {
    errors.push(`venues/${file}: the file has a typing mistake and can't be read (${err.message})`);
    continue;
  }
  const problems = checkVenue(id, venue);
  for (const p of problems) errors.push(`venues/${file}: ${p}`);
  if (problems.length === 0) venues.push({ id, file, name: venue.name, view: publicView(id, venue) });
}

if (errors.length) {
  console.error("\nSTOPPED: fix these and upload again. The live site has not changed.\n");
  for (const e of errors) console.error("  - " + e);
  console.error("");
  process.exit(1);
}

const index =
  "// WRITTEN AUTOMATICALLY by scripts/build.mjs on every deploy. Don't edit this file.\n" +
  venues.map((v, i) => `import v${i} from "./${v.file}";`).join("\n") +
  "\n\nexport default {\n" +
  venues.map((v, i) => `  "${v.id}": v${i},`).join("\n") +
  "\n};\n";
await writeFile(path.join(venuesDir, "_index.mjs"), index);

const forms =
  "<!doctype html>\n<html lang=\"en\">\n<head><meta charset=\"utf-8\"><meta name=\"robots\" content=\"noindex\">" +
  "<title>Enquiry forms</title></head>\n<body>\n" +
  "<!-- WRITTEN AUTOMATICALLY by scripts/build.mjs. Netlify reads this page to learn about each enquiry form. -->\n" +
  venues
    .map(
      (v) =>
        `<form name="enquiry-${v.id}" method="POST" data-netlify="true" netlify-honeypot="bot-field" hidden>\n` +
        `  <input name="bot-field">\n` +
        FORM_FIELDS.map((f) => `  <input name="${f}">`).join("\n") +
        `\n</form>`
    )
    .join("\n") +
  "\n</body>\n</html>\n";
await writeFile(path.join(root, "public", "forms.html"), forms);

const publicVenues = path.join(root, "public", "venues");
await rm(publicVenues, { recursive: true, force: true });
await mkdir(publicVenues, { recursive: true });
for (const v of venues) {
  await writeFile(path.join(publicVenues, `${v.id}.json`), JSON.stringify(v.view, null, 2) + "\n");
}

console.log(`\nReady: ${venues.length} restaurant${venues.length === 1 ? "" : "s"}`);
for (const v of venues) console.log(`  - ${v.name}  (?venue=${v.id})  enquiry form: enquiry-${v.id}`);
console.log("");
