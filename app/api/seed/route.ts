import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import {
  HouseModel,
  CategoryModel,
  DestinationModel,
  PropertyModel,
  OwnerModel,
  HousingRequestModel,
  DealModel,
} from "@/lib/models";
import { RateLimitModel } from "@/server/rate-limit/mongo-store";

import { mockHouses, mockCategories, mockDestinations } from "@/lib/rentals/mock";
import {
  properties as adminProperties,
  owners,
  requests,
  deals,
} from "@/lib/mock-data";

export async function GET(req: Request) {
  try {
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "Seed route only available in development" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    if (searchParams.get("token") !== "DEV_TOKEN") {
      return NextResponse.json({ error: "Unauthorized seed attempt" }, { status: 401 });
    }

    await connectToDatabase();

    await HouseModel.deleteMany({});
    await CategoryModel.deleteMany({});
    await DestinationModel.deleteMany({});
    await PropertyModel.deleteMany({});
    await OwnerModel.deleteMany({});
    await HousingRequestModel.deleteMany({});
    await DealModel.deleteMany({});
    await RateLimitModel.deleteMany({});

    await HouseModel.insertMany(mockHouses);
    await CategoryModel.insertMany(mockCategories);
    await DestinationModel.insertMany(mockDestinations);
    await PropertyModel.insertMany(adminProperties);
    await OwnerModel.insertMany(owners);
    await HousingRequestModel.insertMany(requests);
    await DealModel.insertMany(deals);

    return NextResponse.json({ success: true, message: "Database seeded successfully!" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
