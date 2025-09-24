<?php
// backend/account_manager.php

header('Content-Type: application/json');
require_once("db_connection.php");

// For a real application, get the user_id from a secure session after login.
// Example:
// session_start();
// $user_id = $_SESSION['user_id'] ?? null;

// For this example, we get the ID from the URL.
$user_id = $_GET['user_id'] ?? null;
$action = $_GET['action'] ?? '';

if (empty($user_id)) {
    echo json_encode(['success' => false, 'message' => 'User ID is required.']);
    exit();
}

switch ($action) {
    case 'get_user_history':
        getUserHistory($conn, $user_id);
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action specified.']);
        break;
}

/**
 * Fetches a complete history (borrowed and returned books) for a user.
 * It uses a UNION query to combine results from two tables.
 *
 * @param mysqli $conn The database connection object.
 * @param int $user_id The ID of the user from the 'users' table.
 */
function getUserHistory($conn, $user_id) {
    // This SQL query combines two separate SELECT statements into one result set.
    $sql = "
        -- First, select all currently borrowed books for the user
        SELECT 
            b.book_title,
            b.author,
            b.borrow_date,
            NULL AS return_date, -- There is no return_date yet for borrowed books
            'Borrowed' AS status,
            b.librarian_name
        FROM borrowed_books b
        -- Here we assume the user's login ID is used as the student_id
        WHERE b.student_id = ? 

        UNION ALL -- Combines the two result sets

        -- Second, select all returned books for the user
        SELECT 
            r.book_title,
            r.author,
            r.borrow_date,
            r.return_date,
            'Returned' AS status,
            NULL AS librarian_name -- returned_books table has no librarian
        FROM returned_books r
        WHERE r.student_id = ?

        -- Order the final combined list by the most recent action
        ORDER BY borrow_date DESC;
    ";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        echo json_encode(['success' => false, 'message' => 'Database query preparation failed: ' . $conn->error]);
        return;
    }

    // Bind the same user_id to both '?' placeholders
    $stmt->bind_param("ss", $user_id, $user_id);
    
    $stmt->execute();
    $result = $stmt->get_result();
    $history = $result->fetch_all(MYSQLI_ASSOC);

    echo json_encode(['success' => true, 'history' => $history]);

    $stmt->close();
}

$conn->close();
?>