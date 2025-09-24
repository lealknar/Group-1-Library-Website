document.addEventListener('DOMContentLoaded', () => {

    /* --- DOM Element References --- */
    const tbody = document.querySelector('#bookTable tbody');
    const bookTableElement = document.getElementById('bookTable');
    const noBooks = document.getElementById('noBooks');
    const notification = document.getElementById('notification');
    const searchInput = document.getElementById('searchInput');
    const applyBtn = document.getElementById('applyFilter');
    const clearBtn = document.getElementById('clearFilter');
    const sortSelect = document.getElementById('sort');
    const genreSelect = document.getElementById('genre');
    const dateFromInput = document.getElementById('dateFrom');
    const dateToInput = document.getElementById('dateTo');
    const addBooksBtn = document.querySelector('.add-books-btn');
    const addBookModal = document.getElementById('addBookModal');
    const newBookSave = document.getElementById('newBookSave');
    const newBookCancel = document.getElementById('newBookCancel');
    const borrowModal = document.getElementById('borrowBookModal');
    const borrowSave = document.getElementById('borrowSave');
    const borrowCancel = document.getElementById('borrowCancel');
    const toggleRemove = document.getElementById('toggleRemove');
    const validationModal = document.getElementById('validationModal');
    const validationOk = document.getElementById('validationOk');

    const BOOK_MANAGER_API = '../backend/book_manager.php';
    const ADD_BOOK_API = '../backend/add_book.php';

    let currentBorrowRow = null;
    let removeMode = false;

    /* --- Helper Functions --- */
    function showNotification(msg, isError = false) {
        notification.innerText = msg;
        notification.style.backgroundColor = isError ? '#B22222' : '#28a745';
        notification.classList.add('show');
        setTimeout(() => notification.classList.remove('show'), 3000);
    }

    function showValidationModal(title, message) {
        document.getElementById('validationTitle').textContent = title;
        document.getElementById('validationMessage').textContent = message;
        validationModal.style.display = 'flex';
    }

    function escapeHtml(text) {
        if (text === null || text === undefined) return '';
        return String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#x27;'}[c]));
    }

    function renderBooks(books = []) {
        tbody.innerHTML = '';
        if (books.length === 0) {
            bookTableElement.style.display = 'none';
            noBooks.style.display = 'block';
            return;
        }

        bookTableElement.style.display = '';
        noBooks.style.display = 'none';
        
        const showBorrowed = sortSelect.value === "Most Borrowed Books";
        document.querySelectorAll("th.borrowed, td.borrowed").forEach(el => el.style.display = showBorrowed ? "" : "none");

        books.forEach(book => {
            const row = document.createElement('tr');
            row.setAttribute('data-book-id', book.book_id);

            row.innerHTML = `
                <td>${escapeHtml(book.name_of_book)}</td>
                <td>${escapeHtml(book.author)}</td>
                <td class="quantity">${book.quantity}</td>
                <td>${escapeHtml(book.genre)}</td>
                <td class="borrowed" style="display:${showBorrowed ? '' : 'none'};">${book.borrowed_count || 0}</td>
                <td class="book-actions">
                    <button class="add-btn" ${book.quantity <= 0 ? 'disabled' : ''} title="Borrow this book">Borrow</button>
                    <button class="bookmark-btn" data-book-id="${book.book_id}" title="Bookmark this book">🔖</button>
                    ${removeMode ? `<button class="remove-row-btn" data-book-id="${book.book_id}">Remove</button>` : ''}
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async function fetchAndRenderBooks() {
        const params = new URLSearchParams({
            action: 'get_books',
            search: searchInput.value,
            genre: genreSelect.value,
            sort: sortSelect.value,
            dateFrom: dateFromInput.value,
            dateTo: dateToInput.value,
        });

        try {
            const response = await fetch(`${BOOK_MANAGER_API}?${params.toString()}`);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            
            const data = await response.json();
            if (data.success) {
                renderBooks(data.books);
            } else {
                showNotification(data.message || 'Could not fetch books.', true);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            showNotification('An error occurred while fetching books from the server.', true);
        }
    }

    /* --- NEW BOOKMARK FUNCTION --- */
    async function handleBookmark(bookId, buttonElement) {
        // NOTE: In a real application, you would get the user ID from a server-side session.
        // We will hardcode a user ID of 1 for this demonstration.
        const userId = 1; 

        try {
            const response = await fetch(BOOK_MANAGER_API, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    action: 'bookmark_book',
                    book_id: bookId,
                    user_id: userId
                })
            });

            const data = await response.json();
            showNotification(data.message, !data.success);

        } catch (error) {
            console.error('Bookmark error:', error);
            showNotification('Could not connect to the server to update bookmark.', true);
        }
    }

    /* --- Event Listeners --- */
    addBooksBtn.addEventListener('click', () => {
        document.getElementById('addBookForm').reset();
        addBookModal.style.display = 'flex';
    });

    newBookSave.addEventListener('click', async () => {
        const bookData = {
            name: document.getElementById('newBookName').value.trim(),
            author: document.getElementById('newBookAuthor').value.trim(),
            quantity: parseInt(document.getElementById('newBookQuantity').value, 10),
            publication_year: document.getElementById('newBookYear').value.trim(),
            genre: document.getElementById('newBookGenre').value.trim() || 'Unknown',
            librarian_name: document.getElementById('librarianNameAdd').value.trim()
        };

        if (!bookData.name || !bookData.author || !bookData.quantity || bookData.quantity <= 0 || !bookData.librarian_name) {
            showValidationModal('Missing Information', 'Please fill in all required fields, including Librarian Name.');
            return;
        }

        try {
            // Assumes your add_book.php is ready to receive librarian_name
            const response = await fetch(ADD_BOOK_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookData)
            });
            const result = await response.json();

            if (result.success) {
                showNotification(result.message);
                addBookModal.style.display = 'none';
                fetchAndRenderBooks();
            } else {
                showValidationModal('Error Saving Book', result.message || 'An unknown error occurred.');
            }
        } catch (error) {
            showValidationModal('Network Error', 'Could not connect to the server to add the book.');
        }
    });

    toggleRemove.addEventListener('click', () => {
        removeMode = !removeMode;
        toggleRemove.style.opacity = removeMode ? '1' : '0.85';
        fetchAndRenderBooks();
    });

    applyBtn.addEventListener('click', fetchAndRenderBooks);
    searchInput.addEventListener('input', fetchAndRenderBooks);
    clearBtn.addEventListener('click', () => {
        document.getElementById('filterForm').reset();
        searchInput.value = '';
        fetchAndRenderBooks();
    });

    tbody.addEventListener('click', async (e) => {
        const bookRow = e.target.closest('tr');
        if (!bookRow) return;
        const bookId = bookRow.dataset.bookId;

        if (e.target.matches('.add-btn')) {
            currentBorrowRow = bookRow;
            document.getElementById('borrowName').value = bookRow.cells[0].innerText;
            document.getElementById('borrowAuthor').value = bookRow.cells[1].innerText;
            document.getElementById('borrowGenre').value = bookRow.cells[3].innerText;
            document.getElementById('borrowCurrent').value = new Date().toISOString().split('T')[0];
            document.getElementById('borrowDue').value = '';
            document.getElementById('borrowId').value = '';
            document.getElementById('librarianNameBorrow').value = '';
            borrowModal.style.display = 'flex';
        }

        if (e.target.matches('.bookmark-btn')) {
            handleBookmark(bookId, e.target);
        }

        if (e.target.matches('.remove-row-btn')) {
            if (confirm(`Are you sure you want to permanently delete "${bookRow.cells[0].innerText}"?`)) {
                 try {
                    const response = await fetch(BOOK_MANAGER_API, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ action: 'remove_book', book_id: bookId })
                    });
                    const data = await response.json();
                    showNotification(data.message, !data.success);
                    if (data.success) fetchAndRenderBooks();
                } catch (error) {
                    showNotification('Error removing book.', true);
                }
            }
        }
    });
    
    borrowSave.addEventListener('click', async () => {
        if (!currentBorrowRow) return;
        
        const borrowDetails = {
            action: 'borrow_book',
            book_id: currentBorrowRow.dataset.bookId,
            account_id: document.getElementById('borrowId').value.trim(),
            due_date: document.getElementById('borrowDue').value.trim(),
            librarian_name: document.getElementById('librarianNameBorrow').value.trim()
        };

        if (!borrowDetails.account_id || !borrowDetails.due_date || !borrowDetails.librarian_name) {
            showValidationModal('Missing Information', 'Please provide Student ID, due date, and librarian name.');
            return;
        }
        
        try {
            const response = await fetch(BOOK_MANAGER_API, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(borrowDetails)
            });
            const data = await response.json();
            if (data.success) {
                showNotification(data.message);
                borrowModal.style.display = 'none';
                fetchAndRenderBooks();
            } else {
                showValidationModal('Borrow Failed', data.message);
            }
        } catch (error) {
            showValidationModal('Network Error', 'Could not process the borrow request.');
        }
    });

    /* --- Modal Closing Logic --- */
    newBookCancel.addEventListener('click', () => addBookModal.style.display = 'none');
    borrowCancel.addEventListener('click', () => borrowModal.style.display = 'none');
    validationOk.addEventListener('click', () => validationModal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === addBookModal) addBookModal.style.display = 'none';
        if (e.target === borrowModal) borrowModal.style.display = 'none';
        if (e.target === validationModal) validationModal.style.display = 'none';
    });

    fetchAndRenderBooks();
});