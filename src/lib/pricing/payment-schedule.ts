export interface MonthlyScheduleItem {
  monthIndex: number;
  monthKey: string; // e.g. "2026-09"
  monthLabel: string; // e.g. "Septembre 2026"
  dueDate: string; // e.g. "01/09/2026"
  amount: number;
  paidAmount: number;
  status: "PAID" | "PARTIALLY_PAID" | "UNPAID";
}

export interface PaymentScheduleResult {
  isStudentMonthly: boolean;
  monthlyRate: number;
  totalMonths: number;
  currency: string;
  totalAmount: number;
  paidAmount: number;
  reportedAmount: number;
  remainingAmount: number;
  overallStatus: "PAID" | "PARTIALLY_PAID" | "REPORTED" | "UNPAID";
  activeMonthDue: MonthlyScheduleItem | null;
  schedule: MonthlyScheduleItem[];
  staySummary?: {
    checkIn: string;
    checkOut: string;
    nights: number;
    pricePerNight: number;
  };
}

export function calculatePaymentSchedule(reservation: {
  rentalCategory?: string;
  checkIn: Date | string;
  checkOut: Date | string;
  pricing?: {
    total?: number;
    unitPrice?: number;
    pricePeriod?: string;
    pricePerNight?: number;
    currency?: string;
  };
  paymentSummary?: {
    paidAmount?: number;
    reportedAmount?: number;
    paidMonths?: string[];
    status?: string;
  };
}): PaymentScheduleResult {
  const category = (reservation.rentalCategory || "").toLowerCase();
  const pricePeriod = (reservation.pricing?.pricePeriod || "").toLowerCase();
  const isStudentMonthly =
    category === "student" ||
    category === "universe" ||
    category === "étudiant" ||
    category === "etudiant" ||
    pricePeriod === "month" ||
    pricePeriod === "monthly" ||
    category !== "summer";
  const currency = reservation.pricing?.currency || "TND";

  const checkInDate = new Date(reservation.checkIn);
  const checkOutDate = new Date(reservation.checkOut);

  if (!isStudentMonthly) {
    const diffTime = Math.max(0, checkOutDate.getTime() - checkInDate.getTime());
    const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const totalAmount = reservation.pricing?.total || 0;
    const pricePerNight = reservation.pricing?.pricePerNight || (nights > 0 ? Math.round(totalAmount / nights) : 0);
    const paidAmount = reservation.paymentSummary?.paidAmount || 0;
    const remainingAmount = Math.max(0, totalAmount - paidAmount);
    const rawStatus = (reservation.paymentSummary?.status || "UNPAID").toUpperCase();

    let overallStatus: "PAID" | "PARTIALLY_PAID" | "REPORTED" | "UNPAID" = "UNPAID";
    if (rawStatus === "PAID" || rawStatus === "VERIFIED" || (totalAmount > 0 && paidAmount >= totalAmount)) {
      overallStatus = "PAID";
    } else if (rawStatus === "REPORTED") {
      overallStatus = "REPORTED";
    } else if (paidAmount > 0) {
      overallStatus = "PARTIALLY_PAID";
    }

    return {
      isStudentMonthly: false,
      monthlyRate: 0,
      totalMonths: 0,
      currency,
      totalAmount,
      paidAmount,
      reportedAmount: reservation.paymentSummary?.reportedAmount || 0,
      remainingAmount,
      overallStatus,
      activeMonthDue: null,
      schedule: [],
      staySummary: {
        checkIn: checkInDate.toLocaleDateString("fr-FR"),
        checkOut: checkOutDate.toLocaleDateString("fr-FR"),
        nights,
        pricePerNight,
      },
    };
  }

  // Calculate monthly sequence between checkIn and checkOut
  const curr = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), 1);
  const end = new Date(checkOutDate.getFullYear(), checkOutDate.getMonth(), 1);
  const totalMonthsCountTemp = Math.max(1, (end.getFullYear() - curr.getFullYear()) * 12 + (end.getMonth() - curr.getMonth()) + 1);

  const monthlyRate = reservation.pricing?.unitPrice || (reservation.pricing?.total ? Math.round(reservation.pricing.total / totalMonthsCountTemp) : 0);
  const explicitPaidMonths = reservation.paymentSummary?.paidMonths;
  const reportedAmountInput = reservation.paymentSummary?.reportedAmount || reservation.paymentSummary?.paidAmount || 0;
  const autoPaidCount = (Array.isArray(explicitPaidMonths))
    ? 0
    : (monthlyRate > 0 ? Math.floor(reportedAmountInput / monthlyRate) : 0);

  const schedule: MonthlyScheduleItem[] = [];
  let monthIndex = 1;
  const monthNamesFr = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  while (curr <= end) {
    const year = curr.getFullYear();
    const monthNum = curr.getMonth(); // 0-indexed
    const monthKey = `${year}-${String(monthNum + 1).padStart(2, "0")}`;
    const monthLabel = `${monthNamesFr[monthNum]} ${year}`;
    const dueDate = `01/${String(monthNum + 1).padStart(2, "0")}/${year}`;

    let isPaid = false;
    if (Array.isArray(explicitPaidMonths)) {
      isPaid = explicitPaidMonths.includes(monthKey);
    } else {
      isPaid = monthIndex <= autoPaidCount;
    }

    schedule.push({
      monthIndex,
      monthKey,
      monthLabel,
      dueDate,
      amount: monthlyRate,
      paidAmount: isPaid ? monthlyRate : 0,
      status: isPaid ? "PAID" : "UNPAID",
    });

    curr.setMonth(curr.getMonth() + 1);
    monthIndex++;
  }

  const totalMonths = schedule.length;
  const totalAmount = reservation.pricing?.total || monthlyRate * totalMonths;
  const paidMonthsCount = schedule.filter((item) => item.status === "PAID").length;
  const paidAmount = Array.isArray(explicitPaidMonths)
    ? paidMonthsCount * monthlyRate
    : (reservation.paymentSummary?.paidAmount || 0);

  const reportedAmount = reservation.paymentSummary?.reportedAmount || paidAmount;
  const remainingAmount = Math.max(0, totalAmount - paidAmount);

  let overallStatus: "PAID" | "PARTIALLY_PAID" | "REPORTED" | "UNPAID" = "UNPAID";
  if (paidMonthsCount === totalMonths && totalMonths > 0) {
    overallStatus = "PAID";
  } else if (reservation.paymentSummary?.status === "REPORTED") {
    overallStatus = "REPORTED";
  } else if (paidMonthsCount > 0 || paidAmount > 0) {
    overallStatus = "PARTIALLY_PAID";
  }

  const activeMonthDue = schedule.find((item) => item.status === "UNPAID") || (schedule.length > 0 ? schedule[schedule.length - 1] : null);

  return {
    isStudentMonthly: true,
    monthlyRate,
    totalMonths,
    currency,
    totalAmount,
    paidAmount,
    reportedAmount,
    remainingAmount,
    overallStatus,
    activeMonthDue,
    schedule,
  };
}

