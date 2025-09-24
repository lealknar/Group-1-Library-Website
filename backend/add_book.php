<?php
// backend/add_book.php

header('Content-Type: application/json');
require_once("db_connection.php");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

$name = $data->name ?? '';
$author = $data->author ?? '';
$quantity = isset($data->quantity) ? intval($data->quantity) : 0;
$genre = $data->genre ?? 'Unknown';
$publication_year = !empty($data->publication_year) ? intval($data->publication_year) : null;

if (empty($name) || empty($author) || $quantity <= 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Book Title, Author, and a valid Quantity are required."]);
    exit;
}

try {
    // This correctly inserts into your main 'books' table. No changes are needed.
    $stmt = $conn->prepare("INSERT INTO books (name_of_book, author, quantity, genre, publication_year) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("ssisi", $name, $author, $quantity, $genre, $publication_year);

    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode(["success" => true, "message" => "Book added successfully!"]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Failed to add the book."]);
    }

    $stmt->close();
    $conn->close();
} catch (Exception $e) {
    http_response_code(500);
    error_log($e->getMessage());
    echo json_encode(["success" => false, "message" => "A server error occurred."]);
}
?>