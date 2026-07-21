import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface FirebaseUser {
  uid: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture: string;
}

let cachedKeys: Record<string, string> = {};
let cacheExpiration = 0;

async function getGooglePublicKeys(): Promise<Record<string, string>> {
  const now = Date.now();
  if (Object.keys(cachedKeys).length > 0 && now < cacheExpiration) {
    return cachedKeys;
  }

  console.log("[Auth] Fetching fresh public certificates from Google...");
  const res = await fetch(
    "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch Google public keys: ${res.status}`);
  }

  cachedKeys = (await res.json()) as Record<string, string>;
  cacheExpiration = now + 30 * 60 * 1000; // Cache for 30 minutes
  return cachedKeys;
}

export async function verifyToken(tokenString: string): Promise<FirebaseUser> {
  const projectID = process.env.FIREBASE_PROJECT_ID || "boardgame-hub-demo";

  // Decode JWT header to extract key ID (kid)
  const decodedHeader = jwt.decode(tokenString, { complete: true });
  if (!decodedHeader || typeof decodedHeader === "string" || !decodedHeader.header.kid) {
    throw new Error("Invalid token format or missing kid header");
  }

  const kid = decodedHeader.header.kid;
  const keys = await getGooglePublicKeys();
  const certPEM = keys[kid];
  if (!certPEM) {
    throw new Error(`Public key not found for kid: ${kid}`);
  }

  return new Promise<FirebaseUser>((resolve, reject) => {
    jwt.verify(
      tokenString,
      certPEM,
      {
        algorithms: ["RS256"],
        audience: projectID === "boardgame-hub-demo" ? undefined : projectID,
        issuer:
          projectID === "boardgame-hub-demo"
            ? undefined
            : `https://securetoken.google.com/${projectID}`,
      },
      (err, decoded: any) => {
        if (err) return reject(err);
        if (!decoded || !decoded.sub) return reject(new Error("Token subject (uid) is empty"));

        resolve({
          uid: decoded.sub,
          email: decoded.email || "",
          email_verified: decoded.email_verified || false,
          name: decoded.name || "",
          picture: decoded.picture || "",
        });
      }
    );
  });
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: "Authorization header missing" });
    return;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    res.status(401).json({ error: "Authorization header format must be Bearer <token>" });
    return;
  }

  const tokenString = parts[1];
  try {
    const user = await verifyToken(tokenString);
    (req as any).firebase_user = user;
    next();
  } catch (err: any) {
    console.error("[Auth] Auth failed:", err);
    res.status(401).json({
      error: "Unauthorized",
      details: err.message,
    });
  }
}
