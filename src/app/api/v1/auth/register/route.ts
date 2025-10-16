/**
 * POST /api/v1/auth/register
 * User registration endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import { registerUserSchema } from "@/lib/validation/schemas";
import { UserService } from "@/lib/services/user.service";
import { CompanyService } from "@/lib/services/company.service";
import { toAppError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const input = registerUserSchema.parse(body);

    // Register user
    const user = await UserService.register(input);

    // If company name provided, create first company
    let company = null;
    if (input.companyName) {
      company = await CompanyService.create(user.id, {
        name: input.companyName,
        country: input.country || "US",
        currency: input.currency || "USD",
        timezone: input.timezone || "America/New_York",
      });
    }

    // Return user and company
    return NextResponse.json(
      {
        data: {
          user,
          company,
        },
        meta: {
          message: company
            ? "User and company created successfully"
            : "User created successfully",
        },
      },
      {
        status: 201,
        headers: {
          "X-API-Version": "v1",
        },
      }
    );
  } catch (error) {
    const appError = toAppError(error);

    return NextResponse.json(
      {
        error: appError.toJSON(),
      },
      {
        status: appError.statusCode,
        headers: {
          "X-API-Version": "v1",
        },
      }
    );
  }
}
