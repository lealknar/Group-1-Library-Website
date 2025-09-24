<?php
// backend/register.php

// Set content type to JSON
header('Content-Type: application/json');

// Include the database connection file
include("db_connection.php");

// Check if the request method is POST
if ($_SERVER["REQUEST_METHOD"] == "POST") {

    // Trim input data to remove whitespace
    $fullname = trim($_POST['fullname']);
    $mobile   = trim($_POST['mobileNumber']);
    $email    = trim($_POST['email']);
    $password = trim($_POST['password']);

    // --- Server-side Validation ---
    if (empty($fullname) || empty($mobile) || empty($email) || empty($password)) {
        echo json_encode(["status" => "error", "message" => "All fields are required."]);
        exit;
    }

    if (strlen($password) < 12) {
        echo json_encode(["status" => "error", "message" => "Password must be at least 12 characters."]);
        exit;
    }

    // --- Check for existing email or mobile number ---
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ? OR mobile = ?");
    $stmt->bind_param("ss", $email, $mobile);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows > 0) {
        echo json_encode(["status" => "error", "message" => "An account with this email or mobile number already exists."]);
        $stmt->close();
        $conn->close();
        exit;
    }
    $stmt->close();

    // --- Insert new user since they don't exist ---

    // Hash the password for security
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Prepare the SQL INSERT statement
    $stmt = $conn->prepare("INSERT INTO users (fullname, mobile, email, password) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $fullname, $mobile, $email, $hashedPassword);

    // Execute the statement and provide feedback
    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "✅ Account created successfully!"]);
    } else {
        // Provide a more specific error for debugging if possible
        echo json_encode(["status" => "error", "message" => "❌ Registration failed. Please try again later."]);
    }

    // Close the statement and connection
    $stmt->close();
    $conn->close();

} else {
    // Handle cases where the script is accessed directly without a POST request
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
}
?>