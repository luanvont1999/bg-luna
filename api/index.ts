import express from "express";
import cors from "cors";

import healthRouter from "./_routes/health.routes.js";
import meetupRouter from "./_routes/meetup.routes.js";
import notificationRouter from "./_routes/notification.routes.js";
import authRouter from "./_routes/auth.routes.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Mount routes
app.use(healthRouter);
app.use(meetupRouter);
app.use(notificationRouter);
app.use(authRouter);

// Start the Node HTTP server only when running locally (outside Vercel)
if (!process.env.VERCEL) {
  const port = 8080;
  app.listen(port, () => {
    console.log(`Server Express MVC (Local) đang chạy tại http://localhost:${port}...`);
  });
}

// Vercel serverless function handler
export default app;
