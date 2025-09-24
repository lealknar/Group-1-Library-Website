<?php
// backend/book_manager.php

header('Content-Type: application/json');
require_once("db_connection.php"); // Ensure you have your DB connection file

$action = $_GET['action'] ?? '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $action = $data['action'] ?? '';
}

switch ($action) {
    case 'get_books':
        getBooks($conn);
        break;
    case 'borrow_book':
        borrowBook($conn, $data);
        break;
    case 'remove_book':
        removeBook($conn, $data);
        break;
    case 'bookmark_book':
        bookmarkBook($conn, $data);
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid or missing action.']);
        break;
}

function getBooks($conn) {
    $search = $_GET['search'] ?? '';
    $genre = $_GET['genre'] ?? 'All';
    $sort = $_GET['sort'] ?? 'Relevance';
    $dateFrom = $_GET['dateFrom'] ?? '';
    $dateTo = $_GET['dateTo'] ?? '';

    $sql = "SELECT b.*, (SELECT COUNT(*) FROM borrowed_books WHERE book_id = b.book_id) as borrowed_count FROM books b WHERE 1=1";
    $params = [];
    $types = '';

    if (!empty($search)) {
        $sql .= " AND (b.name_of_book LIKE ? OR b.author LIKE ?)";
        $searchTerm = "%{$search}%";
        array_push($params, $searchTerm, $searchTerm);
        $types .= 'ss';
    }
    if ($genre !== 'All' && !empty($genre)) {
        $sql .= " AND b.genre = ?";
        $params[] = $genre;
        $types .= 's';
    }
    if (!empty($dateFrom)) {
        $sql .= " AND b.publication_year >= ?";
        $params[] = $dateFrom;
        $types .= 'i';
    }
    if (!empty($dateTo)) {
        $sql .= " AND b.publication_year <= ?";
        $params[] = $dateTo;
        $types .= 'i';
    }
    
    switch ($sort) {
        case 'Title': $sql .= " ORDER BY b.name_of_book ASC"; break;
        case 'Author': $sql .= " ORDER BY b.author ASC"; break;
        case 'Most Borrowed Books': $sql .= " ORDER BY borrowed_count DESC"; break;
        case 'Newest-Oldest': $sql .= " ORDER BY b.publication_year DESC"; break;
        case 'Oldest-Newest': $sql .= " ORDER BY b.publication_year ASC"; break;
        default: break;
    }

    $stmt = $conn->prepare($sql);
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $result = $stmt->get_result();
    $books = $result->fetch_all(MYSQLI_ASSOC);

    echo json_encode(['success' => true, 'books' => $books]);
    $stmt->close();
}

function borrowBook($conn, $data) {
    $book_id = isset($data['book_id']) ? intval($data['book_id']) : null;
    $student_id = $data['account_id'] ?? null; 
    $due_date = $data['due_date'] ?? null;
    $librarian_name = $data['librarian_name'] ?? null;

    if (!$book_id || !$student_id || !$due_date || !$librarian_name) {
        echo json_encode(['success' => false, 'message' => 'Missing book ID, student ID, due date, or librarian name.']);
        return;
    }

    $conn->begin_transaction();
    try {
        $stmt_check = $conn->prepare("SELECT name_of_book, author, genre, quantity FROM books WHERE book_id = ? FOR UPDATE");
        $stmt_check->bind_param("i", $book_id);
        $stmt_check->execute();
        $book_result = $stmt_check->get_result()->fetch_assoc();
        
        if ($book_result && $book_result['quantity'] > 0) {
            $book_title = $book_result['name_of_book'];
            $author = $book_result['author'];
            $genre = $book_result['genre'];

            $stmt_update = $conn->prepare("UPDATE books SET quantity = quantity - 1 WHERE book_id = ?");
            $stmt_update->bind_param("i", $book_id);
            $stmt_update->execute();
            
            $stmt_insert = $conn->prepare(
                "INSERT INTO borrowed_books (book_id, student_id, due_date, book_title, author, genre, status, librarian_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
            );
            
            $status = 'borrowed';
            
            $stmt_insert->bind_param("isssssss", $book_id, $student_id, $due_date, $book_title, $author, $genre, $status, $librarian_name);
            $stmt_insert->execute();
            
            $conn->commit();
            echo json_encode(['success' => true, 'message' => 'Book borrowed successfully!']);
        } else {
            throw new Exception('No copies available or book not found.');
        }
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function bookmarkBook($conn, $data) {
    $book_id = isset($data['book_id']) ? intval($data['book_id']) : null;
    $user_id = isset($data['user_id']) ? intval($data['user_id']) : null;

    if (!$book_id || !$user_id) {
        echo json_encode(['success' => false, 'message' => 'Book ID and User ID are required.']);
        return;
    }

    $stmt_check = $conn->prepare("SELECT bookmark_id FROM bookmarks WHERE user_id = ? AND book_id = ?");
    $stmt_check->bind_param("ii", $user_id, $book_id);
    $stmt_check->execute();
    $result = $stmt_check->get_result();
    
    if ($result->num_rows > 0) {
        $stmt_delete = $conn->prepare("DELETE FROM bookmarks WHERE user_id = ? AND book_id = ?");
        $stmt_delete->bind_param("ii", $user_id, $book_id);
        if ($stmt_delete->execute()) {
            echo json_encode(['success' => true, 'message' => 'Bookmark removed.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to remove bookmark.']);
        }
    } else {
        $stmt_insert = $conn->prepare("INSERT INTO bookmarks (user_id, book_id) VALUES (?, ?)");
        $stmt_insert->bind_param("ii", $user_id, $book_id);
        if ($stmt_insert->execute()) {
            echo json_encode(['success' => true, 'message' => 'Bookmarked successfully!']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to add bookmark.']);
        }
    }
}

function removeBook($conn, $data) {
    $book_id = isset($data['book_id']) ? intval($data['book_id']) : null;
    if (!$book_id) {
        echo json_encode(['success' => false, 'message' => 'Book ID is required.']);
        return;
    }

    try {
        $stmt = $conn->prepare("DELETE FROM books WHERE book_id = ?");
        $stmt->bind_param("i", $book_id);
        if ($stmt->execute()) {
            $message = $stmt->affected_rows > 0 ? 'Book removed successfully.' : 'Book not found.';
            echo json_encode(['success' => $stmt->affected_rows > 0, 'message' => $message]);
        } else {
             throw new Exception('Failed to remove the book.');
        }
    } catch (Exception $e) {
         echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

$conn->close();
?>