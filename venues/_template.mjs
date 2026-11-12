// TEMPLATE FOR A NEW RESTAURANT
//
// 1. Copy this file and name the copy after the restaurant, in lowercase with
//    hyphens and no spaces, ending in .mjs    Example: jinos-thai-cafe.mjs
// 2. Fill in every line below from the restaurant's own website.
// 3. Upload the new file into the "venues" folder on GitHub.
//
// The file name becomes the restaurant's ID. For jinos-thai-cafe.mjs the chat
// page is  https://YOUR-SITE.netlify.app/?venue=jinos-thai-cafe
//
// Files whose names start with _ (like this one) are ignored.

export default {
  // The name guests see at the top of the chat.
  name: "Restaurant Name",

  // A few words shown under the name.
  label: "Restaurant",

  // Finishes the sentence "You are the website assistant for NAME, ..."
  kind: "an independent restaurant in Leeds",

  // Leave as false for a real restaurant.
  demo: false,

  // The number guests should ring.
  phone: "0113 000 0000",

  // Their real booking page (ResDiary, OpenTable, their own form...).
  // Must start with https://  Leave as "" if they only take bookings by phone.
  bookingUrl: "",
  bookingLabel: "Book a table",

  // Their brand colour as a hex code. Pick a dark shade so white text shows on it.
  accent: "#1C6A4F",

  // The first message guests see.
  greeting:
    "Hi, welcome to Restaurant Name. I can help with opening times, the menu and bookings. What would you like to know?",

  // Up to five example questions shown as buttons.
  suggested: [
    "What time are you open on Saturday?",
    "Do you do gluten-free?",
    "Can I book for a group?",
    "Is there parking?",
  ],

  // Everything the assistant is allowed to know. One fact per line, in plain English.
  // Only use what the restaurant has published or told you. Never guess.
  // Never write that a dish is safe for an allergy. Allergy questions always go to staff.
  info: `
Opening:
Booking:
Menu:
Dietary:
Getting here:
Access:
Families and dogs:
Changes and cancellations:
`,
};
