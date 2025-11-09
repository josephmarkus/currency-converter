import fs from "fs/promises";

const schema = await fs.readFile("cloudflare/schema.sql", "utf-8");
const cleaned = schema
  .split("\n")
  .filter((line) => !line.trim().startsWith("--"))
  .join("\n");
const statements = cleaned
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

console.log("Total statements:", statements.length);
statements.forEach((s, i) => {
  const firstLine = s.split("\n")[0];
  console.log(`${i + 1}. ${firstLine}`);
});
