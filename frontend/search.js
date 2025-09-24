/* ========= All JS runs after DOM is ready ========= */
document.addEventListener('DOMContentLoaded', () => {

  /* --- DOM references --- */
  const tbody = document.querySelector('#bookTable tbody');
  const bookTableElement = document.getElementById('bookTable');
  const sortSelect = document.getElementById('sort');
  const applyBtn = document.getElementById('applyFilter');
  const clearBtn = document.getElementById('clearFilter');
  const searchInput = document.getElementById('searchInput');
  const noBooks = document.getElementById('noBooks');
  const genreSelect = document.getElementById('genre');
  const dateFromInput = document.getElementById('dateFrom');
  const dateToInput = document.getElementById('dateTo');
  const notification = document.getElementById('notification');
  const toggleRemove = document.getElementById('toggleRemove');

  const addBooksBtn = document.querySelector('.add-books-btn');
  const addBookModal = document.getElementById('addBookModal');
  const newBookCancel = document.getElementById('newBookCancel');
  const newBookSave = document.getElementById('newBookSave');

  const borrowModal = document.getElementById('borrowBookModal');
  const borrowId = document.getElementById('borrowId');
  const borrowName = document.getElementById('borrowName');
  const borrowAuthor = document.getElementById('borrowAuthor');
  const borrowGenre = document.getElementById('borrowGenre');
  const borrowCurrent = document.getElementById('borrowCurrent');
  const borrowDue = document.getElementById('borrowDue');
  const borrowCancel = document.getElementById('borrowCancel');
  const borrowSave = document.getElementById('borrowSave');

  // Professional validation modal elements
  const validationModal = document.getElementById('validationModal');
  const validationTitle = document.getElementById('validationTitle');
  const validationMessage = document.getElementById('validationMessage');
  const validationOk = document.getElementById('validationOk');

  // New: Borrowed Books notification elements
  const borrowedBooksLink = document.getElementById('borrowedBooksLink');
  const borrowedNotificationBadge = document.getElementById('borrowedNotificationBadge');

  const STORAGE_KEY = 'borrowedBooks'; // consistent storage key

  /* --- helpers --- */
  function showNotification(msg){
    notification.innerText = msg;
    notification.classList.add('show');
    setTimeout(()=> notification.classList.remove('show'), 2200);
  }

  // Professional validation notification
  function showValidationModal(title, message, focusElement = null) {
    validationTitle.textContent = title;
    validationMessage.textContent = message;
    validationModal.style.display = 'flex';

    // Store focus element for after modal closes
    validationModal.focusElement = focusElement;
  }

  // New: Show borrowed books header notification
  function showBorrowedNotification(){
    borrowedNotificationBadge.classList.add('show');
    // Hide after 3 seconds
    setTimeout(() => {
      borrowedNotificationBadge.classList.remove('show');
    }, 3000);
  }

  function loadList(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch(e){ return []; } }
  function saveList(list){ localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  /* ========= Filters / Search / State logic ========= */
  function applyFilters(){
    const searchVal = searchInput.value.toLowerCase();
    const genreVal = genreSelect.value.toLowerCase();
    const dateFrom = parseInt(dateFromInput.value) || 1800;
    const dateTo = parseInt(dateToInput.value) || 2025;

    const rows = Array.from(tbody.getElementsByTagName("tr"));
    let visibleCount = 0;

    rows.forEach(row => {
      const cols = row.getElementsByTagName("td");
      const title = (cols[0] && cols[0].innerText) ? cols[0].innerText.toLowerCase() : '';
      const author = (cols[1] && cols[1].innerText) ? cols[1].innerText.toLowerCase() : '';
      const genre = (cols[3] && cols[3].innerText) ? cols[3].innerText.toLowerCase() : '';
      const yearMatch = cols[0] && cols[0].innerText.match(/\((\d{4})\)/);
      const year = yearMatch ? parseInt(yearMatch[1]) : 0;

      const match = (title.includes(searchVal) || author.includes(searchVal)) &&
                    (genreVal === "all" || genre.includes(genreVal)) &&
                    (year >= dateFrom && year <= dateTo);

      row.style.display = match ? "" : "none";
      if(match){ visibleCount++; row.classList.add("fade-in-up"); }
    });

    noBooks.style.display = visibleCount === 0 ? "" : "none";

    const sortVal = sortSelect.value;
    if (sortVal === "Most Borrowed Books") {
      document.querySelectorAll("th.borrowed, td.borrowed").forEach(el => el.style.display = "");
      rows.sort((a,b) => parseInt(b.cells[4].innerText || 0) - parseInt(a.cells[4].innerText || 0));
    } else {
      document.querySelectorAll("th.borrowed, td.borrowed").forEach(el => el.style.display = "none");
      if(sortVal === "Title") rows.sort((a,b) => a.cells[0].innerText.localeCompare(b.cells[0].innerText));
      else if(sortVal === "Author") rows.sort((a,b) => a.cells[1].innerText.localeCompare(b.cells[1].innerText));
      else if(sortVal === "Newest-Oldest") rows.sort((a,b) => parseInt(b.cells[0].innerText.match(/\((\d{4})\)/)?.[1] || 0) - parseInt(a.cells[0].innerText.match(/\((\d{4})\)/)?.[1] || 0));
      else if(sortVal === "Oldest-Newest") rows.sort((a,b) => parseInt(a.cells[0].innerText.match(/\((\d{4})\)/)?.[1] || 0) - parseInt(b.cells[0].innerText.match(/\((\d{4})\)/)?.[1] || 0));
    }
    rows.forEach(r => tbody.appendChild(r));
  }

  function clearFilters(){
    searchInput.value = "";
    genreSelect.value = "All";
    sortSelect.value = "Relevance";
    dateFromInput.value = "";
    dateToInput.value = "";
    bookTableElement.classList.add("fade-out");
    setTimeout(()=> {
      bookTableElement.style.display = "none";
      noBooks.style.display = "";
      bookTableElement.classList.remove("fade-out");
    }, 600);
  }

  applyBtn.addEventListener('click', () => {
      bookTableElement.style.display = '';
      bookTableElement.classList.remove("fade-out");
      bookTableElement.style.opacity = "1";
      noBooks.style.display = 'none';
      applyFilters();
  });

  clearBtn.addEventListener('click', clearFilters);

  searchInput.addEventListener('input', ()=>{
    if(searchInput.value.trim() === ""){
      bookTableElement.style.display = 'none';
      noBooks.style.display = '';
    } else {
      bookTableElement.style.display = '';
      bookTableElement.style.opacity = "1";
      noBooks.style.display = 'none';
      applyFilters();
    }
  });

  // Enforce 4-digit year in date filters
  function enforceFourDigitYear(event) {
      if (event.target.value.length > 4) {
          event.target.value = event.target.value.slice(0, 4);
      }
  }
  dateFromInput.addEventListener('input', enforceFourDigitYear);
  dateToInput.addEventListener('input', enforceFourDigitYear);

  window.addEventListener("beforeunload", () => {
    const state = {
      search: searchInput.value,
      sort: sortSelect.value,
      genre: genreSelect.value,
      dateFrom: dateFromInput.value,
      dateTo: dateToInput.value,
      hasResults: bookTableElement.style.display !== "none"
    };
    localStorage.setItem("searchPageState", JSON.stringify(state));
  });

  /* ========= Borrow / Bookmark / Remove / Modal logic ========= */

  function updateAddButtonState(row){
    if(!row) return;
    const qtyCell = row.querySelector('.quantity');
    const addBtn = row.querySelector('.add-btn');
    const qty = qtyCell ? (parseInt(qtyCell.innerText) || 0) : 0;
    if(addBtn){
      addBtn.disabled = qty <= 0;
      addBtn.title = addBtn.disabled ? 'No copies available' : '';
    }
  }

  function addBookRow(row, type='borrowed', dates){
    if(!row) return false;
    const cells = row.getElementsByTagName('td');
    const name = (cells[0] && cells[0].innerText.trim()) || '';
    const author = (cells[1] && cells[1].innerText.trim()) || '';
    const genre = (cells[3] && cells[3].innerText.trim()) || '';
    if(!name) return false;

    const list = loadList();

    if(type==='borrowed'){
      const idNumber = (dates && dates.idNumber) ? String(dates.idNumber).trim() : '';

      const exists = list.some(b =>
          b.type === 'borrowed' &&
          b.idNumber === idNumber &&
          b.name === name &&
          b.author === author
      );

      if (exists) {
          showNotification(`⚠️ The student already borrowed this book.`);
          return false;
      }

      const qtyCell = row.querySelector('.quantity');
      let quantity = parseInt(qtyCell.innerText) || 0;
      if(quantity <= 0){
        showNotification(`❌ No copies left for "${name}"`);
        return false;
      }

      quantity--;
      qtyCell.innerText = quantity;

      const borrowedCell = row.querySelector('td.borrowed');
      if(borrowedCell){
        const current = parseInt(borrowedCell.innerText) || 0;
        borrowedCell.innerText = current + 1;
      }

      const currentDate = (dates && dates.currentDate) ? dates.currentDate :
                          (new Date().toISOString().split('T')[0]);
      const dueDate = (dates && dates.dueDate) ? dates.dueDate : '';

      list.push({
        name,
        author,
        genre,
        type: 'borrowed',
        currentDate,
        dueDate,
        idNumber: idNumber,
        addedAt: new Date().toISOString()
      });
      saveList(list);
      showNotification(`✅ Borrowed "${name}"`);
      showBorrowedNotification();
      updateAddButtonState(row);
      return true;
    }

    if(type==='bookmarked' || type==='fav'){
      const exists = list.some(b => b.name===name && b.author===author && b.type==='bookmarked');
      if(exists){
        showNotification(`⚠️ "${name}" already in bookmarks`);
        return false;
      }
      list.push({ name, author, genre, type: 'bookmarked', addedAt: new Date().toISOString() });
      saveList(list);
      showNotification(`🔖 Added "${name}" to bookmarks`);
      return true;
    }

    return false;
  }

  let currentBorrowRow = null;

  tbody.addEventListener('click', (e) => {
    const addBtn = e.target.closest('.add-btn');
    if(addBtn){
      if(addBtn.disabled) return;

      const row = addBtn.closest('tr');
      if(!row) return;

      currentBorrowRow = row;
      const cells = row.getElementsByTagName('td');

      const qtyCell = row.querySelector('.quantity');
      const qty = qtyCell ? (parseInt(qtyCell.innerText) || 0) : 0;
      if(qty <= 0){
        showNotification(`❌ No copies left for this book`);
        currentBorrowRow = null;
        return;
      }

      borrowId.value = "";
      borrowName.value = cells[0].innerText.trim();
      borrowAuthor.value = cells[1].innerText.trim();
      borrowGenre.value = cells[3].innerText.trim();

      // Set min/max for due date picker to prevent invalid years
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];

      // Set max due date 5 years from now
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 5);
      const maxDateString = maxDate.toISOString().split('T')[0];

      borrowCurrent.value = todayString;
      borrowDue.value = "";
      borrowDue.min = todayString; // Prevent selecting past dates
      borrowDue.max = maxDateString; // Prevent selecting dates far in the future

      borrowModal.style.display = 'flex';
      return;
    }

    const favBtn = e.target.closest('.fav-btn');
    if(favBtn){
      const row = favBtn.closest('tr');
      addBookRow(row,'bookmarked');
      return;
    }

    const removeBtn = e.target.closest('.remove-row-btn');
    if(removeBtn){
      const row = removeBtn.closest('tr');
      const title = (row && row.cells[0] && row.cells[0].innerText) || 'book';
      row.remove();
      showNotification(`🗑️ Removed "${title}"`);
      if(tbody.querySelectorAll('tr').length === 0){
        bookTableElement.style.display = 'none';
        noBooks.style.display = '';
      }
      return;
    }
  });

  let removeMode = false;
  function setRemoveButtons(on){
    document.querySelectorAll('#bookTable tbody tr').forEach(row=>{
      const actions = row.querySelector('.book-actions');
      if(!actions) return;
      let existing = actions.querySelector('.remove-row-btn');
      if(on){
        if(!existing){
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'remove-row-btn';
          btn.innerText = 'Remove';
          actions.appendChild(btn);
        }
      } else {
        if(existing) existing.remove();
      }
    });
    if(toggleRemove) toggleRemove.style.opacity = on ? '1' : '0.85';
  }
  if(toggleRemove){
    toggleRemove.addEventListener('click', ()=>{
      removeMode = !removeMode;
      setRemoveButtons(removeMode);
    });
  }

  borrowCancel.addEventListener('click', () => {
    borrowModal.style.display = 'none';
    currentBorrowRow = null;
  });

  borrowSave.addEventListener('click', () => {
    if(!currentBorrowRow) return;

    const idValue = borrowId.value.trim();
    const dueDateValue = borrowDue.value.trim();

    if (!idValue && !dueDateValue) {
      showValidationModal('ID Number & Due Date Required', 'Please enter your ID number and select a due date.', borrowId);
      return;
    }
    if (!idValue) {
      showValidationModal('ID Number Required', 'Please enter your ID number to proceed.', borrowId);
      return;
    }
    if (!dueDateValue) {
      showValidationModal('Due Date Required', 'Please select a due date.', borrowDue);
      return;
    }

    const dates = {
      currentDate: borrowCurrent.value || new Date().toISOString().split('T')[0],
      dueDate: dueDateValue,
      idNumber: idValue
    };

    const ok = addBookRow(currentBorrowRow, 'borrowed', dates);

    if(ok){
      borrowModal.style.display = 'none';
      currentBorrowRow = null;
    }
  });

  validationOk.addEventListener('click', () => {
    validationModal.style.display = 'none';
    if (validationModal.focusElement) {
      validationModal.focusElement.focus();
      validationModal.focusElement = null;
    }
  });

  window.addEventListener('click', (e) => {
    if (e.target === validationModal) {
      validationModal.style.display = 'none';
      if (validationModal.focusElement) {
        validationModal.focusElement.focus();
        validationModal.focusElement = null;
      }
    }
    if(e.target === borrowModal){
      borrowModal.style.display = 'none';
      currentBorrowRow = null;
    }
    if(e.target === addBookModal){
      addBookModal.style.display = 'none';
    }
  });

  addBooksBtn && addBooksBtn.addEventListener('click', () => addBookModal.style.display = 'flex');
  newBookCancel && newBookCancel.addEventListener('click', () => addBookModal.style.display = 'none');

  newBookSave && newBookSave.addEventListener('click', () => {
    const name = document.getElementById('newBookName').value.trim();
    const author = document.getElementById('newBookAuthor').value.trim();
    const qtyVal = document.getElementById('newBookQuantity').value;
    const quantity = (qtyVal === '') ? 1 : parseInt(qtyVal);
    const genre = document.getElementById('newBookGenre').value.trim() || 'Unknown';

    if(!name || !author || !quantity){
      alert('Please fill in Name, Author and Quantity.');
      return;
    }

    const newRow = document.createElement('tr');
    newRow.innerHTML = `
      <td>${escapeHtml(name)}</td>
      <td>${escapeHtml(author)}</td>
      <td class="quantity">${quantity}</td>
      <td>${escapeHtml(genre)}</td>
      <td class="borrowed" style="display:none;">0</td>
      <td class="book-actions">
        <button class="add-btn">Add</button>
        <button class="fav-btn">🔖</button>
      </td>
    `;
    tbody.appendChild(newRow);

    if(removeMode){
      const actions = newRow.querySelector('.book-actions');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'remove-row-btn';
      btn.innerText = 'Remove';
      actions.appendChild(btn);
    }

    updateAddButtonState(newRow);
    bookTableElement.style.display = '';
    noBooks.style.display = 'none';
    showNotification(`✅ "${name}" added to the list`);
    document.getElementById('newBookName').value = '';
    document.getElementById('newBookAuthor').value = '';
    document.getElementById('newBookQuantity').value = 1;
    document.getElementById('newBookGenre').value = '';
    addBookModal.style.display = 'none';

    if(searchInput.value.trim() !== '' || sortSelect.value !== 'Relevance' || genreSelect.value !== 'All') {
      applyFilters();
    }
  });

  /* Initialize */
  document.querySelectorAll('#bookTable tbody tr').forEach(row => updateAddButtonState(row));

  (function restoreState(){
    const state = JSON.parse(localStorage.getItem("searchPageState") || "{}");
    searchInput.value = state.search || "";
    sortSelect.value = state.sort || "Relevance";
    genreSelect.value = state.genre || "All";
    dateFromInput.value = state.dateFrom || "";
    dateToInput.value = state.dateTo || "";

    if(state.hasResults && (searchInput.value || state.genre !== "All" || state.sort !== "Relevance" || state.dateFrom || state.dateTo)){
      bookTableElement.style.display = '';
      noBooks.style.display = 'none';
      applyFilters();
    } else {
      noBooks.style.display = "";
      bookTableElement.style.display = "none";
    }
  })();

}); // end DOMContentLoaded
