document.addEventListener('DOMContentLoaded', function() {

  // --- Configuration ---
  // This should match a `student_id` in your database.
  // In a real app, this ID would come from a user's login session.
  const LOGGED_IN_USER_ID = '200119'; // Example: Fetches history for this user ID.

  // --- Element References ---
  const tableBody = document.querySelector('#accountTable tbody');
  const accountTable = document.getElementById('accountTable');
  const loader = document.getElementById('loader');
  const emptyMessage = document.getElementById('emptyMessage');
  const historyCounter = document.getElementById('historyCounter');

  /**
   * Fetches the complete transaction history for the logged-in user.
   */
  async function fetchUserHistory() {
    loader.style.display = 'block';
    accountTable.style.display = 'none';
    emptyMessage.style.display = 'none';

    try {
      // Correct path: Go UP one level from /frontend, then into /backend.
      const response = await fetch(`../backend/account_manager.php?action=get_user_history&user_id=${LOGGED_IN_USER_ID}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();

      loader.style.display = 'none';

      if (data.success && data.history.length > 0) {
        populateHistoryTable(data.history);
        historyCounter.textContent = data.history.length;
        accountTable.style.display = 'table';
      } else {
        emptyMessage.style.display = 'flex'; 
        historyCounter.textContent = 0;
      }
    } catch (error) {
      console.error("Failed to fetch user history:", error);
      loader.style.display = 'none';
      emptyMessage.innerHTML = '<span>⚠️</span><p>Could not load your history. Please try again later.</p>';
      emptyMessage.style.display = 'flex';
    }
  }

  /**
   * Populates the HTML table with combined transaction data.
   * @param {Array<Object>} history - An array of history objects.
   */
  function populateHistoryTable(history) {
    tableBody.innerHTML = ''; 

    const headers = ["Title", "Author", "Date Borrowed", "Date Returned", "Status"];

    history.forEach(item => {
      const row = tableBody.insertRow();
      
      const historyData = [
          item.book_title,
          item.author,
          new Date(item.borrow_date).toLocaleString(),
          item.return_date ? new Date(item.return_date).toLocaleString() : 'N/A', // Show N/A if not returned
          item.status
      ];
      
      historyData.forEach((data, index) => {
        let cell = row.insertCell(index);
        cell.setAttribute('data-label', headers[index]); 

        // If this is the status column, create a styled badge
        if (headers[index] === 'Status') {
          const statusSpan = document.createElement('span');
          statusSpan.textContent = data;
          statusSpan.className = `status-badge status-${data.toLowerCase()}`;
          cell.appendChild(statusSpan);
        } else {
          cell.textContent = data;
        }
      });
    });
  }

  // --- Initial Execution ---
  fetchUserHistory();
});