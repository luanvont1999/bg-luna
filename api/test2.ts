import { Hono } from "hono";
import { handle } from "hono/vercel";

const app = new Hono();

app.get("/api/test2", (c) => {
  return c.json({ ok: true, source: "hono", time: new Date().toISOString() });
});

export default handle(app);
