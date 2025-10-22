/**
 * Script to manually create the sparse unique index for invitationToken
 */

import mongoose from "mongoose";

async function createSparseIndex() {
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

    // Check existing documents
    console.log("\nChecking documents...");
    const docs = await collection.find({}).project({ id: 1, invitationToken: 1 }).toArray();
    console.log(`Total documents: ${docs.length}`);

    const withNull = docs.filter(d => d.invitationToken === null);
    const withUndefined = docs.filter(d => d.invitationToken === undefined);
    const withValue = docs.filter(d => d.invitationToken !== null && d.invitationToken !== undefined);

    console.log(`- With null: ${withNull.length}`);
    console.log(`- With undefined/missing: ${withUndefined.length}`);
    console.log(`- With value: ${withValue.length}`);

    // Check if any non-null values are duplicated
    const tokenCounts = new Map<string, number>();
    docs.forEach(d => {
      if (d.invitationToken && d.invitationToken !== null) {
        const count = tokenCounts.get(d.invitationToken) || 0;
        tokenCounts.set(d.invitationToken, count + 1);
      }
    });

    const duplicates = Array.from(tokenCounts.entries()).filter(([_, count]) => count > 1);
    if (duplicates.length > 0) {
      console.log("\nFound duplicate non-null invitationTokens:");
      duplicates.forEach(([token, count]) => {
        console.log(`  - ${token}: ${count} times`);
      });
    }

    // Try creating the index with different options
    console.log("\nAttempting to create sparse unique index...");
    try {
      await collection.createIndex(
        { invitationToken: 1 },
        {
          unique: true,
          sparse: true,
          name: "invitationToken_1_sparse"
        }
      );
      console.log("✓ Index created successfully!");
    } catch (error: any) {
      console.log("✗ Failed to create index");
      console.log("Error:", error.message);

      // Try a workaround: unset null values to make them undefined
      console.log("\nTrying workaround: Converting null values to undefined...");
      const result = await collection.updateMany(
        { invitationToken: null },
        { $unset: { invitationToken: "" } }
      );
      console.log(`✓ Updated ${result.modifiedCount} documents`);

      console.log("\nRetrying index creation...");
      await collection.createIndex(
        { invitationToken: 1 },
        {
          unique: true,
          sparse: true,
          name: "invitationToken_1_sparse"
        }
      );
      console.log("✓ Index created successfully!");
    }

    // List all indexes
    console.log("\nCurrent indexes:");
    const indexes = await collection.indexes();
    indexes.forEach((index) => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key),
        index.unique ? "(unique)" : "",
        index.sparse ? "(sparse)" : "");
    });

  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected");
  }
}

createSparseIndex();
