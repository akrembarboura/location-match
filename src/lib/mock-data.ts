const prop1 = "https://res.cloudinary.com/kyiccgx3/image/upload/v1790889822/location-match/prop-1.jpg";
const prop2 = "https://res.cloudinary.com/kyiccgx3/image/upload/v1790889823/location-match/prop-2.jpg";
const prop3 = "https://res.cloudinary.com/kyiccgx3/image/upload/v1790889824/location-match/prop-3.jpg";

export const AREAS = [
  "Hiboun",
  "Zone Touristique",
  "Mahdia Ville",
  "Baghdedi",
  "Rejiche",
  "Chiba",
  "Près FSEG",
] as const;

export const PROPERTY_TYPES = ["Studio", "S+1", "S+2", "S+3", "Villa", "Chambre"] as const;

export const SUMMER_AMENITIES = [
  "Climatisation",
  "Wi-Fi",
  "Parking",
  "Vue mer",
  "Près de la plage",
  "Machine à laver",
  "Balcon",
  "Piscine",
];

export const STUDENT_PREFERENCES = [
  "Meublé",
  "Wi-Fi",
  "Climatisation",
  "Près de l'université",
  "Calme",
  "Machine à laver",
];

export const UNIVERSITIES = ["FSEG", "ISI", "ISET", "ISAM", "ISSAT", "Autre"];

export type Property = {
  id: string;
  title: string;
  type: string;
  area: string;
  bedrooms: number;
  bathrooms: number;
  surface: number;
  summerPrice: number | null;
  studentPrice: number | null;
  verified: boolean;
  status: "Available" | "Booked for summer" | "Rented (academic year)" | "Pending verification";
  amenities: string[];
  images: string[];
  description: string;
  ownerId: string;
  walkToBeach: string;
  nearUniversity?: string;
};

const img = [prop1, prop3, prop2];

export const properties: Property[] = [
  {
    id: "MH-201",
    title: "Spacious S+2 with sea-facing balcony",
    type: "S+2",
    area: "Hiboun",
    bedrooms: 2,
    bathrooms: 1,
    surface: 90,
    summerPrice: 1400,
    studentPrice: 700,
    verified: true,
    status: "Available",
    amenities: ["Air conditioning", "Wi-Fi", "Balcony", "Sea view", "Near beach", "Washing machine"],
    images: [prop1, prop3, prop2],
    description:
      "Second-floor apartment on the Hiboun seafront road, five minutes on foot from the beach. Two bedrooms, a bright living room opening onto a balcony, and a fully equipped kitchen. The owner lives in the building and handles the keys personally.",
    ownerId: "OWN-1",
    walkToBeach: "5 min walk to beach",
  },
  {
    id: "MH-202",
    title: "Quiet S+1 in a family building, Zone Touristique",
    type: "S+1",
    area: "Zone Touristique",
    bedrooms: 1,
    bathrooms: 1,
    surface: 62,
    summerPrice: 900,
    studentPrice: 480,
    verified: true,
    status: "Available",
    amenities: ["Air conditioning", "Wi-Fi", "Parking", "Near beach"],
    images: [prop3, prop1],
    description:
      "Compact one-bedroom flat behind the hotel strip, well suited to a couple or two students. Private parking space, reliable Wi-Fi, and a bakery and grocery on the same street.",
    ownerId: "OWN-2",
    walkToBeach: "10 min walk to beach",
  },
  {
    id: "MH-203",
    title: "S+3 family apartment in Mahdia Ville",
    type: "S+3",
    area: "Mahdia Ville",
    bedrooms: 3,
    bathrooms: 2,
    surface: 120,
    summerPrice: 1800,
    studentPrice: 900,
    verified: true,
    status: "Booked for summer",
    amenities: ["Air conditioning", "Wi-Fi", "Parking", "Washing machine", "Balcony"],
    images: [prop1, prop2],
    description:
      "Large apartment near the city centre, close to the market and the train station. Three bedrooms with wardrobes, two bathrooms, and a long balcony over a calm side street.",
    ownerId: "OWN-3",
    walkToBeach: "15 min walk to beach",
  },
  {
    id: "MH-204",
    title: "Villa with terrace and small pool, Baghdedi",
    type: "Villa",
    area: "Baghdedi",
    bedrooms: 4,
    bathrooms: 3,
    surface: 220,
    summerPrice: 3200,
    studentPrice: null,
    verified: true,
    status: "Available",
    amenities: ["Air conditioning", "Wi-Fi", "Parking", "Pool", "Sea view", "Balcony"],
    images: [prop3, prop1],
    description:
      "Detached villa for a large family or two families travelling together. Shaded terrace, small pool, outdoor kitchen, and space for two cars inside the gate.",
    ownerId: "OWN-4",
    walkToBeach: "8 min walk to beach",
  },
  {
    id: "MH-205",
    title: "Furnished S+2 a short walk from FSEG",
    type: "S+2",
    area: "Near FSEG",
    bedrooms: 2,
    bathrooms: 1,
    surface: 78,
    summerPrice: null,
    studentPrice: 650,
    verified: true,
    status: "Available",
    amenities: ["Furnished", "Wi-Fi", "Air conditioning", "Near university", "Quiet"],
    images: [prop2, prop1],
    description:
      "Rented by the academic year to students only. Fully furnished with desks in both bedrooms, ten minutes on foot from FSEG, on a quiet street with a pharmacy at the corner.",
    ownerId: "OWN-1",
    walkToBeach: "20 min to beach",
    nearUniversity: "10 min walk to FSEG",
  },
  {
    id: "MH-206",
    title: "Studio for one student, Mahdia Ville",
    type: "Studio",
    area: "Mahdia Ville",
    bedrooms: 1,
    bathrooms: 1,
    surface: 34,
    summerPrice: 600,
    studentPrice: 320,
    verified: false,
    status: "Pending verification",
    amenities: ["Furnished", "Wi-Fi", "Quiet"],
    images: [prop2],
    description:
      "Independent studio on the ground floor of a small house, with its own entrance. Bed, desk, kitchenette and shower room. Water and electricity shared with the owner and billed monthly.",
    ownerId: "OWN-5",
    walkToBeach: "15 min walk to beach",
    nearUniversity: "12 min to ISET",
  },
  {
    id: "MH-207",
    title: "S+2 on the Rejiche coast road",
    type: "S+2",
    area: "Rejiche",
    bedrooms: 2,
    bathrooms: 1,
    surface: 85,
    summerPrice: 1250,
    studentPrice: 620,
    verified: true,
    status: "Available",
    amenities: ["Air conditioning", "Wi-Fi", "Sea view", "Near beach", "Parking"],
    images: [prop1, prop3],
    description:
      "Quieter than the tourist zone and still close to the water. Bright living room, two bedrooms, and a terrace used for evening meals in summer.",
    ownerId: "OWN-2",
    walkToBeach: "3 min walk to beach",
  },
  {
    id: "MH-208",
    title: "Room in a shared student apartment, near ISET",
    type: "Room",
    area: "Mahdia Ville",
    bedrooms: 1,
    bathrooms: 1,
    surface: 16,
    summerPrice: null,
    studentPrice: 280,
    verified: true,
    status: "Available",
    amenities: ["Furnished", "Wi-Fi", "Near university", "Washing machine"],
    images: [prop2],
    description:
      "One private room in an S+3 shared by three students. Kitchen and bathroom shared, washing machine included, internet already installed. Female students only this year.",
    ownerId: "OWN-3",
    walkToBeach: "18 min to beach",
    nearUniversity: "7 min walk to ISET",
  },
  {
    id: "MH-209",
    title: "S+1 above a courtyard in the medina",
    type: "S+1",
    area: "Mahdia Ville",
    bedrooms: 1,
    bathrooms: 1,
    surface: 55,
    summerPrice: 850,
    studentPrice: 450,
    verified: false,
    status: "Pending verification",
    amenities: ["Wi-Fi", "Balcony", "Air conditioning"],
    images: [prop3, prop2],
    description:
      "Traditional house converted into a small apartment, reached through an interior courtyard. Thick walls keep it cool in July. Narrow street, so no car access to the door.",
    ownerId: "OWN-5",
    walkToBeach: "6 min walk to beach",
  },
  {
    id: "MH-210",
    title: "S+3 close to the beach at Chiba",
    type: "S+3",
    area: "Chiba",
    bedrooms: 3,
    bathrooms: 2,
    surface: 130,
    summerPrice: 1600,
    studentPrice: 750,
    verified: true,
    status: "Rented (academic year)",
    amenities: ["Air conditioning", "Wi-Fi", "Parking", "Near beach", "Washing machine", "Balcony"],
    images: [prop1, prop3, prop2],
    description:
      "Ground-floor apartment with a small garden, rented to a group of students until June and available again for the summer season.",
    ownerId: "OWN-4",
    walkToBeach: "4 min walk to beach",
  },
];

export type Owner = {
  id: string;
  name: string;
  phone: string;
  area: string;
  properties: number;
  since: string;
};

export const owners: Owner[] = [
  { id: "OWN-1", name: "Sami Ben Ammar", phone: "+216 24 •• •• 41", area: "Hiboun", properties: 2, since: "Jan 2025" },
  { id: "OWN-2", name: "Leila Trabelsi", phone: "+216 98 •• •• 07", area: "Zone Touristique", properties: 2, since: "Feb 2025" },
  { id: "OWN-3", name: "Mohamed Gharbi", phone: "+216 52 •• •• 88", area: "Mahdia Ville", properties: 2, since: "Mar 2025" },
  { id: "OWN-4", name: "Fatma Jelassi", phone: "+216 22 •• •• 13", area: "Baghdedi", properties: 2, since: "Apr 2025" },
  { id: "OWN-5", name: "Anis Khedher", phone: "+216 27 •• •• 62", area: "Mahdia Ville", properties: 2, since: "May 2025" },
];

export const REQUEST_STAGES = [
  "New",
  "Contacting owners",
  "Options found",
  "Offer sent",
  "Customer interested",
  "Visit / call",
  "Confirmed",
  "Completed",
] as const;

export type RequestStage = (typeof REQUEST_STAGES)[number];

export type HousingRequest = {
  id: string;
  kind: "Student" | "Summer";
  customer: string;
  phone: string;
  university?: string;
  people: number;
  budget: string;
  period: string;
  area: string;
  preferences: string[];
  stage: RequestStage;
  submitted: string;
  note: string;
};

export const requests: HousingRequest[] = [
  {
    id: "REQ-1042",
    kind: "Student",
    customer: "Yosra Mejri",
    phone: "+216 25 •• •• 19",
    university: "FSEG",
    people: 2,
    budget: "300 DT / person / month",
    period: "September → June",
    area: "Near FSEG",
    preferences: ["Furnished", "Wi-Fi", "Near university", "Quiet"],
    stage: "Contacting owners",
    submitted: "12 Sep 2026",
    note: "Two second-year students, parents will visit before signing.",
  },
  {
    id: "REQ-1041",
    kind: "Summer",
    customer: "Karim Bouzid",
    phone: "+216 99 •• •• 30",
    people: 4,
    budget: "1,500 DT / week",
    period: "15 July → 22 July",
    area: "Hiboun",
    preferences: ["Air conditioning", "Near beach", "Parking"],
    stage: "Options found",
    submitted: "10 Sep 2026",
    note: "Family of four from Tunis, needs parking for one car.",
  },
  {
    id: "REQ-1040",
    kind: "Student",
    customer: "Aymen Saidi",
    phone: "+216 53 •• •• 74",
    university: "ISET",
    people: 1,
    budget: "350 DT / month",
    period: "October → June",
    area: "Mahdia Ville",
    preferences: ["Furnished", "Wi-Fi", "Quiet"],
    stage: "Offer sent",
    submitted: "8 Sep 2026",
    note: "Prefers a studio, no shared apartment.",
  },
  {
    id: "REQ-1039",
    kind: "Summer",
    customer: "Nadia Chaouch",
    phone: "+216 21 •• •• 56",
    people: 6,
    budget: "3,000 DT / week",
    period: "1 Aug → 10 Aug",
    area: "Baghdedi",
    preferences: ["Pool", "Air conditioning", "Parking", "Sea view"],
    stage: "Customer interested",
    submitted: "5 Sep 2026",
    note: "Two families travelling together, villa only.",
  },
  {
    id: "REQ-1038",
    kind: "Student",
    customer: "Rania Hamdi",
    phone: "+216 50 •• •• 11",
    university: "ISAM",
    people: 3,
    budget: "280 DT / person / month",
    period: "September → June",
    area: "Mahdia Ville",
    preferences: ["Furnished", "Washing machine", "Wi-Fi"],
    stage: "Confirmed",
    submitted: "2 Sep 2026",
    note: "Three students sharing an S+3, contract signed 20 Sep.",
  },
  {
    id: "REQ-1037",
    kind: "Summer",
    customer: "Hatem Zouari",
    phone: "+216 26 •• •• 45",
    people: 3,
    budget: "1,100 DT / week",
    period: "20 June → 27 June",
    area: "Rejiche",
    preferences: ["Near beach", "Wi-Fi", "Balcony"],
    stage: "Completed",
    submitted: "28 Aug 2026",
    note: "Stay completed, customer asked about August availability.",
  },
];

export type Match = {
  propertyId: string;
  label: string;
  area: string;
  price: string;
  verified: boolean;
  score: number;
  reason: string;
};

export const matchesForRequest: Match[] = [
  {
    propertyId: "MH-201",
    label: "S+2 — Hiboun",
    area: "Hiboun",
    price: "700 DT / month",
    verified: true,
    score: 92,
    reason: "Furnished, Wi-Fi, quiet street, within budget for two students",
  },
  {
    propertyId: "MH-205",
    label: "S+2 — near FSEG",
    area: "Near FSEG",
    price: "650 DT / month",
    verified: true,
    score: 88,
    reason: "10 min walk to FSEG, desks in both bedrooms",
  },
  {
    propertyId: "MH-210",
    label: "S+3 — Chiba",
    area: "Chiba",
    price: "750 DT / month",
    verified: true,
    score: 84,
    reason: "Extra room, slightly above budget, further from campus",
  },
  {
    propertyId: "MH-206",
    label: "Studio — Mahdia Ville",
    area: "Mahdia Ville",
    price: "320 DT / month",
    verified: false,
    score: 71,
    reason: "Only fits one student, verification still pending",
  },
  {
    propertyId: "MH-208",
    label: "Room — near ISET",
    area: "Mahdia Ville",
    price: "280 DT / month",
    verified: true,
    score: 64,
    reason: "Shared apartment, wrong university area",
  },
];

export type Deal = {
  id: string;
  request: string;
  property: string;
  ownerPrice: number;
  customerOffer: number;
  closed: string;
};

export const deals: Deal[] = [
  { id: "DL-318", request: "REQ-1038", property: "S+3 — Mahdia Ville", ownerPrice: 650, customerOffer: 700, closed: "20 Sep 2026" },
  { id: "DL-317", request: "REQ-1037", property: "S+2 — Rejiche", ownerPrice: 1100, customerOffer: 1250, closed: "14 Sep 2026" },
  { id: "DL-316", request: "REQ-1031", property: "Villa — Baghdedi", ownerPrice: 2900, customerOffer: 3200, closed: "3 Sep 2026" },
];

export const myRequests = [
  {
    id: "REQ-1042",
    kind: "Logement étudiant" as const,
    summary: "FSEG · 2 étudiants · 300 DT / pers.",
    period: "Septembre → Juin",
    stage: "Recherche en cours",
    submitted: "12 Sep 2026",
    optionCount: 0,
  },
  {
    id: "REQ-1041",
    kind: "Location d'été" as const,
    summary: "4 pers. · jusqu'à 1500 DT / sem.",
    period: "15 Juillet → 22 Juillet",
    stage: "Options trouvées",
    submitted: "10 Sep 2026",
    optionCount: 3,
  },
];

export const heroImages = img;

export function getProperty(id: string) {
  return properties.find((p) => p.id === id);
}

export function formatDT(v: number) {
  return v.toLocaleString("en-US");
}
