document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const borrowedTable = document.getElementById('borrowedTable');
    const bookmarkedTable = document.getElementById('bookmarkedTable');
    const returnedTable = document.getElementById('returnedTable'); // New
    const borrowedTbody = borrowedTable.querySelector('tbody');
    const bookmarkedTbody = bookmarkedTable.querySelector('tbody');
    const returnedTbody = returnedTable.querySelector('tbody'); // New
    const emptyMessage = document.getElementById('emptyMessage');
    const notification = document.getElementById('notification');
    const tabs = document.querySelectorAll('.tab');
    const borrowedCounter = document.getElementById('borrowedCounter');

    const API_URL = '../backend/borrow_manager.php';

    // --- Helper Functions ---
    function showNotification(msg, isError = false) {
        notification.innerText = msg;
        notification.style.backgroundColor = isError ? '#B22222' : '#28a745';
        notification.classList.add('show');
        setTimeout(() => notification.classList.remove('show'), 3000);
    }

    function escapeHtml(text) {
        if (text === null || text === undefined) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // --- Render Functions ---
    function renderBorrowedBooks(books = []) {
        borrowedTbody.innerHTML = '';
        borrowedCounter.textContent = books.length;
        if (books.length === 0) {
            borrowedTable.style.display = 'none';
            emptyMessage.style.display = 'flex';
            emptyMessage.querySelector('p').textContent = 'No borrowed books yet...';
            return;
        }
        borrowedTable.style.display = 'table';
        emptyMessage.style.display = 'none';

        books.forEach(book => {
            const row = document.createElement('tr');
            row.setAttribute('data-borrow-id', book.borrow_id);
            const borrowDate = new Date(book.borrow_date).toLocaleDateString();
            const dueDate = new Date(book.due_date).toLocaleDateString();

            row.innerHTML = `
                <td data-label="Book Title">${escapeHtml(book.book_title)}</td>
                <td data-label="Author">${escapeHtml(book.author)}</td>
                <td data-label="Genre">${escapeHtml(book.genre)}</td>
                <td data-label="Student ID">${escapeHtml(book.student_id)}</td>
                <td data-label="Borrow Date">${borrowDate}</td>
                <td data-label="Due Date">${dueDate}</td>
                <td data-label="Status" class="status-cell">
                    <span class="status-text">${escapeHtml(book.status)}</span>
                    <div class="status-buttons">
                        <button class="return-btn">Return</button>
                    </div>
                </td>
            `;
            borrowedTbody.appendChild(row);
        });
    }

    function renderBookmarkedBooks(books = []) {
        bookmarkedTbody.innerHTML = '';
        if (books.length === 0) {
            bookmarkedTable.style.display = 'none';
            emptyMessage.style.display = 'flex';
            emptyMessage.querySelector('p').textContent = 'You have no bookmarked books.';
            return;
        }
        bookmarkedTable.style.display = 'table';
        emptyMessage.style.display = 'none';

        books.forEach(book => {
            const row = document.createElement('tr');
            row.setAttribute('data-bookmark-id', book.bookmark_id);
            row.innerHTML = `
                <td data-label="Name">${escapeHtml(book.name_of_book)}</td>
                <td data-label="Author">${escapeHtml(book.author)}</td>
                <td data-label="Genre">${escapeHtml(book.genre)}</td>
                <td data-label="Status" class="status-cell bookmarked-status-cell">
                    <span class="status-text">Bookmarked</span>
                    <div class="status-buttons">
                        <button class="remove-btn">Remove</button>
                    </div>
                </td>
            `;
            bookmarkedTbody.appendChild(row);
        });
    }

    // NEW: Function to render the returned books history
    function renderReturnedBooks(books = []) {
        returnedTbody.innerHTML = '';
        if (books.length === 0) {
            returnedTable.style.display = 'none';
            emptyMessage.style.display = 'flex';
            emptyMessage.querySelector('p').textContent = 'No books have been returned yet.';
            return;
        }
        returnedTable.style.display = 'table';
        emptyMessage.style.display = 'none';

        books.forEach(book => {
            const row = document.createElement('tr');
            const borrowDate = new Date(book.borrow_date).toLocaleDateString();
            const returnDate = new Date(book.return_date).toLocaleDateString();

            row.innerHTML = `
                <td data-label="Book Title">${escapeHtml(book.book_title)}</td>
                <td data-label="Author">${escapeHtml(book.author)}</td>
                <td data-label="Student ID">${escapeHtml(book.student_id)}</td>
                <td data-label="Borrow Date">${borrowDate}</td>
                <td data-label="Return Date">${returnDate}</td>
            `;
            returnedTbody.appendChild(row);
        });
    }


    // --- Data Fetching ---
    async function fetchAndRender(type = 'borrowed') {
        let action = '';
        switch(type) {
            case 'borrowed': action = 'get_borrowed_books'; break;
            case 'bookmarked': action = 'get_bookmarked_books'; break;
            case 'returned': action = 'get_returned_books'; break; // New
            default: return;
        }
        
        console.log(`Fetching data for: ${action}`);
        try {
            const response = await fetch(`${API_URL}?action=${action}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `HTTP error! Status: ${response.status}` }));
                throw new Error(errorData.message);
            }
            const result = await response.json();
            console.log('Received response from server:', result);

            if (result.status === 'success' && result.data) {
                if (type === 'borrowed') renderBorrowedBooks(result.data);
                else if (type === 'bookmarked') renderBookmarkedBooks(result.data);
                else if (type === 'returned') renderReturnedBooks(result.data); // New
            } else {
                showNotification(result.message || 'Received invalid data from server.', true);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            showNotification(error.message, true);
        }
    }

    // --- Event Handlers ---
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const target = tab.dataset.target;
            // Hide everything first
            borrowedTable.style.display = 'none';
            bookmarkedTable.style.display = 'none';
            returnedTable.style.display = 'none'; // New
            emptyMessage.style.display = 'none';

            fetchAndRender(target);
        });
    });

    document.body.addEventListener('click', async (e) => {
        if (e.target.classList.contains('return-btn')) {
            const row = e.target.closest('tr');
            const borrowId = row.dataset.borrowId;
            if (confirm('Are you sure you want to return this book?')) {
                try {
                    const response = await fetch(API_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'return_book', borrow_id: borrowId })
                    });
                    const result = await response.json();
                    showNotification(result.message, result.status !== 'success');
                    if (result.status === 'success') {
                        fetchAndRender('borrowed'); // Refresh the current tab
                    }
                } catch (error) {
                    showNotification('Failed to process the return request.', true);
                }
            }
        }

        if (e.target.classList.contains('remove-btn')) {
            const row = e.target.closest('tr');
            const bookmarkId = row.dataset.bookmarkId;
            if (confirm('Are you sure you want to remove this bookmark?')) {
                 try {
                    const response = await fetch(API_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'remove_bookmark', bookmark_id: bookmarkId })
                    });
                    const result = await response.json();
                    showNotification(result.message, result.status !== 'success');
                    if (result.status === 'success') {
                        fetchAndRender('bookmarked'); // Refresh the current tab
                    }
                } catch (error)
                 {
                    showNotification('Failed to remove bookmark.', true);
                }
            }
        }
    });

    // --- Initial Load ---
    bookmarkedTable.style.display = 'none';
    returnedTable.style.display = 'none';
    fetchAndRender('borrowed');
});