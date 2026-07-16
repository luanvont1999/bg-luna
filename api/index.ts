// Vercel Serverless Function entrypoint
// All imports are lazy to avoid hanging during module initialization
import { Hono } from "hono";
import { cors } from "hono/cors";
import { handle } from "hono/vercel";

console.log("[api/index] Module loading started");

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

console.log("[api/index] Hono app created, importing routes...");

// Lazy-import routes to avoid module-level side effects from dependencies
// like jsonwebtoken (native crypto) that can hang Vercel's bundler/runtime
const routesReady = Promise.all([
  import("./routes/health.routes.js"),
  import("./routes/meetup.routes.js"),
  import("./routes/notification.routes.js"),
]).then(([health, meetup, notification]) => {
  app.route("/", health.default);
  app.route("/", meetup.default);
  app.route("/", notification.default);
  console.log("[api/index] All routes mounted successfully");
});

// Start the Node HTTP server only when running locally
if (!process.env.VERCEL) {
  routesReady.then(() => {
    import("@hono/node-server").then(({ serve }) => {
      const port = 8080;
      serve({ fetch: app.fetch, port });
      console.log(`Server Hono/Node.js MVC (Local) đang chạy tại http://localhost:${port}...`);
    });
  });
}

console.log("[api/index] Module loading completed (routes loading async)");

// Vercel serverless function handler
// Waits for routes to be ready before handling the first request
const handler = async (req: any, res: any) => {
  await routesReady;
  return handle(app)(req, res);
};

export default handler;
