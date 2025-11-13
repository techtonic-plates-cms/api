import { drizzle } from 'drizzle-orm/node-postgres';


export const db = drizzle(Deno.env.get("DATABASE_URL")!, {
    casing: 'snake_case'
});