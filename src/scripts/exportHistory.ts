import fs from "fs";
import { getRecentHistory } from "../src/db/history";

const records = getRecentHistory(1000);
const format = process.argv[2] || "json";

if (format === "json") {
  fs.writeFileSync("exports/history.json", JSON.stringify(records, null, 2));
} else if (format === "csv") {
  const csv = [Object.keys(records[0]).join(",")]
    .concat(records.map((r) => Object.values(r).join(",")))
    .join("\n");
  fs.writeFileSync("exports/history.csv", csv);
}
