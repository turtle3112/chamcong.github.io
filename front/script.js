document.addEventListener('DOMContentLoaded', () => {
    const currentMonthElement = document.getElementById('currentMonth');
    const daysContainer = document.getElementById('days');
    const prevMonthButton = document.getElementById('prevMonth');
    const nextMonthButton = document.getElementById('nextMonth');
    const noteArea = document.getElementById('noteArea');
    const noteInput = document.getElementById('noteInput');
    const saveNoteBtn = document.getElementById('saveNoteBtn');
    const notedDaysTableBody = document.getElementById('notedDaysTable').querySelector('tbody');
    const datePicker = document.getElementById('selectedDate');

    const userId = 'user123'; // **Quan trọng:** Thay thế bằng cách lấy userId thực tế
    const API_URL = 'http://localhost:5000/notes'; // URL của backend API

    let currentDate = new Date();
    let selectedDate = null;
    let notes = {}; // Lưu trữ tạm thời ghi chú ở frontend

    // Hàm để lấy ghi chú từ backend
    async function fetchNotes() {
        try {
            const response = await fetch(`${API_URL}/${userId}`);
            const data = await response.json();
            const fetchedNotes = {};
            data.forEach(note => {
                fetchedNotes[note.date] = { note: note.note };
            });
            notes = fetchedNotes;
            renderCalendar();
            renderNotedDaysTable();
        } catch (error) {
            console.error('Lỗi khi lấy ghi chú:', error);
        }
    }

    // Hàm để lưu ghi chú lên backend
    async function saveNoteToBackend(date, noteContent) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ date: formatDate(date), note: noteContent, userId: userId }),
            });
            if (response.ok) {
                fetchNotes(); // Lấy lại dữ liệu mới nhất từ backend
            } else {
                console.error('Lỗi khi lưu ghi chú:', response.status);
            }
        } catch (error) {
            console.error('Lỗi khi gửi yêu cầu lưu ghi chú:', error);
        }
    }

    // Hàm để cập nhật ghi chú trên backend
    async function updateNoteOnBackend(date, noteContent) {
        try {
            const response = await fetch(`${API_URL}/${formatDate(date)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ note: noteContent, userId: userId }),
            });
            if (response.ok) {
                fetchNotes();
            } else {
                console.error('Lỗi khi cập nhật ghi chú:', response.status);
            }
        } catch (error) {
            console.error('Lỗi khi gửi yêu cầu cập nhật ghi chú:', error);
        }
    }

    // Hàm để xóa ghi chú trên backend
    async function deleteNoteOnBackend(date) {
        try {
            const response = await fetch(`${API_URL}/${formatDate(date)}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: userId }),
            });
            if (response.ok) {
                fetchNotes();
            } else {
                console.error('Lỗi khi xóa ghi chú:', response.status);
            }
        } catch (error) {
            console.error('Lỗi khi gửi yêu cầu xóa ghi chú:', error);
        }
    }

    function renderCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
        const prevMonthLastDay = new Date(year, month, 0).getDate();

        currentMonthElement.textContent = `Tháng ${month + 1} ${year}`;
        daysContainer.innerHTML = '';

        // Ngày của tháng trước
        for (let i = 0; i < firstDayOfMonth; i++) {
            const dayNumber = prevMonthLastDay - firstDayOfMonth + i + 1;
            const dayElement = document.createElement('div');
            dayElement.textContent = dayNumber;
            dayElement.classList.add('prev-month-day');
            daysContainer.appendChild(dayElement);
        }

        // Ngày của tháng hiện tại
        for (let i = 1; i <= lastDayOfMonth; i++) {
            const dayElement = document.createElement('div');
            dayElement.textContent = i;
            const date = new Date(year, month, i);
            const dateString = formatDate(date);

            if (isToday(date)) {
                dayElement.classList.add('today');
            }
            if (selectedDate && isSameDate(date, selectedDate)) {
                dayElement.classList.add('selected');
            }
            if (notes[dateString]) {
                dayElement.classList.add('has-note'); // Thêm class để đánh dấu ngày có note
            }

            dayElement.addEventListener('click', () => {
                selectDate(date);
            });
            daysContainer.appendChild(dayElement);
        }

        // Ngày của tháng sau
        const daysAfter = 42 - firstDayOfMonth - lastDayOfMonth;
        for (let i = 1; i <= daysAfter; i++) {
            const dayElement = document.createElement('div');
            dayElement.textContent = i;
            dayElement.classList.add('next-month-day');
            daysContainer.appendChild(dayElement);
        }
    }

    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }

    function isSameDate(date1, date2) {
        return date1.getDate() === date2.getDate() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getFullYear() === date2.getFullYear();
    }

    function selectDate(date) {
        selectedDate = date;
        renderCalendar(); // Re-render để cập nhật trạng thái selected
        loadNoteForDate(date);
    }

    function loadNoteForDate(date) {
        const dateString = formatDate(date);
        const noteData = notes[dateString];
        if (noteData) {
            noteArea.textContent = noteData.note || 'Không có ghi chú.';
            noteInput.value = noteData.note || '';
        } else {
            noteArea.textContent = 'Không có ghi chú.';
            noteInput.value = '';
        }
    }

    function saveNote() {
        if (!selectedDate) {
            alert('Vui lòng chọn một ngày trên lịch.');
            return;
        }

        const note = noteInput.value.trim();
        saveNoteToBackend(selectedDate, note);
    }

    function renderNotedDaysTable() {
        notedDaysTableBody.innerHTML = '';
        const sortedNotes = Object.entries(notes).sort((a, b) => new Date(a[0]) - new Date(b[0])); // Sắp xếp theo ngày

        sortedNotes.forEach(([date, data]) => {
            const row = notedDaysTableBody.insertRow();
            const dateCell = row.insertCell();
            const noteCell = row.insertCell();
            const actionsCell = row.insertCell();

            const formattedDate = new Date(date).toLocaleDateString();
            dateCell.textContent = formattedDate;
            noteCell.textContent = data.note;

            const editButton = document.createElement('button');
            editButton.textContent = 'Sửa';
            editButton.classList.add('edit-btn');
            editButton.addEventListener('click', () => editNote(date));

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Xóa';
            deleteButton.classList.add('delete-btn');
            deleteButton.addEventListener('click', () => deleteNote(date));

            actionsCell.appendChild(editButton);
            actionsCell.appendChild(deleteButton);
        });
    }

    function editNote(date) {
        const dateObj = new Date(date);
        selectDate(dateObj); // Chọn ngày trên lịch để hiển thị ghi chú
    }

    function deleteNote(date) {
        if (confirm('Bạn có chắc chắn muốn xóa ghi chú cho ngày này?')) {
            deleteNoteOnBackend(date);
            if (selectedDate && formatDate(selectedDate) === date) {
                // Nếu đang xem ghi chú của ngày vừa xóa, clear note area
                noteArea.textContent = 'Không có ghi chú.';
                noteInput.value = '';
                selectedDate = null;
            }
        }
    }

    prevMonthButton.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
        if (selectedDate && currentDate.getMonth() !== selectedDate.getMonth()) {
            selectedDate = null;
            loadNoteForDate(null);
            renderCalendar();
        }
    });

    nextMonthButton.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
        if (selectedDate && currentDate.getMonth() !== selectedDate.getMonth()) {
            selectedDate = null;
            loadNoteForDate(null);
            renderCalendar();
        }
    });

    saveNoteBtn.addEventListener('click', saveNote);

    // Lắng nghe sự kiện thay đổi trên bộ chọn ngày
    datePicker.addEventListener('change', (event) => {
        const selectedDateFromPicker = new Date(event.target.value);
        currentDate = selectedDateFromPicker;
        renderCalendar();
        selectDate(selectedDateFromPicker);
    });

    // Gọi fetchNotes và render lịch ban đầu
    fetchNotes();
    renderCalendar();
});