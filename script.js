"use strict";
// ---- Rates and capacities (change here to alter prices/limits) ----
const ROOMS = {
  single: { label: "Single Room", rate: 3500, capacity: 1 },
  double: { label: "Double Room", rate: 5000, capacity: 2 },
  family: { label: "Family Room", rate: 7500, capacity: 4 }
};
const BREAKFAST_RATE = 700;   // per person per day
const TRANSFER_FEE = 2000;    // flat
const EXTRA_BED_RATE = 1500;  // per night (individual requirement)

const $ = id => document.getElementById(id);
const form = $("bookingForm");
const fmt = n => "KSh " + n.toLocaleString("en-KE");

function setError(field, msg) {
  $("err-" + field).textContent = msg;
  $(field).classList.toggle("invalid", msg !== "");
  return msg === "";
}

// ---- Function 1: capacity check (dynamic feature) ----
function checkRoomCapacity() {
  const room = ROOMS[$("roomType").value];
  const guests = parseInt($("guests").value, 10) || 0;
  const warn = $("capacityWarning");
  if (!room) { $("capacityInfo").textContent = ""; warn.style.display = "none"; return true; }
  $("capacityInfo").textContent = "Maximum guests for this room: " + room.capacity;
  if (guests > room.capacity) {
    warn.textContent = "Warning: " + room.label + " allows only " + room.capacity +
      " guest(s). Choose a larger room or reduce guests.";
    warn.style.display = "block";
    return false;
  }
  warn.style.display = "none";
  return true;
}

// ---- Function 2: bill calculator ----
function calculateBill() {
  const room = ROOMS[$("roomType").value];
  const nights = parseInt($("nights").value, 10) || 0;
  const guests = parseInt($("guests").value, 10) || 0;
  const breakfast = form.breakfast.value === "yes";
  const roomCost = room ? room.rate * nights : 0;
  const breakfastCost = breakfast ? BREAKFAST_RATE * guests * nights : 0;
  const transferCost = $("transfer").checked ? TRANSFER_FEE : 0;
  const extraBedCost = $("extraBed").checked ? EXTRA_BED_RATE * nights : 0;
  const total = roomCost + breakfastCost + transferCost + extraBedCost;
  $("jsTotal").value = total;
  return { roomCost, breakfastCost, transferCost, extraBedCost, total };
}

// ---- Function 3: live package summary (dynamic feature) ----
function updateSummary() {
  const room = ROOMS[$("roomType").value];
  const body = $("summaryBody");
  if (!room) { body.innerHTML = "<tr><td>Choose a room to see your summary.</td></tr>"; return; }
  const b = calculateBill();
  const rows = [
    [room.label + " x " + ($("nights").value || 0) + " night(s)", fmt(b.roomCost)],
    ["Breakfast", form.breakfast.value === "yes" ? fmt(b.breakfastCost) : "No"],
    ["Airport transfer", $("transfer").checked ? fmt(b.transferCost) : "No"],
    ["Extra bed", $("extraBed").checked ? fmt(b.extraBedCost) : "No"]
  ];
  body.innerHTML = rows.map(r => "<tr><td>" + r[0] + "</td><td>" + r[1] + "</td></tr>").join("") +
    '<tr><td><b>Estimated Total</b></td><td class="total">' + fmt(b.total) + "</td></tr>";
}

function refresh() { checkRoomCapacity(); updateSummary(); }

// ---- Function 4: validation ----
function validateBooking() {
  let ok = true;
  const name = $("fullName").value.trim();
  ok = setError("fullName", name === "" ? "Full name is required." : "") && ok;
  ok = setError("idNumber", $("idNumber").value.trim() === "" ? "ID/Passport number is required." : "") && ok;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test($("email").value.trim());
  ok = setError("email", emailOk ? "" : "Enter a valid email address.") && ok;
  ok = setError("phone", /^\d{10}$/.test($("phone").value.trim()) ? "" : "Phone number must be exactly 10 digits.") && ok;
  const ci = $("checkIn").value;
  const today = new Date().toISOString().split("T")[0];
  ok = setError("checkIn", ci === "" ? "Select a check-in date." : (ci < today ? "Check-in date cannot be in the past." : "")) && ok;
  const n = Number($("nights").value);
  ok = setError("nights", Number.isInteger(n) && n >= 1 && n <= 14 ? "" : "Nights must be between 1 and 14.") && ok;
  ok = setError("roomType", $("roomType").value === "" ? "Please select a room type." : "") && ok;
  const g = Number($("guests").value);
  let gMsg = "";
  if (!Number.isInteger(g) || g <= 0) gMsg = "Guests must be greater than zero.";
  else if (!checkRoomCapacity()) gMsg = "Number of guests exceeds room capacity.";
  ok = setError("guests", gMsg) && ok;
  return ok;
}

// ---- Events ----
$("roomType").addEventListener("change", refresh);                 // change
["guests", "nights"].forEach(id => $(id).addEventListener("input", refresh)); // input
$("transfer").addEventListener("change", () => {                   // change
  $("transferDetails").classList.toggle("hidden", !$("transfer").checked);
  refresh();
});
$("extraBed").addEventListener("change", refresh);
document.querySelectorAll('input[name="breakfast"]').forEach(r => r.addEventListener("change", refresh));
$("resetBtn").addEventListener("click", () => {                    // click
  setTimeout(() => {
    document.querySelectorAll(".error").forEach(e => e.textContent = "");
    document.querySelectorAll(".invalid").forEach(e => e.classList.remove("invalid"));
    $("transferDetails").classList.add("hidden");
    refresh();
  }, 0);
});
form.addEventListener("submit", e => {                             // submit
  if (!validateBooking()) { e.preventDefault(); return; }
  calculateBill();
});
$("checkIn").min = new Date().toISOString().split("T")[0];
refresh();
