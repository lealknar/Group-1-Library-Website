const STORAGE_KEY = 'borrowedBooks';
const borrowedTable = document.getElementById('borrowedTable');
const borrowedTbody = borrowedTable.querySelector('tbody');
const bookmarkedTable = document.getElementById('bookmarkedTable');
const bookmarkedTbody = bookmarkedTable.querySelector('tbody');
const emptyMessage = document.getElementById('emptyMessage');
const tabs = document.querySelectorAll('.tab');
const notification = document.getElementById('notification');
const borrowedCounter = document.getElementById('borrowedCounter');

function showNotification(message, type = "success") {
  notification.textContent = message;
  notification.className = `notification show ${type}`;
  setTimeout(() => notification.classList.remove('show'), 1800);
}

function updateBorrowedCounter() {
  const list = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  const count = list.filter(b => b.type === 'borrowed').length;
  borrowedCounter.textContent = count;
}

function setEmptyUI(type) {
  emptyMessage.style.display = 'flex';
  emptyMessage.querySelector('span').textContent = (type === 'borrowed') ? '😴' : '📑';
  emptyMessage.querySelector('p').textContent =
    (type === 'borrowed') ? 'No borrowed books yet...' : 'No bookmarked books yet...';
}

function toggleEmptyMessage(count, type) {
  if (type === 'borrowed') {
    if (count === 0) {
      borrowedTable.style.display = 'none';
      setEmptyUI('borrowed');
    } else {
      emptyMessage.style.display = 'none';
      borrowedTable.style.display = 'table';
    }
  } else {
    if (count === 0) {
      bookmarkedTable.style.display = 'none';
      setEmptyUI('bookmarked');
    } else {
      emptyMessage.style.display = 'none';
      bookmarkedTable.style.display = 'table';
    }
  }
}

function getCurrentDate() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

function extractIdFromRecord(book) {
  if (!book || typeof book !== 'object') return null;
  const tryKeys = ['id','ID','idNumber','id_number','IDNumber','ID Number','studentId','student_id','borrowerId','borrower_id','userId','user_id','memberId','member_id'];
  for (const k of tryKeys) {
    if (Object.prototype.hasOwnProperty.call(book, k)) {
      const v = book[k];
      if (v !== undefined && v !== null && String(v).trim() !== '') return String(v);
    }
  }
  if (book.user && (book.user.id || book.user.ID)) return String(book.user.id || book.user.ID);
  if (book.borrower && (book.borrower.id || book.borrower.ID)) return String(book.borrower.id || book.borrower.ID);
  for (const k in book) {
    if (/id/i.test(k)) {
      const v = book[k];
      if (v !== undefined && v !== null && String(v).trim() !== '') return String(v);
    }
  }
  const name = book.name || '';
  const m = String(name).match(/\bID[:\s-]*([A-Za-z0-9\-_.]+)/i);
  if (m && m[1]) return m[1];
  return null;
}

function loadBorrowedBooks() {
  const list = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  borrowedTbody.innerHTML = '';
  const items = list.filter(b => b && b.type === 'borrowed');

  items.forEach(book => {
    const tr = document.createElement('tr');
    if (book.addedAt) tr.dataset.addedAt = book.addedAt;

    const idVal = extractIdFromRecord(book);
    const idDisplay = idVal !== null ? idVal : '(no ID)';

    const currentDate = (book.currentDate && String(book.currentDate).trim() !== '') ? book.currentDate : getCurrentDate();
    const dueDate = book.dueDate || '';

    tr.innerHTML = `
      <td>${idDisplay}</td>
      <td>${book.name || ''}</td>
      <td>${book.author || ''}</td>
      <td>${book.genre || ''}</td>
      <td>${currentDate}</td>
      <td>${dueDate}</td>
      <td class="status-cell">
        <span class="status-text">Borrowed</span>
        <div class="status-buttons">
          <button class="add-btn">Add</button>
          <button class="return-btn">Return</button>
        </div>
      </td>
    `;
    borrowedTbody.appendChild(tr);
  });

  toggleEmptyMessage(items.length, 'borrowed');
  updateBorrowedCounter();
}

function loadBookmarkedBooks() {
  const list = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  bookmarkedTbody.innerHTML = '';
  const items = list.filter(b => b && b.type === 'bookmarked');

  items.forEach(book => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${book.name || ''}</td>
      <td>${book.author || ''}</td>
      <td>${book.genre || ''}</td>
      <td class="bookmarked-status-cell">
        <span class="status-text">Bookmarked</span>
        <button class="remove-btn">Remove</button>
      </td>
    `;
    bookmarkedTbody.appendChild(tr);
  });

  toggleEmptyMessage(items.length, 'bookmarked');
}

borrowedTbody.addEventListener('click', e => {
  if (e.target.classList.contains('return-btn')) {
    const row = e.target.closest('tr');
    const addedAt = row.dataset.addedAt || null;
    const name = (row.cells[1] && row.cells[1].textContent.trim()) || '';
    const author = (row.cells[2] && row.cells[2].textContent.trim()) || '';
    const currentDate = (row.cells[4] && row.cells[4].textContent.trim()) || '';
    const dueDate = (row.cells[5] && row.cells[5].textContent.trim()) || '';

    let list = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    if (addedAt) {
      list = list.filter(b => !(b.addedAt === addedAt && b.type === 'borrowed'));
    } else {
      list = list.filter(b => !(b.name === name && b.author === author && ( (b.currentDate || '') === currentDate ) && ( (b.dueDate || '') === dueDate ) && b.type === 'borrowed'));
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    row.remove();
    toggleEmptyMessage(borrowedTbody.rows.length, 'borrowed');
    showNotification(`"${name}" has been returned.`, 'success');
    updateBorrowedCounter();
  }

  if (e.target.classList.contains('add-btn')) {
    showNotification('Add button clicked!', 'success');
  }
});

bookmarkedTbody.addEventListener('click', e => {
  if (!e.target.classList.contains('remove-btn')) return;
  const row = e.target.closest('tr');
  const name = row.cells[0].textContent;
  const author = row.cells[1].textContent;

  let list = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  list = list.filter(b => !(b.name === name && b.author === author && b.type === 'bookmarked'));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

  row.remove();
  toggleEmptyMessage(bookmarkedTbody.rows.length, 'bookmarked');
  showNotification(`"${name}" removed from bookmarks.`, 'error');
});

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    if (tab.dataset.target === 'borrowed') {
      bookmarkedTable.style.display = 'none';
      loadBorrowedBooks();
    } else {
      borrowedTable.style.display = 'none';
      loadBookmarkedBooks();
    }
  });
});

window.addEventListener('DOMContentLoaded', () => {
  loadBorrowedBooks();
  bookmarkedTable.style.display = 'none';
});