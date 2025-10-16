/**
 * DEBUG ENDPOINT - Check inventory data
 * GET /api/debug/inventory?listingId=xxx
 */

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import Inventory from "@/lib/db/models/Inventory";
import Listing from "@/lib/db/models/Listing";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const listingId = request.nextUrl.searchParams.get("listingId");

    if (!listingId) {
      return NextResponse.json({ error: "listingId required" }, { status: 400 });
    }

    // Find listing by both _id and id
    const listingById = await Listing.findOne({ id: listingId });
    const listingByObjectId = await Listing.findById(listingId).catch(() => null);

    // Find inventory codes
    const codesByUuid = await Inventory.find({ listingId: listingId }).select("+code");
    const codesByObjectId = await Inventory.find({ listingId: listingById?._id?.toString() || "none" }).select("+code");

    return NextResponse.json({
      searchedListingId: listingId,
      listing: {
        foundByUuid: listingById ? {
          _id: listingById._id.toString(),
          id: listingById.id,
          title: listingById.title,
        } : null,
        foundByObjectId: listingByObjectId ? {
          _id: listingByObjectId._id.toString(),
          id: listingByObjectId.id,
          title: listingByObjectId.title,
        } : null,
      },
      codes: {
        foundWithUuid: codesByUuid.length,
        foundWithObjectId: codesByObjectId.length,
        sampleCodesByUuid: codesByUuid.slice(0, 2).map((c: any) => ({
          id: c.id,
          code: c.code?.substring(0, 4) + "...",
          listingId: c.listingId,
          denomination: c.denomination,
        })),
        sampleCodesByObjectId: codesByObjectId.slice(0, 2).map((c: any) => ({
          id: c.id,
          code: c.code?.substring(0, 4) + "...",
          listingId: c.listingId,
          denomination: c.denomination,
        })),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
