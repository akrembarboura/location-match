import { config } from "dotenv";
config({ path: ".env.local" });

import connectToDatabase from "./src/lib/mongoose.ts";
import {
  HouseModel,
  CategoryModel,
  DestinationModel,
  PropertyModel,
  OwnerModel,
  HousingRequestModel,
  DealModel,
} from "./src/lib/models.ts";

// Import data from the two mock sources
import { mockHouses, mockCategories, mockDestinations } from "./src/lib/rentals/mock.ts";
import {
  properties as adminProperties,
  owners,
  requests,
  deals,
} from "./src/lib/mock-data.ts";

async function seed() {
  try {
    console.log("Connecting to database...");
    await connectToDatabase();
    console.log("Connected. Clearing old data...");

    await HouseModel.deleteMany({});
    await CategoryModel.deleteMany({});
    await DestinationModel.deleteMany({});
    await PropertyModel.deleteMany({});
    await OwnerModel.deleteMany({});
    await HousingRequestModel.deleteMany({});
    await DealModel.deleteMany({});

    console.log("Old data cleared. Seeding new data...");

    // Seed Rentals domain
    await HouseModel.insertMany(mockHouses);
    console.log(`Seeded ${mockHouses.length} houses.`);

    await CategoryModel.insertMany(mockCategories);
    console.log(`Seeded ${mockCategories.length} categories.`);

    await DestinationModel.insertMany(mockDestinations);
    console.log(`Seeded ${mockDestinations.length} destinations.`);

    // Seed Admin/Owner domain
    await PropertyModel.insertMany(adminProperties);
    console.log(`Seeded ${adminProperties.length} admin properties.`);

    await OwnerModel.insertMany(owners);
    console.log(`Seeded ${owners.length} owners.`);

    await HousingRequestModel.insertMany(requests);
    console.log(`Seeded ${requests.length} requests.`);

    await DealModel.insertMany(deals);
    console.log(`Seeded ${deals.length} deals.`);

    console.log("Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seed();
