import connectToDatabase from "@/lib/mongoose";
import { UserModel, OwnerModel, PropertyModel } from "@/lib/models";

export interface AdminOwnerFilterOptions {
  search?: string;
  status?: string;
  portfolio?: string;
  page?: number;
  limit?: number;
}

export interface AdminOwnerDTO {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  initials: string;
  phone: string;
  avatar?: string;
  status: string;
  verificationStatus: string;
  createdAt?: string;
  since?: string;
  area?: string;
  totalProperties: number;
  publishedProperties: number;
  pendingReviewProperties: number;
  draftProperties: number;
  rejectedProperties: number;
}

export class AdminOwnerService {
  async getAdminOwners(options: AdminOwnerFilterOptions = {}) {
    await connectToDatabase();

    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(50, options.limit || 10));

    // 1. Fetch all users with OWNER role (case-insensitive for resilience)
    const rawUsers = await UserModel.find({
      role: { $in: ["OWNER", "owner"] },
    })
      .select("id email role status verificationStatus firstName lastName phone avatar createdAt")
      .lean()
      .exec();

    // 2. Fetch all OwnerModel profiles for supplementary info (since, area, etc.)
    const rawOwners = await OwnerModel.find({}).lean().exec();

    // Map owner profiles by userId and id
    const ownerProfileMap = new Map<string, any>();
    for (const o of rawOwners) {
      if (o.userId) ownerProfileMap.set(String(o.userId), o);
      if (o.id) ownerProfileMap.set(String(o.id), o);
    }

    // Combine distinct list of owner keys
    const userMap = new Map<string, any>();
    for (const u of rawUsers) {
      const uId = String(u.id || u._id);
      userMap.set(uId, u);
    }

    // 3. Aggregate Property counts by ownerId
    const propertyStats = await PropertyModel.aggregate([
      {
        $group: {
          _id: "$ownerId",
          totalProperties: { $sum: 1 },
          publishedProperties: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$status", "ARCHIVED"] },
                    { $or: [{ $eq: ["$status", "PUBLISHED"] }, { $eq: ["$isPublished", true] }] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          pendingReviewProperties: {
            $sum: {
              $cond: [
                { $in: ["$status", ["PENDING_REVIEW", "UNDER_REVIEW"]] },
                1,
                0,
              ],
            },
          },
          draftProperties: {
            $sum: {
              $cond: [{ $eq: ["$status", "DRAFT"] }, 1, 0],
            },
          },
          rejectedProperties: {
            $sum: {
              $cond: [{ $eq: ["$status", "REJECTED"] }, 1, 0],
            },
          },
        },
      },
    ]);

    // Build stats lookup map
    const statsMap = new Map<string, {
      totalProperties: number;
      publishedProperties: number;
      pendingReviewProperties: number;
      draftProperties: number;
      rejectedProperties: number;
    }>();

    for (const stat of propertyStats) {
      if (stat._id) {
        statsMap.set(String(stat._id), {
          totalProperties: stat.totalProperties || 0,
          publishedProperties: stat.publishedProperties || 0,
          pendingReviewProperties: stat.pendingReviewProperties || 0,
          draftProperties: stat.draftProperties || 0,
          rejectedProperties: stat.rejectedProperties || 0,
        });
      }
    }

    // Helper to sum stats for an owner across possible identifier keys (user.id, user._id, owner.id)
    const getStatsForUser = (userId: string, mongoId?: string, ownerId?: string) => {
      const keys = Array.from(new Set([userId, mongoId, ownerId].filter(Boolean) as string[]));
      let totalProperties = 0;
      let publishedProperties = 0;
      let pendingReviewProperties = 0;
      let draftProperties = 0;
      let rejectedProperties = 0;

      for (const k of keys) {
        const s = statsMap.get(k);
        if (s) {
          totalProperties += s.totalProperties;
          publishedProperties += s.publishedProperties;
          pendingReviewProperties += s.pendingReviewProperties;
          draftProperties += s.draftProperties;
          rejectedProperties += s.rejectedProperties;
        }
      }

      return {
        totalProperties,
        publishedProperties,
        pendingReviewProperties,
        draftProperties,
        rejectedProperties,
      };
    };

    // 4. Construct unified list of owners
    const allOwnersList: AdminOwnerDTO[] = [];

    userMap.forEach((user, key) => {
      const ownerProfile = ownerProfileMap.get(key) || ownerProfileMap.get(String(user._id));
      const stats = getStatsForUser(user.id, String(user._id), ownerProfile?.id);

      const fn = user.firstName || "";
      const ln = user.lastName || "";
      let fullName = [fn, ln].filter(Boolean).join(" ").trim();
      if (!fullName && ownerProfile?.name) {
        fullName = ownerProfile.name;
      }
      if (!fullName) {
        fullName = user.email.split("@")[0] || "Propriétaire";
      }

      const initials = fullName
        .split(" ")
        .filter(Boolean)
        .map((p: string) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "PR";

      allOwnersList.push({
        id: ownerProfile?.id || user.id || String(user._id),
        userId: user.id || String(user._id),
        email: user.email,
        firstName: fn,
        lastName: ln,
        fullName,
        initials,
        phone: user.phone || ownerProfile?.phone || "—",
        avatar: user.avatar,
        status: user.status || "ACTIVE",
        verificationStatus: user.verificationStatus || (ownerProfile?.isVerified ? "VERIFIED" : "UNVERIFIED"),
        createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : undefined,
        since: ownerProfile?.since || (user.createdAt ? new Date(user.createdAt).getFullYear().toString() : undefined),
        area: ownerProfile?.area || "Mahdia",
        totalProperties: stats.totalProperties,
        publishedProperties: stats.publishedProperties,
        pendingReviewProperties: stats.pendingReviewProperties,
        draftProperties: stats.draftProperties,
        rejectedProperties: stats.rejectedProperties,
      });
    });

    // Also catch any standalone OwnerModel entries without a matching UserModel (for legacy resilience)
    for (const ownerProfile of rawOwners) {
      const matchFound = allOwnersList.some(
        (o) => o.id === ownerProfile.id || o.userId === ownerProfile.userId || o.userId === ownerProfile.id
      );
      if (!matchFound && ownerProfile.id) {
        const stats = getStatsForUser(ownerProfile.id, ownerProfile.userId);
        const fullName = ownerProfile.name || "Propriétaire";
        const initials = fullName
          .split(" ")
          .filter(Boolean)
          .map((p: string) => p[0])
          .join("")
          .toUpperCase()
          .slice(0, 2) || "PR";

        allOwnersList.push({
          id: ownerProfile.id,
          userId: ownerProfile.userId || ownerProfile.id,
          email: ownerProfile.email || "—",
          firstName: fullName.split(" ")[0] || "",
          lastName: fullName.split(" ").slice(1).join(" ") || "",
          fullName,
          initials,
          phone: ownerProfile.phone || "—",
          status: "ACTIVE",
          verificationStatus: ownerProfile.isVerified ? "VERIFIED" : "UNVERIFIED",
          since: ownerProfile.since || new Date().getFullYear().toString(),
          area: ownerProfile.area || "Mahdia",
          totalProperties: stats.totalProperties,
          publishedProperties: stats.publishedProperties,
          pendingReviewProperties: stats.pendingReviewProperties,
          draftProperties: stats.draftProperties,
          rejectedProperties: stats.rejectedProperties,
        });
      }
    }

    // 5. Global Summary Metrics
    const totalOwners = allOwnersList.length;
    const publishedPropertiesTotal = allOwnersList.reduce((acc, o) => acc + o.publishedProperties, 0);
    const pendingVerificationCount = allOwnersList.filter(
      (o) => o.status === "PENDING" || o.verificationStatus === "PENDING"
    ).length;

    // 6. Apply Search Filtering
    let filtered = allOwnersList;
    if (options.search && options.search.trim()) {
      const q = options.search.trim().toLowerCase();
      filtered = filtered.filter((o) => {
        return (
          o.fullName.toLowerCase().includes(q) ||
          o.email.toLowerCase().includes(q) ||
          o.phone.toLowerCase().includes(q) ||
          (o.area && o.area.toLowerCase().includes(q))
        );
      });
    }

    // 7. Apply Status Filtering
    if (options.status && options.status !== "ALL") {
      filtered = filtered.filter((o) => o.status === options.status || o.verificationStatus === options.status);
    }

    // 8. Apply Portfolio Filtering
    if (options.portfolio && options.portfolio !== "ALL") {
      switch (options.portfolio) {
        case "WITH_PUBLISHED":
          filtered = filtered.filter((o) => o.publishedProperties > 0);
          break;
        case "WITH_PENDING":
          filtered = filtered.filter((o) => o.pendingReviewProperties > 0);
          break;
        case "NO_PUBLISHED":
          filtered = filtered.filter((o) => o.publishedProperties === 0);
          break;
        case "NO_PROPERTIES":
          filtered = filtered.filter((o) => o.totalProperties === 0);
          break;
      }
    }

    // Sort by createdAt / since descending
    filtered.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    const totalFiltered = filtered.length;
    const totalPages = Math.ceil(totalFiltered / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedOwners = filtered.slice(startIndex, startIndex + limit);

    return {
      owners: paginatedOwners,
      pagination: {
        page,
        limit,
        total: totalFiltered,
        totalPages,
      },
      metrics: {
        totalOwners,
        publishedProperties: publishedPropertiesTotal,
        pendingVerification: pendingVerificationCount,
      },
    };
  }
}

export const adminOwnerService = new AdminOwnerService();
