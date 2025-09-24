<?php
// backend/borrow_manager.php

session_start();
header('Content-Type: application/json');
require_once("db_connection.php");

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Authentication required. Please log in.']);
    exit;
}
$user_id = $_SESSION['user_id']; // Use user_id from session

// Determine action for both GET and POST (JSON) requests
$action = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    $action = $data->action ?? '';
} else {
    $action = $_REQUEST['action'] ?? '';
}


switch ($action) {
    case 'get_borrowed_books':
        getBorrowedBooks($conn);
        break;
    case 'return_book':
        returnBook($conn, $data);
        break;
    case 'get_bookmarked_books':
        getBookmarkedBooks($conn, $user_id); // Pass user_id
        break;
    case 'remove_bookmark':
        removeBookmark($conn, $user_id, $data); // Pass user_id
        break;
    case 'get_returned_books':
        getReturnedBooks($conn);
        break;
    default:
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid action specified.']);
        break;
}

function getBorrowedBooks($conn) {
    $sql = "SELECT borrow_id, book_id, book_title, author, genre, student_id, borrow_date, due_date, status FROM borrowed_books ORDER BY borrow_date DESC";
    try {
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $result = $stmt->get_result();
        $books = $result->fetch_all(MYSQLI_ASSOC);
        echo json_encode(['status' => 'success', 'data' => $books]);
    } catch (Exception $e) {
        http_response_code(500);
        error_log($e->getMessage());
        echo json_encode(['status' => 'error', 'message' => 'Database query failed.']);
    }
}

function returnBook($conn, $data) {
    $borrow_id = $data->borrow_id ?? null;
    if (!$borrow_id) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Borrow ID is required.']);
        return;
    }

    $conn->begin_transaction();
    try {
        $stmt_get_borrowed = $conn->prepare("SELECT * FROM borrowed_books WHERE borrow_id = ?");
        $stmt_get_borrowed->bind_param("i", $borrow_id);
        $stmt_get_borrowed->execute();
        $result = $stmt_get_borrowed->get_result();
        $borrowed_book = $result->fetch_assoc();

        if ($borrowed_book) {
            $book_id = $borrowed_book['book_id'];

            $stmt_insert_returned = $conn->prepare(
                "INSERT INTO returned_books (book_id, book_title, author, genre, student_id, borrow_date) VALUES (?, ?, ?, ?, ?, ?)"
            );
            $stmt_insert_returned->bind_param(
                "isssss",
                $book_id,
                $borrowed_book['book_title'],
                $borrowed_book['author'],
                $borrowed_book['genre'],
                $borrowed_book['student_id'],
                $borrowed_book['borrow_date']
            );
            $stmt_insert_returned->execute();

            $stmt_delete = $conn->prepare("DELETE FROM borrowed_books WHERE borrow_id = ?");
            $stmt_delete->bind_param("i", $borrow_id);
            $stmt_delete->execute();

            $stmt_update_qty = $conn->prepare("UPDATE books SET quantity = quantity + 1 WHERE book_id = ?");
            $stmt_update_qty->bind_param("i", $book_id);
            $stmt_update_qty->execute();
            
            $conn->commit();
            echo json_encode(['status' => 'success', 'message' => 'Book returned successfully.']);
        } else {
            throw new Exception("Borrowed record not found.");
        }

    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        error_log($e->getMessage());
        echo json_encode(['status' => 'error', 'message' => 'Failed to return the book.']);
    }
}

function getReturnedBooks($conn) {
    $sql = "SELECT return_id, book_title, author, student_id, borrow_date, return_date FROM returned_books ORDER BY return_date DESC";
    try {
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $result = $stmt->get_result();
        $books = $result->fetch_all(MYSQLI_ASSOC);
        echo json_encode(['status' => 'success', 'data' => $books]);
    } catch (Exception $e) {
        http_response_code(500);
        error_log($e->getMessage());
        echo json_encode(['status' => 'error', 'message' => 'Failed to fetch returned books history.']);
    }
}


function getBookmarkedBooks($conn, $user_id) {
    // This function now correctly fetches bookmarks for the logged-in user.
    $sql = "SELECT bm.bookmark_id, bk.name_of_book, bk.author, bk.genre 
            FROM bookmarks AS bm 
            JOIN books AS bk ON bm.book_id = bk.book_id 
            WHERE bm.user_id = ?";
    try {
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $books = $result->fetch_all(MYSQLI_ASSOC);
        echo json_encode(['status' => 'success', 'data' => $books]);
    } catch (Exception $e) {
        http_response_code(500);
        error_log("Bookmark Fetch Error: " . $e->getMessage());
        echo json_encode(['status' => 'error', 'message' => 'Failed to fetch bookmarks.']);
    }
}

function removeBookmark($conn, $user_id, $data) {
    // This function now correctly removes a bookmark for the logged-in user.
    $bookmark_id = $data->bookmark_id ?? null;
    if (!$bookmark_id) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Bookmark ID is required.']);
        return;
    }
    try {
        // We ensure that a user can only delete their own bookmarks
        $stmt = $conn->prepare("DELETE FROM bookmarks WHERE bookmark_id = ? AND user_id = ?");
        $stmt->bind_param("ii", $bookmark_id, $user_id);
        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            echo json_encode(['status' => 'success', 'message' => 'Bookmark removed.']);
        } else {
            // This case handles if someone tries to delete a bookmark that isn't theirs or doesn't exist.
            echo json_encode(['status' => 'error', 'message' => 'Bookmark not found or permission denied.']);
        }
    } catch (Exception $e) {
        http_response_code(500);
        error_log("Bookmark Remove Error: " . $e->getMessage());
        echo json_encode(['status' => 'error', 'message' => 'Failed to remove bookmark.']);
    }
}
?>