export const APP_NAME = "Smart Dispensary";
export const CAMPUS_NAME = "Thapar Institute of Engineering & Technology";
export const ALLOWED_EMAIL_DOMAIN = "thapar.edu";

export const EMERGENCY_CONTACTS = [
  { label: "Campus Ambulance (24x7)", number: "+91 8288008122" },
  { label: "National Emergency", number: "112" },
];

export const HOSTELS = [
  "Agira Hall (Hostel-A)",
  "Amritam Hall (Hostel-B)",
  "Prithvi Hall (Hostel-C)",
  "Neeram Hall (Hostel-D)",
  "Vasudha Hall - Block E (Hostel-E)",
  "Vasudha Hall - Block G (Hostel-G)",
  "Vyan Hall (Hostel-H)",
  "Ira Hall (Hostel-I)",
  "Tejas Hall (Hostel-J)",
  "Ambaram Hall (Hostel-K)",
  "Viyat Hall (Hostel-L)",
  "Anantam Hall (Hostel-M)",
  "Vyom Hall (Hostel-O)",
  "Ananta Hall (Hostel-N)",
  "Dhriti Hall (Hostel-PG)",
  "Vahni Hall (Hostel-Q)",
  "Hostel-FRF/G",
  "Hostel-Pavani Hall (PG-2)",
  "Day Scholar",
];

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const AMBULANCE_STAGES = ["requested", "dispatched", "arriving", "arrived", "completed"] as const;

export const DELIVERY_STAGES = ["pending", "approved", "packed", "out_for_delivery", "delivered"] as const;

export function isThaparEmail(email: string) {
  return email.trim().toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`);
}

export function formatStatus(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatTime(time: string) {
  const [h, m] = time.split(":");
  const hour = Number(h);
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${m} ${suffix}`;
}

export function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export const HEALTH_CENTRE_EMAIL = "healthcentre@thapar.edu";
export const AMBULANCE_NUMBER = "+91 8288008122";

export const HEALTH_CENTRE_HEAD = {
  name: "Dr. Vishal Srivastava",
  role: "Faculty-in-Charge, Health Centre",
  detail: "Professor, EIED",
  email: HEALTH_CENTRE_EMAIL,
};

export const HEALTH_CENTRE_DOCTORS = [
  { name: "Dr. Ritu Bassi", role: "Sr. Medical Officer", qualification: "M.B.B.S, PGDHA", experience: "23 yrs" },
  { name: "Dr. Ajay Gupta", role: "Medical Officer", qualification: "M.B.B.S, M.D (Pediatrics)", experience: "46 yrs" },
  { name: "Dr. Jeevan Jot Singh", role: "Medical Officer", qualification: "M.B.B.S", experience: "9.2 yrs" },
  { name: "Dr. Sarabjeet Kaur", role: "Medical Officer", qualification: "B.H.M.S", experience: "16 yrs" },
  { name: "Dr. Mahroosh Nasir", role: "Medical Officer", qualification: "M.B.B.S", experience: "5 yrs" },
  { name: "Dr. Harjit Singh", role: "Medical Officer", qualification: "M.B.B.S", experience: null },
];

export const HEALTH_CENTRE_STAFF: { group: string; people: { name: string; role: string; qualification?: string; experience?: string }[] }[] = [
  {
    group: "Pharmacists",
    people: [
      { name: "Mr. Abhishek Bhardwaj", role: "Associate (Pharmacist)", qualification: "D-Pharma, B-Pharma, MBA (H.M.), Diploma in Computer Application", experience: "12 yrs" },
      { name: "Mr. Anish", role: "Junior Associate (Pharmacist)", qualification: "D-Pharma, BSc (Medical)", experience: "12 yrs" },
      { name: "Mr. Kamalpreet Singh", role: "Pharmacist", qualification: "D-Pharma, B-Pharma", experience: "12 yrs" },
      { name: "Mr. Arjun Mishra", role: "Pharmacist", qualification: "D-Pharma", experience: "2.5 yrs" },
    ],
  },
  {
    group: "Medical assistant",
    people: [
      { name: "Mr. Avtar Singh", role: "Medical Assistant", qualification: "B.A., Nursing Diploma in Army Medical Corps", experience: "31 yrs" },
    ],
  },
  {
    group: "Nursing staff",
    people: [
      { name: "Mrs. Satvir Kaur", role: "Senior Associate (Staff Nurse)", qualification: "Diploma in General Nursing", experience: "23 yrs" },
      { name: "Mrs. Jasmine", role: "Staff Nurse", qualification: "DMLT, GNM", experience: "14 yrs" },
    ],
  },
  {
    group: "Helping staff",
    people: [
      { name: "Mr. Partap Ram", role: "Peon", experience: "31 yrs" },
      { name: "Ms. Neha", role: "Helper", qualification: "Bachelor of Arts", experience: "2 yrs" },
    ],
  },
];

export const OPD_TIMINGS = [
  {
    days: "Monday to Friday",
    lines: ["24 hours operational", "2:00 am – 8:30 am: only Medical Assistant available"],
  },
  { days: "Saturday", lines: ["9:00 am – 2:00 pm", "3:00 pm – 2:00 am"] },
  {
    days: "Sunday",
    lines: ["9:00 am – 2:00 pm", "3:00 pm – 8:00 pm", "10:00 pm – 6:00 am: only Medical Assistant available"],
  },
];

export const HEALTH_CENTRE_NOTE =
  "The Health Centre remains closed on gazetted holidays. Ambulance services run 24x7 for emergencies requiring hospitalisation.";

export const HEALTH_CENTRE_GOALS = [
  {
    title: "Enhance overall productivity",
    body: "Keep students, teaching and non-teaching staff healthy through basic medical care and counselling.",
  },
  {
    title: "Raise health awareness",
    body: "Inform the Thapar community about current and relevant health issues.",
  },
];

export const HEALTH_CENTRE_FOCUS = [
  { title: "Medical first aid and basic health care", body: "Immediate care for minor illnesses and injuries." },
  { title: "Prompt and early referral", body: "Refer patients to specialised care when a concern is more serious." },
  { title: "Immediate transfer of emergencies", body: "Institute ambulance moves critical cases to hospital quickly." },
  { title: "Health awareness programmes", body: "Campus initiatives that promote health education and awareness." },
];

/* ------------------------------ Appointment slots ----------------------------- */

export const SLOT_MINUTES = 20;
export const BOOKING_DAYS_AHEAD = 7;

// Used for any doctor/day that has no availability added from the admin panel.
export const DEFAULT_BOOKING_HOURS: { start: string; end: string }[] = [
  { start: "09:00", end: "14:00" },
  { start: "15:00", end: "20:00" },
];

const toMinutes = (time: string) => {
  const [h = 0, m = 0] = time.split(":").map(Number);
  return h * 60 + m;
};

const fromMinutes = (mins: number) =>
  `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

/** "09:20:00" -> "09:20" */
export const shortTime = (time: string) => time.slice(0, 5);

export function addMinutes(time: string, minutes: number) {
  return fromMinutes(toMinutes(time) + minutes);
}

/** Splits availability windows into 20-minute start times ("HH:MM"), sorted and de-duplicated. */
export function buildSlotTimes(windows: { start: string; end: string }[]) {
  const times = new Set<string>();
  for (const w of windows) {
    for (let t = toMinutes(w.start); t + SLOT_MINUTES <= toMinutes(w.end); t += SLOT_MINUTES) {
      times.add(fromMinutes(t));
    }
  }
  return [...times].sort();
}

/** YYYY-MM-DD in the browser's local timezone (toISOString would give the UTC date). */
export function localDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const NOTICE_CATEGORIES = {
  dispensary: "Dispensary",
  health: "Health concern",
  doctor: "Doctor availability",
} as const;
