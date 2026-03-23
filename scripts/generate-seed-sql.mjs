import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const databaseDir = path.join(root, "database");
const outputDir = path.join(root, "supabase", "seeds");
const outputFile = path.join(outputDir, "0000_loads_of_love_seed.sql");

const tables = [
  {
    source: "admins.json",
    table: "loads_of_love_admins",
    columns: ["id", "username", "password_hash", "email", "created_at"],
  },
  {
    source: "events.json",
    table: "loads_of_love_events",
    columns: [
      "id",
      "title",
      "description",
      "date",
      "location",
      "laundromat_name",
      "laundromat_address",
      "created_at",
      "updated_at",
    ],
  },
  {
    source: "time_slots.json",
    table: "loads_of_love_time_slots",
    columns: ["id", "event_id", "start_time", "end_time", "capacity", "created_at"],
  },
  {
    source: "registrations.json",
    table: "loads_of_love_registrations",
    columns: [
      "id",
      "event_id",
      "time_slot_id",
      "name",
      "email",
      "phone",
      "address",
      "city",
      "state",
      "zip_code",
      "status",
      "unique_cancel_token",
      "created_at",
      "updated_at",
    ],
  },
  {
    source: "blacklist.json",
    table: "loads_of_love_blacklist",
    columns: ["id", "name", "email", "phone", "reason", "created_at"],
  },
  {
    source: "email_reminders.json",
    table: "loads_of_love_email_reminders",
    columns: ["id", "registration_id", "reminder_type", "sent_at"],
  },
  {
    source: "recurring_event_tracking.json",
    table: "loads_of_love_recurring_event_tracking",
    columns: ["id", "event_type", "year_month", "event_id", "created_at"],
  },
];

function sqlValue(value) {
  if (value === null || value === undefined) {
    return "NULL";
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "TRUE" : "FALSE";
  }

  return `'${String(value).replace(/'/g, "''")}'`;
}

function buildInsertStatement(tableConfig) {
  const rows = JSON.parse(
    fs.readFileSync(path.join(databaseDir, tableConfig.source), "utf8"),
  );

  if (!rows.length) {
    return `-- ${tableConfig.table}: no rows in snapshot`;
  }

  const values = rows
    .map((row) => {
      const rowValues = tableConfig.columns.map((column) => sqlValue(row[column]));
      return `(${rowValues.join(", ")})`;
    })
    .join(",\n");

  return [
    `-- ${tableConfig.table}: ${rows.length} rows`,
    `INSERT INTO "${tableConfig.table}" (${tableConfig.columns.map((column) => `"${column}"`).join(", ")})`,
    `VALUES`,
    values,
    `ON CONFLICT ("id") DO NOTHING;`,
  ].join("\n");
}

const statements = [
  "-- Generated from database/*.json by scripts/generate-seed-sql.mjs",
  "BEGIN;",
  ...tables.map(buildInsertStatement),
  "COMMIT;",
  "",
];

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputFile, statements.join("\n\n"));

console.log(`Wrote ${outputFile}`);
