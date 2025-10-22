/**
 * Final setup: Drop manual index and let Mongoose create it properly
 */

import mongoose from "mongoose";

async function finalSetup() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✓ Connected");

    const db = mongoose.connection.db;
    const collection = db?.collection("companymemberships");

    if (!collection) {
      throw new Error("Collection not found");
    }

    // Drop the manually created index
    console.log("\nDropping manually created index...");
    try {
      await collection.dropIndex("invitationToken_1_sparse");
      console.log("✓ Dropped invitationToken_1_sparse");
    } catch (error: any) {
      console.log("Note:", error.message);
    }

    // Now let Mongoose create the standard one
    console.log("\nNow Mongoose will create the correct index on next server start.");
    console.log("Please restart your dev server.");

  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected");
  }
}

finalSetup();
