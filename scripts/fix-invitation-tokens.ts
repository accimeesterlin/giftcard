/**
 * Script to fix invitationToken duplicates
 */

import mongoose from "mongoose";

async function fixInvitationTokens() {
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

    // Count documents with null invitationToken
    const nullCount = await collection.countDocuments({ invitationToken: null });
    console.log(`\nFound ${nullCount} documents with invitationToken: null`);

    // Count documents with non-null invitationToken
    const nonNullCount = await collection.countDocuments({ invitationToken: { $ne: null } });
    console.log(`Found ${nonNullCount} documents with non-null invitationToken`);

    if (nullCount > 1) {
      console.log("\nMultiple documents have null invitationToken.");
      console.log("This is actually OK for a sparse index!");
      console.log("\nThe issue is that the index might not be marked as sparse.");
      console.log("Let's drop any existing invitationToken index and let Mongoose recreate it correctly.");

      // Try to drop the index if it exists
      try {
        const indexes = await collection.indexes();
        const hasInvitationTokenIndex = indexes.some(idx => idx.name === "invitationToken_1");

        if (hasInvitationTokenIndex) {
          console.log("\nDropping existing invitationToken_1 index...");
          await collection.dropIndex("invitationToken_1");
          console.log("✓ Index dropped");
        } else {
          console.log("\nNo invitationToken_1 index found");
        }
      } catch (error: any) {
        console.log("Note:", error.message);
      }
    }

    console.log("\n✓ Done! Now restart your server to let Mongoose create the correct sparse index.");

  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

fixInvitationTokens();
