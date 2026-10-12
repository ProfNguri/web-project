<?php
// Server-side processing. Rates are defined here; the JavaScript total is never trusted.
const ROOMS = [
    'single' => ['label' => 'Single Room', 'rate' => 3500, 'capacity' => 1],
    'double' => ['label' => 'Double Room', 'rate' => 5000, 'capacity' => 2],
    'family' => ['label' => 'Family Room', 'rate' => 7500, 'capacity' => 4],
];
const BREAKFAST_RATE = 700;
const TRANSFER_FEE   = 2000;
const EXTRA_BED_RATE = 1500;

function clean(string $key): string {
    return trim($_POST[$key] ?? '');
}

function validateInput(array $d): array {
    $errors = [];
    if ($d['name'] === '') $errors[] = 'Customer name is required.';
    if ($d['id'] === '') $errors[] = 'National ID/Passport number is required.';
    if (!filter_var($d['email'], FILTER_VALIDATE_EMAIL)) $errors[] = 'Email address is invalid.';
    if (!preg_match('/^\d{10}$/', $d['phone'])) $errors[] = 'Phone number must be exactly 10 digits.';
    $date = DateTime::createFromFormat('Y-m-d', $d['checkIn']);
    if (!$date || $date->format('Y-m-d') !== $d['checkIn']) $errors[] = 'Check-in date is invalid.';
    if ($d['nights'] < 1 || $d['nights'] > 14) $errors[] = 'Nights must be between 1 and 14.';
    if (!isset(ROOMS[$d['room']])) {
        $errors[] = 'Please select a valid room type.';
    } elseif ($d['guests'] > ROOMS[$d['room']]['capacity']) {
        $errors[] = 'Guests exceed the room capacity (' . ROOMS[$d['room']]['capacity'] . ').';
    }
    if ($d['guests'] < 1) $errors[] = 'Number of guests must be greater than zero.';
    return $errors;
}

function calculateTotal(array $d): int {
    $total = ROOMS[$d['room']]['rate'] * $d['nights'];
    if ($d['breakfast']) $total += BREAKFAST_RATE * $d['guests'] * $d['nights'];
    if ($d['transfer'])  $total += TRANSFER_FEE;
    if ($d['extraBed'])  $total += EXTRA_BED_RATE * $d['nights'];
    return $total;
}

$h = fn($s) => htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');
$errors = [];
$data = null;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    $errors[] = 'Please submit the booking form.';
} else {
    $data = [
        'name'      => clean('fullName'),
        'id'        => clean('idNumber'),
        'email'     => clean('email'),
        'phone'     => clean('phone'),
        'checkIn'   => clean('checkIn'),
        'nights'    => (int) clean('nights'),
        'room'      => clean('roomType'),
        'guests'    => (int) clean('guests'),
        'breakfast' => clean('breakfast') === 'yes',
        'transfer'  => clean('transfer') === 'yes',
        'extraBed'  => clean('extraBed') === 'yes',
    ];
    $errors = validateInput($data);
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Booking Confirmation - Sunrise Hotel</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
<header><h1>Sunrise Hotel</h1>
<nav><a href="index.html">Home</a><a href="booking.html">Book a Room</a></nav></header>
<main>
<?php if ($errors): ?>
  <div class="errbox"><h2>Booking could not be processed</h2><ul>
  <?php foreach ($errors as $e): ?><li><?= $h($e) ?></li><?php endforeach; ?>
  </ul><a class="btn" href="booking.html">Go back to the form</a></div>
<?php else:
    $total = calculateTotal($data);
    $jsTotal = (int) clean('jsTotal');
?>
  <div class="confirm">
    <h2>BOOKING CONFIRMED</h2>
    <table>
      <tr><td><b>Customer:</b></td><td><?= $h($data['name']) ?></td></tr>
      <tr><td><b>Room:</b></td><td><?= $h(ROOMS[$data['room']]['label']) ?></td></tr>
      <tr><td><b>Check-in:</b></td><td><?= $h($data['checkIn']) ?></td></tr>
      <tr><td><b>Guests:</b></td><td><?= $data['guests'] ?></td></tr>
      <tr><td><b>Number of Nights:</b></td><td><?= $data['nights'] ?></td></tr>
      <tr><td><b>Breakfast:</b></td><td><?= $data['breakfast'] ? 'Yes' : 'No' ?></td></tr>
      <tr><td><b>Airport Transfer:</b></td><td><?= $data['transfer'] ? 'Yes' : 'No' ?></td></tr>
      <tr><td><b>Extra Bed:</b></td><td><?= $data['extraBed'] ? 'Yes' : 'No' ?></td></tr>
    </table>
    <p class="total">TOTAL AMOUNT: KSh <?= number_format($total) ?></p>
    <?php if ($jsTotal !== $total): ?>
      <p class="info">Note: the amount shown on the form differed from the verified amount; the server-calculated total applies.</p>
    <?php endif; ?>
    <p>Thank you for choosing Sunrise Hotel.</p>
    <a class="btn" href="index.html">Back to Home</a>
  </div>
<?php endif; ?>
</main>
<footer>&copy; 2026 Sunrise Hotel</footer>
</body>
</html>
