document.addEventListener('DOMContentLoaded', () => {
    // =================================================================
    // === DÁN FIREBASE CONFIG CỦA BẠN VÀO ĐÂY ===
    // =================================================================
    const firebaseConfig = {
         apiKey: "AIzaSyBlTjj_-WdZBpLqixox2rmt-kbHdPs8Kh8",
  authDomain: "quanlylophoc-5b945.firebaseapp.com",
  projectId: "quanlylophoc-5b945",
  storageBucket: "quanlylophoc-5b945.firebasestorage.app",
  messagingSenderId: "38123679904",
  appId: "1:38123679904:web:b27668ed199dc16f43d9c5"
    };
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    // =================================================================

// --- KHAI BÁO BIẾN & LẤY PHẦN TỬ HTML ---
    const loginSection = document.getElementById('login-section'); const mainSection = document.getElementById('main-section'); const newClassView = document.getElementById('new-class-view'); const classListView = document.getElementById('class-list-view'); const attendanceView = document.getElementById('attendance-view'); const salaryReportView = document.getElementById('salary-report-view'); const allViews = [newClassView, classListView, attendanceView, salaryReportView]; const btnAddClass = document.getElementById('btn-add-class'); const btnAttendance = document.getElementById('btn-attendance'); const btnSalaryReport = document.getElementById('btn-salary-report'); const dayNamesShort = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]; const dayNamesFull = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"]; let currentAttendanceClass = null; let currentDisplayDate = new Date(); let unsubscribeClassesListener = null;

    // --- LOGIC ĐĂNG NHẬP (GIỮ NGUYÊN) ---
    (()=>{const e=document.getElementById("password-input"),t=document.getElementById("login-button"),n=document.getElementById("error-message"),a="30082025@NN",s=3,o=6e5;function i(){e.value===a?(localStorage.removeItem("loginAttempts"),localStorage.removeItem("lockoutUntil"),loginSection.classList.add("hidden"),mainSection.classList.remove("hidden")):l()}function l(){let e=parseInt(localStorage.getItem("loginAttempts")||"0");e++;const t=s-e;t>0?(n.textContent=`Sai rồi, nhập lại thôi. Còn ${t} lần nữa thôi.`,localStorage.setItem("loginAttempts",e)):(n.textContent=`Bạn đã nhập sai ${s} lần.`,r())}function r(){const e=Date.now()+o;localStorage.setItem("lockoutUntil",e),localStorage.setItem("loginAttempts","0"),c(),d(e)}function c(){e.disabled=!0,t.disabled=!0}function u(){e.disabled=!1,t.disabled=!1,e.value="",n.textContent=""}function d(e){const t=setInterval(()=>{const a=Date.now(),s=e-a;s<=0?(clearInterval(t),u(),n.textContent="Đã hết thời gian khóa. Bạn có thể thử lại."):(n.textContent=`Vui lòng thử lại sau ${Math.floor(s/1e3/60)} phút ${Math.floor(s/1e3%60)} giây.`)},1e3)}t.addEventListener("click",i),e.addEventListener("keydown",(e=>{event.key==="Enter"&&i()}));const m=parseInt(localStorage.getItem("lockoutUntil")||"0");Date.now()<m&&(c(),d(m))})();

    // --- HÀM TIỆN ÍCH ---
    const showView = (viewToShow) => { if (unsubscribeClassesListener) { unsubscribeClassesListener(); unsubscribeClassesListener = null; } allViews.forEach(view => view.classList.add('hidden')); if (viewToShow) viewToShow.classList.remove('hidden'); };

    // --- CHỨC NĂNG 1: THÊM LỚP MỚI ---
    (()=>{
        const newClassForm = document.getElementById('new-class-form'); const classScheduleSelect = document.getElementById('class-schedule'); const customScheduleGroup = document.getElementById('custom-schedule-group'); const confirmationModal = document.getElementById('confirmation-modal'); const modalTitle = confirmationModal.querySelector('h4'); const modalBody = document.getElementById('modal-body'); const confirmBtn = document.getElementById('confirm-create-class'); const cancelBtn = document.getElementById('cancel-create-class'); let confirmHandler = () => {}; let cancelHandler = () => confirmationModal.classList.add('hidden');
        const showModal = (title, contentHTML, confirmText, cancelText, onConfirm) => { modalTitle.textContent = title; modalBody.innerHTML = contentHTML; confirmBtn.textContent = confirmText; cancelBtn.textContent = cancelText; confirmHandler = () => { onConfirm(); }; confirmBtn.onclick = () => confirmHandler(); cancelBtn.onclick = () => {cancelHandler(); confirmationModal.classList.add('hidden'); }; confirmationModal.classList.remove('hidden'); };
        btnAddClass.addEventListener('click', () => showView(newClassView));
        classScheduleSelect.addEventListener('change', () => customScheduleGroup.classList.toggle('hidden', classScheduleSelect.value !== 'Khac'));
        newClassForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const salaryRateValue = document.getElementById('salary-rate').value;
            const cleanedSalaryRate = salaryRateValue.replace(/\./g, '');
            const newClassData = { studentName: document.getElementById('student-name').value, classType: document.getElementById('class-type').value, schedule: classScheduleSelect.value === 'Khac' ? document.getElementById('custom-schedule').value : classScheduleSelect.options[classScheduleSelect.selectedIndex].text, scheduleCode: classScheduleSelect.value, salaryRate: parseFloat(cleanedSalaryRate), parentEmail: document.getElementById('parent-email').value, isActive: true };
            const content = `<p><strong>Tên học viên:</strong> ${newClassData.studentName}</p><p><strong>Rate lương:</strong> ${newClassData.salaryRate.toLocaleString('vi-VN')} vnđ/buổi</p>`;
            showModal('Xác nhận thông tin lớp học', content, 'Đúng hết rồi, tạo thôi!', 'Khoan, để check lại đã', async () => {
                try {
                    await db.collection('classes').add(newClassData);
                    alert(`Đã tạo lớp thành công!`);
                    newClassForm.reset();
                    showView(null);
                    confirmationModal.classList.add('hidden');
                } catch (error) { console.error("Lỗi khi thêm lớp: ", error); alert("Đã có lỗi xảy ra."); }
            });
        });
        document.getElementById('cancel-add-class').addEventListener('click', () => { newClassForm.reset(); showView(null); });
        window.showModal = showModal;
    })();

    // --- CHỨC NĂNG 2: ĐIỂM DANH, LƯU TRỮ, COPY BÁO CÁO ---
    (()=>{
        const classListContainer = document.getElementById('class-list-container'); const calendarGrid = document.getElementById('calendar-grid'); const copyReportBtn = document.getElementById('copy-report-btn');
        btnAttendance.addEventListener('click', () => {
            showView(classListView);
            unsubscribeClassesListener = db.collection('classes').where("isActive", "==", true).onSnapshot(snapshot => {
                classListContainer.innerHTML = '';
                if (snapshot.empty) { classListContainer.innerHTML = '<p>Chưa có lớp nào đang hoạt động.</p>'; return; }
                const classes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                classes.forEach(cls => {
                    const wrapper = document.createElement('div');
                    wrapper.className = 'class-item-wrapper';
                    wrapper.innerHTML = `<button class="class-item-button" data-id="${cls.id}">${cls.studentName} - ${cls.classType || 'Lớp học'}</button><button class="delete-class-btn" data-id="${cls.id}" title="Lưu trữ lớp học">🗑️</button>`;
                    classListContainer.appendChild(wrapper);
                });
            }, error => console.error("Lỗi lắng nghe danh sách lớp: ", error));
        });
        const handleArchiveClass = async (classId) => { if (confirm(`Bạn có chắc chắn muốn lưu trữ lớp này không?`)) { try { await db.collection('classes').doc(classId).update({ isActive: false }); alert('Đã lưu trữ lớp thành công!'); } catch(e) { console.error(e); alert('Lỗi khi lưu trữ!');}} };
        classListContainer.addEventListener('click', async (e) => { const classId = e.target.dataset.id; if (!classId) return; if (e.target.classList.contains('class-item-button')) { const doc = await db.collection('classes').doc(classId).get(); if (doc.exists) showAttendanceSheet({ id: doc.id, ...doc.data() }); } else if (e.target.classList.contains('delete-class-btn')) { handleArchiveClass(classId); } });
        const renderCalendar = async () => { 
            calendarGrid.innerHTML = ''; const year = currentDisplayDate.getFullYear(), month = currentDisplayDate.getMonth(); document.getElementById('month-display').textContent = `Tháng ${month + 1}, ${year}`; const daysInMonth = new Date(year, month + 1, 0).getDate(); const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; for (let i = 0; i < firstDayIndex; i++) calendarGrid.insertAdjacentHTML('beforeend', '<div class="day-cell"></div>');
            const attendanceDoc = await db.collection('attendance').doc(currentAttendanceClass.id).get();
            const attendanceData = attendanceDoc.exists ? attendanceDoc.data() : {};
            const scheduleDays = parseSchedule(currentAttendanceClass.scheduleCode); 
            for (let day = 1; day <= daysInMonth; day++) { 
                const date = new Date(year, month, day); const dayOfWeek = date.getDay(); const dateString = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`; const isScheduled = scheduleDays.includes(dayOfWeek); const attendanceEntry = attendanceData[dateString] || {}; const status = attendanceEntry.status; let cellClass = 'day-cell'; if (status === 'present') cellClass += ' present'; if (status === 'absent') cellClass += ' absent'; if (status === 'makeup') cellClass += ' makeup';
                const dateDisplayHTML = `<div class="date-wrapper"><div class="day-of-week">${dayNamesShort[dayOfWeek]}</div><div class="date-number">${day}</div></div>`;
                let controls = ''; const hasBeenMarked = status === 'present' || status === 'absent';
                if ((isScheduled || status === 'makeup') && !hasBeenMarked) { if(!status) cellClass += ' scheduled'; controls = `<div class="attendance-controls" data-date="${dateString}"><span class="att-check" title="Có mặt">✅</span><span class="att-absent" title="Vắng">❌</span></div>`; }
                let extraInfoHTML = ''; if (attendanceEntry.noMakeup === true) { extraInfoHTML = `<div class="no-makeup-info">Không bù</div>`; }
                const dayCellHTML = `<div class="${cellClass}">${dateDisplayHTML}${controls}${extraInfoHTML}</div>`; calendarGrid.insertAdjacentHTML('beforeend', dayCellHTML); 
            } 
            updateMonthlyTotal(attendanceData);
        };
        calendarGrid.addEventListener('click', async (e) => {
            const controls = e.target.closest('.attendance-controls'); if (!controls) return;
            const date = controls.dataset.date;
            const attendanceRef = db.collection('attendance').doc(currentAttendanceClass.id);
            if (e.target.classList.contains('att-check')) {
                await attendanceRef.set({ [date]: { status: 'present' } }, { merge: true });
            } else if (e.target.classList.contains('att-absent')) {
                const reason = prompt("Nhập lý do nghỉ học:"); if (reason === null) return;
                const makeupDateStr = prompt("Nhập ngày dạy bù (YYYY-MM-DD) (Để trống nếu không có):", ""); if (makeupDateStr === null) return;
                const absenceData = { status: 'absent', reason: reason || 'Không có lý do' };
                if (makeupDateStr && makeupDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    await attendanceRef.set({ [makeupDateStr]: { status: 'makeup' } }, { merge: true });
                } else { absenceData.noMakeup = true; }
                await attendanceRef.set({ [date]: absenceData }, { merge: true });
            }
            renderCalendar();
        });
        copyReportBtn.addEventListener('click', async () => {
            if (!currentAttendanceClass) return;
            const year = currentDisplayDate.getFullYear(), month = currentDisplayDate.getMonth() + 1;
            const attendanceDoc = await db.collection('attendance').doc(currentAttendanceClass.id).get();
            const classAttendance = attendanceDoc.exists ? attendanceDoc.data() : {};
            const entries = Object.entries(classAttendance).filter(([date, data]) => date.startsWith(`${year}-${String(month).padStart(2,'0')}`));
            const presentDates = entries.filter(([date, data]) => data.status === 'present');
            const absentDates = entries.filter(([date, data]) => data.status === 'absent');
            const formatDates = (dateEntries, isAbsent = false) => { return dateEntries.sort().map(([dateStr, data]) => { const parts = dateStr.split('-'); const dateObj = new Date(parts[0], parts[1] - 1, parts[2]); const dayName = dayNamesFull[dateObj.getDay()]; const reason = isAbsent ? ` (Lý do: ${data.reason || 'Không rõ'})` : ''; return `\n- ${dayName}, ngày ${parts[2]}/${parts[1]}${reason}`; }).join(''); };
            const formattedPresents = formatDates(presentDates); const formattedAbsents = formatDates(absentDates, true);
            const presentCount = presentDates.length; const totalAmount = presentCount * currentAttendanceClass.salaryRate; const studentName = currentAttendanceClass.studentName;
            let reportText = `Kính chào phụ huynh của bạn ${studentName},\nBáo cáo học phí tháng ${month}/${year} của bé như sau:\n\n- Tổng số buổi đã học: ${presentCount} buổi\n- Chi tiết các ngày học:${formattedPresents || '\n- (Không có)'}\n`;
            if (absentDates.length > 0) { reportText += `\n- Các ngày nghỉ:${formattedAbsents}\n`; }
            reportText += `\n- Học phí: ${totalAmount.toLocaleString('vi-VN')} vnđ\n\nKính mong phụ huynh chuyển khoản theo thông tin đã thỏa thuận.\nXin chân thành cảm ơn sự hợp tác của phụ huynh!`;
            const previewContent = `<textarea readonly>${reportText}</textarea>`;
            window.showModal('Xem Trước Báo Cáo', previewContent, 'Sao chép nội dung', 'Đóng', () => {
                navigator.clipboard.writeText(reportText).then(() => { alert('Đã sao chép báo cáo vào bộ nhớ đệm!'); confirmationModal.classList.add('hidden'); });
            });
        });
        const updateMonthlyTotal = (classAttendance) => { const year = currentDisplayDate.getFullYear(), month = currentDisplayDate.getMonth() + 1; let presentCount = 0; for (const date in classAttendance) { if (date.startsWith(`${year}-${String(month).padStart(2,'0')}`) && classAttendance[date].status === 'present') { presentCount++; } } const total = presentCount * currentAttendanceClass.salaryRate; document.getElementById('monthly-salary-total').textContent = `${total.toLocaleString('vi-VN')} vnđ`; };
        const showAttendanceSheet = (classData) => { currentAttendanceClass = classData; currentDisplayDate = new Date(); document.getElementById('attendance-header').textContent = `Điểm danh lớp: ${classData.studentName}`; renderCalendar(); showView(attendanceView); };
        const parseSchedule = (code) => { const map = { T2:1, T3:2, T4:3, T5:4, T6:5, T7:6, CN:0 }; if (code === 'Khac' || !code) return []; return code.split('-').map(day => map[day]); };
        document.getElementById('prev-month-btn').onclick = () => { currentDisplayDate.setMonth(currentDisplayDate.getMonth() - 1); renderCalendar(); };
        document.getElementById('next-month-btn').onclick = () => { currentDisplayDate.setMonth(currentDisplayDate.getMonth() + 1); renderCalendar(); };
        document.getElementById('back-to-class-list').addEventListener('click', () => btnAttendance.click());
    })();

    // --- CHỨC NĂNG 3: BÁO CÁO LƯƠNG ---
    (()=>{
        const monthPicker = document.getElementById('report-month-picker'); const reportContent = document.getElementById('report-content');
        btnSalaryReport.addEventListener('click', () => { const now = new Date(); monthPicker.value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`; renderReport(); showView(salaryReportView); });
        monthPicker.addEventListener('change', renderReport);
        reportContent.addEventListener('click', (e) => { if (e.target.classList.contains('hard-delete-btn')) handleHardDelete(e.target.dataset.id); });
        const handleHardDelete = async (classId) => {
            const classDoc = await db.collection('classes').doc(classId).get();
            if (!classDoc.exists) return;
            if (confirm(`HÀNH ĐỘNG NÀY KHÔNG THỂ HOÀN TÁC!\n\nBạn có chắc chắn muốn XÓA VĨNH VIỄN lớp của học viên "${classDoc.data().studentName}" không?`)) {
                try {
                    await db.collection('classes').doc(classId).delete();
                    await db.collection('attendance').doc(classId).delete();
                    alert('Đã xóa vĩnh viễn lớp học thành công!');
                    renderReport();
                } catch (e) { console.error(e); alert('Lỗi khi xóa!'); }
            }
        };
        async function renderReport() {
            const [year, month] = monthPicker.value.split('-').map(Number);
            const classesSnapshot = await db.collection('classes').get();
            const classes = classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            reportContent.innerHTML = ''; let grandTotal = 0;
            if (classes.length === 0) { reportContent.innerHTML = '<p>Không có dữ liệu.</p>'; document.getElementById('grand-total-salary').textContent = '0 vnđ'; return; }
            for (const cls of classes) {
                const attendanceDoc = await db.collection('attendance').doc(cls.id).get();
                const classAttendance = attendanceDoc.exists ? attendanceDoc.data() : {};
                let presentCount = 0;
                for (const date in classAttendance) {
                    if (date.startsWith(`${year}-${String(month).padStart(2,'0')}`) && classAttendance[date].status === 'present') presentCount++;
                }
                if (presentCount > 0 || cls.isActive === false) { // Also show archived classes even if they have 0 sessions in the current month
                    const subTotal = presentCount * cls.salaryRate;
                    grandTotal += subTotal;
                    const statusTag = cls.isActive === false ? ' <small>(Đã lưu trữ)</small>' : '';
                    reportContent.innerHTML += `<div class="report-item"><span><strong>${cls.studentName}</strong>${statusTag} (${presentCount} buổi)</span><div class="report-item-details"><span>${subTotal.toLocaleString('vi-VN')} vnđ</span><button class="hard-delete-btn" data-id="${cls.id}" title="Xóa vĩnh viễn">Xóa</button></div></div>`;
                }
            }
            document.getElementById('grand-total-salary').textContent = `${grandTotal.toLocaleString('vi-VN')} vnđ`;
        }
    })();
});
