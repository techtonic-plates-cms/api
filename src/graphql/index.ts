import { buildSchema } from "drizzle-graphql";
import { db } from "../db";

export const { entities: dbEntities} = buildSchema(db);

