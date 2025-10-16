/**
 * Script to drop the old invitationToken_1 index and let Mongoose recreate it as sparse
 * Run this with: npm run drop-index
 */

import mongoose from "mongoose";

async function dropInvitationTokenIndex() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined in environment variables. Make sure .env.local exists.");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✓ Connected to MongoDB");

    const db = mongoose.connection.db;
    const collection = db?.collection("companymemberships");

    if (!collection) {
      throw new Error("Could not access companymemberships collection");
    }

    // List all indexes
    console.log("\nCurrent indexes on companymemberships:");
    const indexes = await collection.indexes();
    indexes.forEach((index) => {
      console.log(`- ${index.name}:`, JSON.stringify(index.key), index.unique ? "(unique)" : "", index.sparse ? "(sparse)" : "");
    });

    // Drop the problematic invitationToken_1 index
    console.log("\nDropping invitationToken_1 index...");
    try {
      await collection.dropIndex("invitationToken_1");
      console.log("✓ Successfully dropped invitationToken_1 index");
    } catch (error: any) {
      if (error.message.includes("index not found")) {
        console.log("ℹ Index invitationToken_1 not found (may have already been dropped)");
      } else {
        throw error;
      }
    }

    // List indexes after dropping
    console.log("\nIndexes after dropping:");
    const indexesAfter = await collection.indexes();
    indexesAfter.forEach((index) => {
      console.log(`- ${index.name}:`, JSON.stringify(index.key), index.unique ? "(unique)" : "", index.sparse ? "(sparse)" : "");
    });

    console.log("\n✓ Done! The correct sparse unique index will be created automatically by Mongoose.");
    console.log("  You may need to restart your dev server for changes to take effect.");

  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

dropInvitationTokenIndex();
