<?php
// backend/login.php

// Start a session to store user login state.
// This should be at the very top of the script.
session_start();

// Set the content type of the response to JSON
header('Content-Type: application/json');

// Include the database connection file
require_once("db_connection.php");

// --- Ensure the request is a POST request ---
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405); // Method Not Allowed
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
    exit;
}

// --- Get JSON data from the request body ---
// The JavaScript will send data as JSON, so we need to decode it.
$data = json_decode(file_get_contents("php://input"));

$email = $data->email ?? '';
$password = $data->password ?? '';

// --- Basic Validation ---
if (empty($email) || empty($password)) {
    http_response_code(400); // Bad Request
    echo json_encode(["status" => "error", "message" => "Email and password are required."]);
    exit;
}

// --- Database Operations ---
try {
    // Prepare a statement to select the user by email
    $stmt = $conn->prepare("SELECT id, fullname, password FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    // Check if exactly one user was found
    if ($result->num_rows === 1) {
        $user = $result->fetch_assoc();

        // Verify the provided password against the hashed password from the database
        if (password_verify($password, $user['password'])) {
            // Password is correct. Login successful.
            
            // Store user information in the session
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_fullname'] = $user['fullname'];
            $_SESSION['loggedin'] = true;

            http_response_code(200); // OK
            echo json_encode(["status" => "success", "message" => "Authentication Successful!"]);

        } else {
            // Password is not correct
            http_response_code(401); // Unauthorized
            echo json_encode(["status" => "error", "message" => "Invalid email or password."]);
        }
    } else {
        // No user found with that email
        http_response_code(401); // Unauthorized
        echo json_encode(["status" => "error", "message" => "Invalid email or password."]);
    }

    $stmt->close();
    $conn->close();

} catch (Exception $e) {
    // Handle any other server-side errors
    http_response_code(500); // Internal Server Error
    // error_log($e->getMessage()); // It's good practice to log the actual error
    echo json_encode(["status" => "error", "message" => "A server error occurred. Please try again later."]);
}
?>