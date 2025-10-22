/**
 * Script to sync Mongoose indexes
 * This ensures all models have their indexes created correctly
 */

import mongoose from "mongoose";
import CompanyMembershipModel from "../src/lib/db/models/CompanyMembership";

async function syncIndexes() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    console.log("Connecting to MongoDB...");
    console.log("Database:", mongoUri);
    await mongoose.connect(mongoUri);
    console.log("✓ Connected to MongoDB");

    const db = mongoose.connection.db;
    const collection = db?.collection("companymemberships");

    if (collection) {
      // List current indexes
      console.log("\nCurrent indexes:");
      const indexes = await collection.indexes();
      indexes.forEach((index) => {
        console.log(`  - ${index.name}:`, JSON.stringify(index.key),
          index.unique ? "(unique)" : "",
          index.sparse ? "(sparse)" : "");
      });
    }

    // Sync indexes for CompanyMembership model
    console.log("\nSyncing CompanyMembership indexes...");
    await CompanyMembershipModel.syncIndexes();
    console.log("✓ Indexes synced successfully");

    if (collection) {
      // List indexes after sync
      console.log("\nIndexes after sync:");
      const indexesAfter = await collection.indexes();
      indexesAfter.forEach((index) => {
        console.log(`  - ${index.name}:`, JSON.stringify(index.key),
          index.unique ? "(unique)" : "",
          index.sparse ? "(sparse)" : "");
      });
    }

    console.log("\n✓ Done!");

  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

syncIndexes();
