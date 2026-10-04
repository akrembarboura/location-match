export function mapUserToPublicDTO(userDoc: any) {
  return {
    id: userDoc.id || userDoc._id.toString(),
    firstName: userDoc.firstName,
    lastName: userDoc.lastName,
    avatar: userDoc.avatar,
  };
}

export function mapUserToPrivateDTO(userDoc: any) {
  return {
    id: userDoc.id || userDoc._id.toString(),
    email: userDoc.email,
    role: userDoc.role,
    firstName: userDoc.firstName,
    lastName: userDoc.lastName,
    phone: userDoc.phone,
    avatar: userDoc.avatar,
  };
}
