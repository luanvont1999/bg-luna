import { Hono } from "hono";
import { cors } from "hono/cors";
import { handle } from "hono/vercel";
import dotenv from "dotenv";

import healthRouter from "./routes/health.routes.js";
import meetupRouter from "./routes/meetup.routes.js";
import notificationRouter from "./routes/notification.routes.js";

dotenv.config();

const app = new Hono();

// Enable CORS for all routes
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// Mount routes
app.route("/", healthRouter);
app.route("/", meetupRouter);
app.route("/", notificationRouter);

// Start the Node HTTP server on port 8080 only when running locally (outside Vercel).
// Dynamic import prevents @hono/node-server from being loaded on Vercel,
// where its native Node.js HTTP bindings can hang the serverless runtime.
if (!process.env.VERCEL) {
  import("@hono/node-server").then(({ serve }) => {
    const port = 8080;
    serve({
      fetch: app.fetch,
      port: port,
    });
    console.log(`Server Hono/Node.js MVC (Local) đang chạy tại http://localhost:${port}...`);
  });
}

// Vercel serverless function handler
export default handle(app);
