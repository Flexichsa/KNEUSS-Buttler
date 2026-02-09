import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Get current authenticated user - supports both Replit Auth and email/password login
  app.get("/api/auth/user", async (req: any, res) => {
    try {
      if (process.env.NODE_ENV !== 'production') {
        if (!req.isAuthenticated() || !req.user) {
          return res.json({
            id: 'dev-user',
            email: 'dev@localhost',
            firstName: 'Dev',
            lastName: 'User',
          });
        }
      }

      // Check if user is authenticated at all
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Try to get user ID from different auth methods
      let userId: string | undefined;
      
      // Replit Auth stores user ID in claims.sub
      if (req.user.claims?.sub) {
        userId = req.user.claims.sub;
      }
      // Email/password login stores user ID directly in user.id
      else if (req.user.id) {
        userId = req.user.id;
      }

      if (!userId) {
        return res.status(401).json({ message: "No user ID found" });
      }

      const user = await authStorage.getUser(userId);
      
      // If user not found in database but we have session data (email/password login)
      if (!user && req.user.id) {
        // Return the session user data directly
        return res.json({
          id: req.user.id,
          email: req.user.email,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
        });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}
