import { pgGenerate } from "drizzle-dbml-generator";
import * as schema from "../src/db/schema";

const out = "../../docs/db/schema.dbml";
const relational = true;
pgGenerate({ schema, out, relational });
console.log("✅ Created the schema.dbml file");
console.log("⏳ Creating the erd.svg file");
