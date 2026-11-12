import { ensureSchema } from "../src/lib/db";

ensureSchema()
  .then(() => {
    console.log("Schema applied.");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
