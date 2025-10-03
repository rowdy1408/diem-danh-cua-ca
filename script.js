document.addEventListener('DOMContentLoaded', () => {
    // --- KHAI BÁO BIẾN TOÀN CỤC VÀ LẤY CÁC PHẦN TỬ HTML ---
    const loginSection = document.getElementById('login-section');
    const mainSection = document.getElementById('main-section');
    
    const newClassView = document.getElementById('new-class-view');
    const classListView = document.getElementById('class-list-view');
    const attendanceView = document.getElementById('attendance-view');
    const salaryReportView = document.getElementById('salary-report-view');
    const allViews = [newClassView, classListView, attendanceView, salaryReportView];

    const btnAddClass = document.getElementById('btn-add-class');
    const btnAttendance = document.getElementById('btn-attendance');
    const btnSalaryReport = document.getElementById('btn-salary-report');

    const dayNamesShort = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const dayNamesFull = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

    let currentClassData = {};
    let currentAttendanceClass = null;
    let currentDisplayDate = new Date();

    // --- LOGIC ĐĂNG NHẬP (GIỮ NGUYÊN) ---
    (()=>{const e=document.getElementById("password-input"),t=document.getElementById("login-button"),n=document.getElementById("error-message"),a="30082025@NN",s=3,o=6e5;function i(){e.value===a?(localStorage.removeItem("loginAttempts"),localStorage.removeItem("lockoutUntil"),loginSection.classList.add("hidden"),mainSection.classList.remove("hidden")):l()}function l(){let e=parseInt(localStorage.getItem("loginAttempts")||"0");e++;const t=s-e;t>0?(n.textContent=`Sai rồi, nhập lại thôi. Còn ${t} lần nữa thôi.`,localStorage.setItem("loginAttempts",e)):(n.textContent=`Bạn đã nhập sai ${s} lần.`,r())}function r(){const e=Date.now()+o;localStorage.setItem("lockoutUntil",e),localStorage.setItem("loginAttempts","0"),c(),d(e)}function c(){e.disabled=!0,t.disabled=!0}function u(){e.disabled=!1,t.disabled=!1,e.value="",n.textContent=""}function d(e){const t=setInterval(()=>{const a=Date.now(),s=e-a;s<=0?(clearInterval(t),u(),n.textContent="Đã hết thời gian khóa. Bạn có thể thử lại."):(n.textContent=`Vui lòng thử lại sau ${Math.floor(s/1e3/60)} phút ${Math.floor(s/1e3%60)} giây.`)},1e3)}t.addEventListener("click",i),e.addEventListener("keydown",(e=>{event.key==="Enter"&&i()}));const m=parseInt(localStorage.getItem("lockoutUntil")||"0");Date.now()<m&&(c(),d(m))})();

    // --- HÀM TIỆN ÍCH ---
    const getArrayFromStorage = (key) => JSON.parse(localStorage.getItem(key) || '[]');
    const getObjectFromStorage = (key) => JSON.parse(localStorage.getItem(key) || '{}');
    const saveToStorage = (key, data) => localStorage.setItem(key, JSON.stringify(data));
    const showView = (viewToShow) => { allViews.forEach(view => view.classList.add('hidden')); if (viewToShow) { viewToShow.classList.remove('hidden'); } };

    // --- CHỨC NĂNG 1: THÊM LỚP MỚI ---
    (()=>{
        const newClassForm = document.getElementById('new-class-form');
        const classScheduleSelect = document.getElementById('class-schedule');
        const customScheduleGroup = document.getElementById('custom-schedule-group');
        const confirmationModal = document.getElementById('confirmation-modal');
        const modalTitle = confirmationModal.querySelector('h4');
        const modalBody = document.getElementById('modal-body');
        const confirmBtn = document.getElementById('confirm-create-class');
        const cancelBtn = document.getElementById('cancel-create-class');
        let confirmHandler = () => {};
        let cancelHandler = () => confirmationModal.classList.add('hidden');
        const showModal = (title, contentHTML, confirmText, cancelText, onConfirm) => { modalTitle.textContent = title; modalBody.innerHTML = contentHTML; confirmBtn.textContent = confirmText; cancelBtn.textContent = cancelText; confirmHandler = () => { onConfirm(); confirmationModal.classList.add('hidden'); }; confirmBtn.onclick = () => confirmHandler(); cancelBtn.onclick = () => cancelHandler(); confirmationModal.classList.remove('hidden'); };
        
        btnAddClass.addEventListener('click', () => showView(newClassView));
        classScheduleSelect.addEventListener('change', () => customScheduleGroup.classList.toggle('hidden', classScheduleSelect.value !== 'Khac'));
        newClassForm.addEventListener('submit', (e) => {
            e.preventDefault();
            let schedule = classScheduleSelect.value === 'Khac' ? document.getElementById('custom-schedule').value : classScheduleSelect.options[classScheduleSelect.selectedIndex].text;
            const salaryRateValue = document.getElementById('salary-rate').value;
            const cleanedSalaryRate = salaryRateValue.replace(/\./g, '');
            currentClassData = { 
                id: 'class-' + Date.now(), 
                studentName: document.getElementById('student-name').value, 
                classType: document.getElementById('class-type').value, 
                schedule, 
                scheduleCode: classScheduleSelect.value, 
                salaryRate: parseFloat(cleanedSalaryRate), 
                parentEmail: document.getElementById('parent-email').value,
                isActive: true
            };
            const content = `<p><strong>Tên học viên:</strong> ${currentClassData.studentName}</p><p><strong>Loại lớp:</strong> ${currentClassData.classType}</p><p><strong>Email P.Huynh:</strong> ${currentClassData.parentEmail || 'Chưa nhập'}</p><p><strong>Lịch học:</strong> ${currentClassData.schedule}</p><p><strong>Rate lương:</strong> ${currentClassData.salaryRate.toLocaleString('vi-VN')} vnđ/buổi</p>`;
            showModal('Xác nhận thông tin lớp học', content, 'Đúng hết rồi, tạo thôi!', 'Khoan, để check lại đã', () => {
                const classes = getArrayFromStorage('classes');
                classes.push(currentClassData);
                saveToStorage('classes', classes);
                alert(`Đã tạo lớp thành công!`);
                newClassForm.reset();
                showView(null);
            });
        });
        document.getElementById('cancel-add-class').addEventListener('click', () => { newClassForm.reset(); showView(null); });
        window.showModal = showModal;
    })();

    // --- CHỨC NĂNG 2: ĐIỂM DANH, LƯU TRỮ LỚP & COPY BÁO CÁO ---
    (()=>{
        const classListContainer = document.getElementById('class-list-container');
        const calendarGrid = document.getElementById('calendar-grid');
        const copyReportBtn = document.getElementById('copy-report-btn');

        btnAttendance.addEventListener('click', () => {
            classListContainer.innerHTML = '';
            const allClasses = getArrayFromStorage('classes');
            const activeClasses = allClasses.filter(cls => cls.isActive !== false);
            if (activeClasses.length === 0) {
                classListContainer.innerHTML = '<p>Chưa có lớp nào đang hoạt động.</p>';
            } else {
                activeClasses.forEach(cls => {
                    const wrapper = document.createElement('div');
                    wrapper.className = 'class-item-wrapper';
                    wrapper.innerHTML = `<button class="class-item-button" data-id="${cls.id}">${cls.studentName} - ${cls.classType || 'Lớp học'}</button><button class="delete-class-btn" data-id="${cls.id}" title="Lưu trữ lớp học">🗑️</button>`;
                    classListContainer.appendChild(wrapper);
                });
            }
            showView(classListView);
        });

        const handleArchiveClass = (classId) => {
            const classes = getArrayFromStorage('classes');
            const classToArchive = classes.find(c => c.id === classId);
            if (!classToArchive) return;
            if (confirm(`Bạn có chắc chắn muốn lưu trữ lớp của học viên "${classToArchive.studentName}" không?\nLớp sẽ bị ẩn đi nhưng dữ liệu cũ vẫn được giữ lại.`)) {
                classToArchive.isActive = false;
                saveToStorage('classes', classes);
                alert('Đã lưu trữ lớp thành công!');
                btnAttendance.click();
            }
        };

        classListContainer.addEventListener('click', (e) => {
            const classId = e.target.dataset.id;
            if (!classId) return;
            if (e.target.classList.contains('class-item-button')) {
                const classes = getArrayFromStorage('classes');
                const selectedClass = classes.find(c => c.id === classId);
                if (selectedClass) showAttendanceSheet(selectedClass);
            } else if (e.target.classList.contains('delete-class-btn')) {
                handleArchiveClass(classId);
            }
        });
        
        const renderCalendar = () => { 
            calendarGrid.innerHTML = ''; 
            const year = currentDisplayDate.getFullYear(), month = currentDisplayDate.getMonth();
            document.getElementById('month-display').textContent = `Tháng ${month + 1}, ${year}`; 
            const daysInMonth = new Date(year, month + 1, 0).getDate(); 
            const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
            for (let i = 0; i < firstDayIndex; i++) calendarGrid.insertAdjacentHTML('beforeend', '<div class="day-cell"></div>');
            
            const scheduleDays = parseSchedule(currentAttendanceClass.scheduleCode); 
            const attendanceData = getObjectFromStorage('attendance')[currentAttendanceClass.id] || {};
            
            for (let day = 1; day <= daysInMonth; day++) { 
                const date = new Date(year, month, day); 
                const dayOfWeek = date.getDay(); 
                const dateString = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`; 
                const isScheduled = scheduleDays.includes(dayOfWeek); 
                const attendanceEntry = attendanceData[dateString] || {};
                const status = attendanceEntry.status;
                
                let cellClass = 'day-cell'; 
                if (status === 'present') cellClass += ' present'; 
                if (status === 'absent') cellClass += ' absent'; 
                if (status === 'makeup') cellClass += ' makeup';
                
                const dateDisplayHTML = `<div class="date-wrapper"><div class="day-of-week">${dayNamesShort[dayOfWeek]}</div><div class="date-number">${day}</div></div>`;
                
                let controls = '';
                const hasBeenMarked = status === 'present' || status === 'absent';
                if ((isScheduled || status === 'makeup') && !hasBeenMarked) { 
                    if(!status) cellClass += ' scheduled'; 
                    controls = `<div class="attendance-controls" data-date="${dateString}"><span class="att-check" title="Có mặt">✅</span><span class="att-absent" title="Vắng">❌</span></div>`; 
                }

                let extraInfoHTML = '';
                if (attendanceEntry.noMakeup === true) {
                    extraInfoHTML = `<div class="no-makeup-info">Không bù</div>`;
                }

                const dayCellHTML = `<div class="${cellClass}">${dateDisplayHTML}${controls}${extraInfoHTML}</div>`; 
                calendarGrid.insertAdjacentHTML('beforeend', dayCellHTML); 
            } 
            updateMonthlyTotal();
        };

        calendarGrid.addEventListener('click', (e) => {
            const controls = e.target.closest('.attendance-controls'); 
            if (!controls) return; 
            const date = controls.dataset.date; 
            const allAttendance = getObjectFromStorage('attendance'); 
            if (!allAttendance[currentAttendanceClass.id]) allAttendance[currentAttendanceClass.id] = {};
            
            if (e.target.classList.contains('att-check')) { 
                allAttendance[currentAttendanceClass.id][date] = { status: 'present' };
            } else if (e.target.classList.contains('att-absent')) {
                const reason = prompt("Nhập lý do nghỉ học:");
                if (reason === null) return;

                const makeupDateStr = prompt("Nhập ngày dạy bù (YYYY-MM-DD) (Để trống nếu không có):", "");
                if (makeupDateStr === null) return;
                
                const absenceData = { status: 'absent', reason: reason || 'Không có lý do' };
                
                if (makeupDateStr && makeupDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) { 
                    allAttendance[currentAttendanceClass.id][makeupDateStr] = { status: 'makeup' }; 
                } else {
                    absenceData.noMakeup = true;
                }
                allAttendance[currentAttendanceClass.id][date] = absenceData;
            }
            saveToStorage('attendance', allAttendance); 
            renderCalendar();
        });

        copyReportBtn.addEventListener('click', () => {
            if (!currentAttendanceClass) return;
            const year = currentDisplayDate.getFullYear(), month = currentDisplayDate.getMonth() + 1;
            const classAttendance = getObjectFromStorage('attendance')[currentAttendanceClass.id] || {};
            
            const entries = Object.entries(classAttendance).filter(([date, data]) => date.startsWith(`${year}-${String(month).padStart(2,'0')}`));
            const presentDates = entries.filter(([date, data]) => data.status === 'present');
            const absentDates = entries.filter(([date, data]) => data.status === 'absent');

            const formatDates = (dateEntries, isAbsent = false) => {
                return dateEntries.sort().map(([dateStr, data]) => {
                    const parts = dateStr.split('-');
                    const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
                    const dayName = dayNamesFull[dateObj.getDay()];
                    const reason = isAbsent ? ` (Lý do: ${data.reason || 'Không rõ'})` : '';
                    return `\n- ${dayName}, ngày ${parts[2]}/${parts[1]}${reason}`;
                }).join('');
            };

            const formattedPresents = formatDates(presentDates);
            const formattedAbsents = formatDates(absentDates, true);
            const presentCount = presentDates.length;
            const totalAmount = presentCount * currentAttendanceClass.salaryRate;
            const studentName = currentAttendanceClass.studentName;

            let reportText = `Kính chào phụ huynh của bạn ${studentName},
Báo cáo học phí tháng ${month}/${year} của bé như sau:

- Tổng số buổi đã học: ${presentCount} buổi
- Chi tiết các ngày học:${formattedPresents || '\n- (Không có)'}
`;
            if (absentDates.length > 0) {
                reportText += `\n- Các ngày nghỉ:${formattedAbsents}\n`;
            }
            reportText += `\n- Học phí: ${totalAmount.toLocaleString('vi-VN')} vnđ

Kính mong phụ huynh chuyển khoản theo thông tin đã thỏa thuận.
Xin chân thành cảm ơn sự hợp tác của phụ huynh!`;
            
            const previewContent = `<textarea readonly>${reportText}</textarea>`;
            window.showModal('Xem Trước Báo Cáo', previewContent, 'Sao chép nội dung', 'Đóng', () => {
                navigator.clipboard.writeText(reportText).then(() => alert('Đã sao chép báo cáo vào bộ nhớ đệm!'));
            });
        });

        const updateMonthlyTotal = () => {
            const year = currentDisplayDate.getFullYear(), month = currentDisplayDate.getMonth() + 1;
            const classAttendance = getObjectFromStorage('attendance')[currentAttendanceClass.id] || {};
            let presentCount = 0;
            for (const date in classAttendance) {
                if (date.startsWith(`${year}-${String(month).padStart(2,'0')}`) && classAttendance[date].status === 'present') {
                    presentCount++;
                }
            }
            const total = presentCount * currentAttendanceClass.salaryRate;
            document.getElementById('monthly-salary-total').textContent = `${total.toLocaleString('vi-VN')} vnđ`;
        };
        
        const showAttendanceSheet = (classData) => { currentAttendanceClass = classData; currentDisplayDate = new Date(); document.getElementById('attendance-header').textContent = `Điểm danh lớp: ${classData.studentName}`; renderCalendar(); showView(attendanceView); };
        const parseSchedule = (code) => { const map = { T2:1, T3:2, T4:3, T5:4, T6:5, T7:6, CN:0 }; if (code === 'Khac' || !code) return []; return code.split('-').map(day => map[day]); };
        document.getElementById('prev-month-btn').onclick = () => { currentDisplayDate.setMonth(currentDisplayDate.getMonth() - 1); renderCalendar(); };
        document.getElementById('next-month-btn').onclick = () => { currentDisplayDate.setMonth(currentDisplayDate.getMonth() + 1); renderCalendar(); };
        document.getElementById('back-to-class-list').addEventListener('click', () => btnAttendance.click());
    })();
    
    // --- CHỨC NĂNG 3: BÁO CÁO LƯƠNG ---
    (()=>{
        const monthPicker = document.getElementById('report-month-picker');
        btnSalaryReport.addEventListener('click', () => { const now = new Date(); monthPicker.value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`; renderReport(); showView(salaryReportView); });
        monthPicker.addEventListener('change', renderReport); 
        
        function renderReport() {
            const [year, month] = monthPicker.value.split('-').map(Number);
            const classes = getArrayFromStorage('classes'); 
            const allAttendance = getObjectFromStorage('attendance'); 
            const reportContent = document.getElementById('report-content'); 
            reportContent.innerHTML = ''; let grandTotal = 0; 
            
            if (classes.length === 0) {
                reportContent.innerHTML = '<p>Không có dữ liệu để báo cáo.</p>';
                document.getElementById('grand-total-salary').textContent = '0 vnđ';
                return;
            }

            classes.forEach(cls => {
                const classAttendance = allAttendance[cls.id] || {};
                let presentCount = 0;
                for (const date in classAttendance) {
                    if (date.startsWith(`${year}-${String(month).padStart(2,'0')}`) && classAttendance[date].status === 'present') {
                        presentCount++;
                    }
                }

                if(presentCount > 0) {
                    const subTotal = presentCount * cls.salaryRate;
                    grandTotal += subTotal;
                    const statusTag = cls.isActive === false ? ' <small>(Đã lưu trữ)</small>' : '';
                    reportContent.innerHTML += `<div class="report-item"><span><strong>${cls.studentName}</strong>${statusTag} (${presentCount} buổi)</span><span>${subTotal.toLocaleString('vi-VN')} vnđ</span></div>`;
                }
            });
            document.getElementById('grand-total-salary').textContent = `${grandTotal.toLocaleString('vi-VN')} vnđ`;
        }
    })();
});