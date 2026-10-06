export function mapUserToPublicDTO(userDoc: any) {
  return {
    id: userDoc.id || userDoc._id.toString(),
    firstName: userDoc.firstName,
    lastName: userDoc.lastName,
    avatar: userDoc.avatar,
  };
}

export function mapUserToPrivateDTO(userDoc: any) {
  const rawRole = typeof userDoc.role === "string" ? userDoc.role.toUpperCase() : "CUSTOMER";
  const role = ["CUSTOMER", "OWNER", "ADMIN", "SUPER_ADMIN"].includes(rawRole) ? rawRole : "CUSTOMER";

  return {
    id: userDoc.id || userDoc._id.toString(),
    email: userDoc.email,
    role,
    status: userDoc.status || "ACTIVE",
    firstName: userDoc.firstName,
    lastName: userDoc.lastName,
    phone: userDoc.phone,
    avatar: userDoc.avatar,
  };
}
