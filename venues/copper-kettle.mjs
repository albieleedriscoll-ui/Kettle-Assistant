// The Copper Kettle: a made-up restaurant used for demos.
// To add a real restaurant, copy _template.mjs instead of this file.

export default {
  name: "The Copper Kettle",
  label: "Restaurant and bar",
  kind: "an independent restaurant and bar in Leeds",

  // true = a made-up business. Shows a small "example business" note.
  demo: true,

  phone: "0113 496 0123",

  // The venue's real booking page. Left empty here because this restaurant doesn't exist.
  bookingUrl: "",
  bookingLabel: "Open booking page",

  // Brand colour for buttons and the guest's chat bubbles.
  accent: "#1C6A4F",

  greeting:
    "Hi, welcome to The Copper Kettle. I can help with opening times, the menu, parking and bookings. What would you like to know?",

  suggested: [
    "What time's your last table on Saturday?",
    "Do you do gluten-free?",
    "Can I book for 12 on 12 December?",
    "Is there parking?",
    "Book me a table for 2 tonight",
  ],

  // Everything the assistant is allowed to know. One fact per line.
  // If it isn't written here, the assistant says it doesn't know and offers to pass the question on.
  info: `
Opening: closed Monday. Tue to Thu 12pm to 10pm (kitchen closes 9pm, last table 8:45pm). Fri and Sat 12pm to 11pm (kitchen closes 9:30pm, last table 9:15pm). Sun 12pm to 8pm (roasts served 12 to 5pm, last table 6:30pm).
Booking: the online booking page takes up to 8 people and confirms straight away. Groups of 9 or more are confirmed by the team, with a £10 per head deposit, refundable with 48 hours' notice. The private room seats up to 16.
Menu: seasonal. Small plates from £6, mains from £16, Sunday roast £19.50 (beef, pork or nut roast). Dishes are marked V, VG and GF on the menu.
Dietary: many dishes can be made without gluten, but the kitchen handles gluten. There are vegetarian and vegan dishes in every part of the menu. Allergy questions always go to the team.
Getting here: no car park. Pay-and-display on nearby streets, free after 6pm. Buses stop 2 minutes away. The train station is a 10-minute walk.
Access: step-free entrance, accessible toilet on the ground floor.
Families and dogs: children welcome until 8pm, high chairs available, kids' menu £7.50 (a main and a drink). Dogs welcome in the bar area only.
Changes: change or cancel through the link in the confirmation email. Running late: call, tables are held for 15 minutes.
Gift vouchers: from £25 on the website, valid 12 months.
`,
};
