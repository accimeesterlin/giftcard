/**
 * Admin endpoint to drop the old invitationToken_1 index
 * This is a one-time fix for the duplicate key error
 *
 * Usage: Just navigate to http://localhost:3001/api/admin/drop-index in your browser
 */

import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      );
    }

    const collection = db.collection("companymemberships");

    // List current indexes
    const indexesBefore = await collection.indexes();
    console.log("Current indexes:", indexesBefore);

    const indexNames = indexesBefore.map(idx => idx.name);
    const hasProblematicIndex = indexNames.includes("invitationToken_1");

    if (!hasProblematicIndex) {
      return NextResponse.json({
        message: "Index invitationToken_1 not found. It may have already been dropped.",
        indexes: indexesBefore.map(idx => ({
          name: idx.name,
          key: idx.key,
          unique: idx.unique || false,
          sparse: idx.sparse || false,
        })),
      });
    }

    // Drop the problematic index
    await collection.dropIndex("invitationToken_1");
    console.log("✓ Dropped invitationToken_1 index");

    // List indexes after dropping
    const indexesAfter = await collection.indexes();

    return NextResponse.json({
      message: "Successfully dropped invitationToken_1 index",
      indexesBefore: indexesBefore.map(idx => ({
        name: idx.name,
        key: idx.key,
        unique: idx.unique || false,
        sparse: idx.sparse || false,
      })),
      indexesAfter: indexesAfter.map(idx => ({
        name: idx.name,
        key: idx.key,
        unique: idx.unique || false,
        sparse: idx.sparse || false,
      })),
      note: "The correct sparse unique index will be created automatically by Mongoose on next operation.",
    });

  } catch (error) {
    console.error("Error dropping index:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
