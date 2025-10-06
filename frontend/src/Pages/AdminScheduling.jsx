import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useExportPDF from '../hooks/useExportPDF';
import '../styles/AdminScheduling.css';

const Schedule = () => {
    const role = localStorage.getItem("role");
    const userId = localStorage.getItem("userId");
    const { exportToPDF } = useExportPDF();

    // Constants
    const daysOfWeek = [
        { value: 1, label: 'Monday' },
        { value: 2, label: 'Tuesday' },
        { value: 3, label: 'Wednesday' },
        { value: 4, label: 'Thursday' },
        { value: 5, label: 'Friday' }
    ];

    const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    const getMonday = (date = new Date()) => {
        const d = new Date(date);
        d.setDate(d.getDate() - d.getDay() + 1);
        return d.toISOString().split('T')[0];
    };

    const INITIAL_FORM = { slot_name: '', start_time: '', end_time: '', slot_order: '' };
    const INITIAL_SEMESTER_FORM = { semester_name: '', start_date: '', end_date: '' };

    // State
    const [timeSlots, setTimeSlots] = useState([]);
    const [classSections, setClassSections] = useState([]);
    const [courses, setCourses] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [allSchedules, setAllSchedules] = useState({});
    const [draftSchedules, setDraftSchedules] = useState({});
    const [selectedDay, setSelectedDay] = useState(1);
    const [selectedWeekStart, setSelectedWeekStart] = useState(getMonday());
    const [selectedSemester, setSelectedSemester] = useState('2024-25');
    const [semesters, setSemesters] = useState([]);
    const [showTimeslotEditor, setShowTimeslotEditor] = useState(false);
    const [editingTimeslot, setEditingTimeslot] = useState(null);
    const [timeslotForm, setTimeslotForm] = useState(INITIAL_FORM);
    const [showSemesterEditor, setShowSemesterEditor] = useState(false);
    const [editingSemester, setEditingSemester] = useState(null);
    const [semesterForm, setSemesterForm] = useState(INITIAL_SEMESTER_FORM);
    const [personalSchedules, setPersonalSchedules] = useState([]);
    const [personalLoading, setPersonalLoading] = useState(true);
    const [schedulingMode, setSchedulingMode] = useState('single-day');
    const [selectedSection, setSelectedSection] = useState('');
    const [bulkScheduleDays, setBulkScheduleDays] = useState([1, 2, 3, 4, 5]);
    const [bulkScheduleData, setBulkScheduleData] = useState({});
    const [userInfo, setUserInfo] = useState(null);

    // Effects
    useEffect(() => {
        if (role === "admin") {
            fetchInitialData();
            fetchSemesters();
        }
    }, [role]);

    useEffect(() => {
        if (role === "admin") fetchAllSchedules();
    }, [selectedDay, selectedWeekStart, selectedSemester, role]);

    useEffect(() => {
        if (role !== "admin") fetchPersonalSchedule();
    }, [role, userId]);

    useEffect(() => {
        if (semesters.length > 0 && !semesters.some(s => s.value === selectedSemester)) {
            setSelectedSemester(semesters[0].value);
        }
    }, [semesters]);

    useEffect(() => {
        // When semester changes, set week start to first Monday of that semester
        const currentSemester = semesters.find(s => s.value === selectedSemester);
        if (currentSemester?.start_date) {
            const startDate = new Date(currentSemester.start_date);
            const dayOfWeek = startDate.getDay();
            const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7;
            const firstMonday = new Date(startDate);
            firstMonday.setDate(firstMonday.getDate() + daysUntilMonday);
            setSelectedWeekStart(firstMonday.toISOString().split('T')[0]);
        }
    }, [selectedSemester, semesters]);

    useEffect(() => {
        if (schedulingMode === 'bulk-grade' && selectedSection) {
            loadExistingBulkSchedules();
        }
    }, [selectedSection, selectedWeekStart, selectedSemester, bulkScheduleDays]);

    // API Calls
    const fetchPersonalSchedule = async () => {
        setPersonalLoading(true);
        try {
            const weekStart = getMonday();
            const isTeacher = role === "teacher";
            const scheduleUrl = `http://localhost:5000/api/scheduling/${isTeacher ? 'teacher-by-user' : 'student'}/${userId}/schedule?weekStart=${weekStart}`;
            const userInfoUrl = `http://localhost:5000/api/${isTeacher ? 'teachers' : 'students'}/user/${userId}`;

            const [scheduleResponse, userInfoResponse] = await Promise.all([
                axios.get(scheduleUrl),
                axios.get(userInfoUrl).catch(() => null)
            ]);

            setPersonalSchedules(scheduleResponse.data);
            if (userInfoResponse?.data) setUserInfo(userInfoResponse.data);
        } catch (error) {
            console.error("Error fetching personal schedule:", error);
        } finally {
            setPersonalLoading(false);
        }
    };

    const fetchInitialData = async () => {
        try {
            const [slotsRes, sectionsRes, coursesRes, teachersRes] = await Promise.all([
                axios.get('http://localhost:5000/api/scheduling/timeslots'),
                axios.get('http://localhost:5000/api/scheduling/sections'),
                axios.get('http://localhost:5000/api/scheduling/courses'),
                axios.get('http://localhost:5000/api/scheduling/teachers')
            ]);

            const filteredTimeSlots = slotsRes.data
                .filter(slot => !slot.slot_name.includes('Break') && !slot.slot_name.includes('Lunch'))
                .sort((a, b) => a.slot_order - b.slot_order);

            const sortedClassSections = sectionsRes.data.sort((a, b) => {
                const gradeA = parseInt(a.grade_level.replace('Grade ', ''));
                const gradeB = parseInt(b.grade_level.replace('Grade ', ''));
                return gradeA !== gradeB ? gradeA - gradeB : a.section_name.localeCompare(b.section_name);
            });

            setTimeSlots(filteredTimeSlots);
            setClassSections(sortedClassSections);
            setCourses(coursesRes.data);
            setTeachers(teachersRes.data);
        } catch (error) {
            console.error('Error fetching initial data:', error);
        }
    };

    const fetchSemesters = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/scheduling/semesters');
            setSemesters(response.data);
        } catch (error) {
            console.error('Error fetching semesters:', error);
        }
    };

    const fetchAllSchedules = async () => {
        try {
            const params = new URLSearchParams({ weekStart: selectedWeekStart, semester: selectedSemester });
            const response = await axios.get(`http://localhost:5000/api/scheduling/schedule/${selectedDay}?${params}`);
            const scheduleMap = {};
            response.data.forEach(item => {
                scheduleMap[`${item.class_section_id}-${item.time_slot_id}`] = item;
            });
            setAllSchedules(scheduleMap);
        } catch (error) {
            console.error('Error fetching schedules:', error);
        }
    };

    const loadExistingBulkSchedules = async () => {
        if (!selectedSection) return;

        try {
            const newBulkData = {};

            // Fetch schedules for each selected day
            for (const day of bulkScheduleDays) {
                const params = new URLSearchParams({
                    weekStart: selectedWeekStart,
                    semester: selectedSemester
                });
                const response = await axios.get(
                    `http://localhost:5000/api/scheduling/schedule/${day}?${params}`
                );

                // Filter schedules for the selected section
                response.data.forEach(schedule => {
                    if (schedule.class_section_id == selectedSection) {
                        const key = `${schedule.time_slot_id}-${day}`;
                        newBulkData[key] = {
                            course_id: schedule.course_id,
                            teacher_id: schedule.teacher_id
                        };
                    }
                });
            }

            setBulkScheduleData(newBulkData);
        } catch (error) {
            console.error('Error loading existing bulk schedules:', error);
            setBulkScheduleData({});
        }
    };

    // Helper Functions
    const validateScheduling = (sectionId, timeSlotId, courseId, teacherId) => {
        if (role !== "admin") return [];
        const allCurrentSchedules = [...Object.values(allSchedules), ...Object.values(draftSchedules)];
        const conflict = allCurrentSchedules.find(schedule =>
            schedule.teacher_id === teacherId &&
            schedule.time_slot_id === timeSlotId &&
            schedule.day_of_week === selectedDay &&
            schedule.class_section_id !== sectionId
        );
        if (conflict) {
            const section = classSections.find(cs => cs.id === conflict.class_section_id);
            return [`Teacher is already scheduled for ${section?.grade_level} ${section?.section_name} at this time`];
        }
        return [];
    };

    const getTeachersForSubject = (subject) => {
        return teachers.filter(teacher => {
            if (teacher.subjects && Array.isArray(teacher.subjects)) {
                return teacher.subjects.includes(subject);
            }
            return teacher.subject === subject;
        });
    };

    const getTeachersForCourse = (courseId) => {
        const course = courses.find(c => c.id == courseId);
        return course ? getTeachersForSubject(course.subject) : [];
    };


    const formatTime = (timeStr) => {
        if (!timeStr) return "—";
        const [hour, minute] = timeStr.split(':').map(Number);
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const generateSemesterWeeks = () => {
        const currentSemester = semesters.find(s => s.value === selectedSemester);
        if (!currentSemester?.start_date || !currentSemester?.end_date) {
            return [];
        }

        const weeks = [];
        const startDate = new Date(currentSemester.start_date);
        const endDate = new Date(currentSemester.end_date);

        // Find the first Monday on or after the start date
        let currentWeek = new Date(startDate);
        const dayOfWeek = currentWeek.getDay();
        const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7;
        currentWeek.setDate(currentWeek.getDate() + daysUntilMonday);

        // Collect all Mondays except the current selected one
        while (currentWeek <= endDate) {
            const weekStr = currentWeek.toISOString().split('T')[0];
            if (weekStr !== selectedWeekStart) weeks.push(weekStr);
            currentWeek.setDate(currentWeek.getDate() + 7);
        }
        return weeks;
    };

    const getAvailableMondaysForSemester = () => {
        const currentSemester = semesters.find(s => s.value === selectedSemester);
        if (!currentSemester?.start_date || !currentSemester?.end_date) {
            // Fallback if semester doesn't have dates
            return [];
        }

        const mondays = [];
        const startDate = new Date(currentSemester.start_date);
        const endDate = new Date(currentSemester.end_date);

        // Find the first Monday on or after the start date
        let currentMonday = new Date(startDate);
        const dayOfWeek = currentMonday.getDay();
        const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7;
        currentMonday.setDate(currentMonday.getDate() + daysUntilMonday);

        // Collect all Mondays in the semester
        while (currentMonday <= endDate) {
            mondays.push(currentMonday.toISOString().split('T')[0]);
            currentMonday.setDate(currentMonday.getDate() + 7);
        }

        return mondays;
    };

    // Handlers
    const handleCourseChange = (sectionId, timeSlotId, courseId) => {
        if (role !== "admin") return;
        const key = `${sectionId}-${timeSlotId}`;
        if (!courseId) {
            const { [key]: _, ...rest } = draftSchedules;
            setDraftSchedules(rest);
            return;
        }

        const course = courses.find(c => c.id == courseId);
        if (!course) return;

        const suitableTeachers = getTeachersForSubject(course.subject);
        if (suitableTeachers.length === 0) return;

        const selectedTeacher = suitableTeachers.find(teacher =>
            validateScheduling(sectionId, timeSlotId, courseId, teacher.id).length === 0
        );

        if (!selectedTeacher) {
            alert(`Scheduling Conflict!\n\nNo available teachers for ${course.subject} at this time slot.`);
            return;
        }

        const sectionData = classSections.find(s => s.id == sectionId);
        setDraftSchedules({
            ...draftSchedules,
            [key]: {
                class_section_id: sectionId,
                time_slot_id: timeSlotId,
                course_id: courseId,
                teacher_id: selectedTeacher.id,
                room_id: sectionData?.room_id,
                day_of_week: selectedDay,
                week_start_date: selectedWeekStart,
                semester: selectedSemester
            }
        });
    };

    const handleTeacherChange = (sectionId, timeSlotId, teacherId) => {
        if (role !== "admin" || !teacherId) return;
        const key = `${sectionId}-${timeSlotId}`;
        const currentEntry = draftSchedules[key] || allSchedules[key];
        if (!currentEntry?.course_id) return;

        const conflicts = validateScheduling(sectionId, timeSlotId, currentEntry.course_id, teacherId);
        if (conflicts.length > 0) {
            alert(`Scheduling Conflict!\n\n${conflicts.join('\n')}`);
            return;
        }

        setDraftSchedules({
            ...draftSchedules,
            [key]: {
                ...currentEntry,
                teacher_id: teacherId,
                class_section_id: sectionId,
                time_slot_id: timeSlotId,
                day_of_week: selectedDay,
                week_start_date: selectedWeekStart,
                semester: selectedSemester
            }
        });
    };

    const saveAllSchedules = async () => {
        if (role !== "admin" || Object.keys(draftSchedules).length === 0) return;
        try {
            await Promise.all(Object.values(draftSchedules).map(entry =>
                axios.post('http://localhost:5000/api/scheduling/schedule', entry)
            ));
            setDraftSchedules({});
            fetchAllSchedules();
        } catch (error) {
            console.error('Error saving schedules:', error);
        }
    };

    const copyDayToWeek = async () => {
        if (role !== "admin") return;
        try {
            const targetDays = daysOfWeek.filter(d => d.value !== selectedDay).map(d => d.value);
            await axios.post('http://localhost:5000/api/scheduling/schedule/copy-day-to-week', {
                from_day: selectedDay,
                to_days: targetDays,
                week_start_date: selectedWeekStart,
                semester: selectedSemester
            });
            fetchAllSchedules();
        } catch (error) {
            console.error('Error copying schedules:', error);
        }
    };

    const copyWeekToSemester = async () => {
        if (role !== "admin") return;
        try {
            const targetWeeks = generateSemesterWeeks();
            if (targetWeeks.length === 0) {
                alert('No target weeks found for this semester.');
                return;
            }
            if (!window.confirm(`This will copy the current week's schedule to ${targetWeeks.length} weeks in ${selectedSemester}. Continue?`)) return;

            await axios.post('http://localhost:5000/api/scheduling/schedule/copy-week-to-semester', {
                source_week_start: selectedWeekStart,
                semester: selectedSemester,
                target_weeks: targetWeeks
            });
            alert(`Successfully copied schedule to ${targetWeeks.length} weeks!`);
            fetchAllSchedules();
        } catch (error) {
            console.error('Error copying week to semester:', error);
            alert('Error copying schedule to semester. Please try again.');
        }
    };

    const openTimeslotEditor = (timeslot = null) => {
        if (role !== "admin") return;
        setEditingTimeslot(timeslot);
        setTimeslotForm(timeslot ? {
            slot_name: timeslot.slot_name,
            start_time: timeslot.start_time,
            end_time: timeslot.end_time,
            slot_order: timeslot.slot_order.toString()
        } : INITIAL_FORM);
        setShowTimeslotEditor(true);
    };

    const closeTimeslotEditor = () => {
        if (role !== "admin") return;
        setShowTimeslotEditor(false);
        setEditingTimeslot(null);
        setTimeslotForm(INITIAL_FORM);
    };

    const saveTimeslot = async () => {
        if (role !== "admin") return;
        try {
            const data = { ...timeslotForm, slot_order: parseInt(timeslotForm.slot_order) };
            const url = editingTimeslot
                ? `http://localhost:5000/api/scheduling/timeslots/${editingTimeslot.id}`
                : 'http://localhost:5000/api/scheduling/timeslots';
            await axios[editingTimeslot ? 'put' : 'post'](url, data);
            fetchInitialData();
            closeTimeslotEditor();
        } catch (error) {
            console.error('Error saving time slot:', error);
        }
    };

    const deleteTimeslot = async (timeslotId) => {
        if (role !== "admin" || !window.confirm('Are you sure?')) return;
        try {
            await axios.delete(`http://localhost:5000/api/scheduling/timeslots/${timeslotId}`);
            fetchInitialData();
        } catch (error) {
            console.error('Error deleting time slot:', error);
        }
    };

    const openSemesterEditor = (semester = null) => {
        if (role !== "admin") return;
        setEditingSemester(semester);
        setSemesterForm(semester ? {
            semester_name: semester.label || semester.value,
            start_date: semester.start_date || '',
            end_date: semester.end_date || ''
        } : INITIAL_SEMESTER_FORM);
        setShowSemesterEditor(true);
    };

    const closeSemesterEditor = () => {
        if (role !== "admin") return;
        setShowSemesterEditor(false);
        setEditingSemester(null);
        setSemesterForm(INITIAL_SEMESTER_FORM);
    };

    const saveSemester = async () => {
        if (role !== "admin") return;
        try {
            const url = editingSemester
                ? `http://localhost:5000/api/scheduling/semesters/${editingSemester.id}`
                : 'http://localhost:5000/api/scheduling/semesters';
            await axios[editingSemester ? 'put' : 'post'](url, semesterForm);
            fetchSemesters();
            closeSemesterEditor();
        } catch (error) {
            console.error('Error saving semester:', error);
            alert('Error saving semester: ' + (error.response?.data?.error || error.message));
        }
    };

    const deleteSemester = async (semesterId) => {
        if (role !== "admin" || !window.confirm('Are you sure you want to delete this semester?')) return;
        try {
            await axios.delete(`http://localhost:5000/api/scheduling/semesters/${semesterId}`);
            fetchSemesters();
        } catch (error) {
            console.error('Error deleting semester:', error);
            alert('Error deleting semester: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleBulkCourseChange = (timeSlotId, day, courseId) => {
        if (role !== "admin" || !selectedSection) return;
        const key = `${timeSlotId}-${day}`;
        const newData = { ...bulkScheduleData };
        if (!courseId) {
            delete newData[key];
        } else {
            newData[key] = { course_id: courseId, teacher_id: null };
        }
        setBulkScheduleData(newData);
    };

    const handleBulkTeacherChange = (timeSlotId, day, teacherId) => {
        if (role !== "admin" || !selectedSection) return;
        const key = `${timeSlotId}-${day}`;
        if (bulkScheduleData[key]) {
            setBulkScheduleData({
                ...bulkScheduleData,
                [key]: { ...bulkScheduleData[key], teacher_id: teacherId }
            });
        }
    };

    const saveBulkSchedule = async (applyToSemester = false) => {
        if (role !== "admin" || !selectedSection) return;
        const section = classSections.find(s => s.id == selectedSection);
        if (!section) {
            alert('Selected section not found.');
            return;
        }
        if (Object.keys(bulkScheduleData).length === 0) {
            alert('No schedule assignments to save. Please assign courses and teachers first.');
            return;
        }

        try {
            let targetWeeks = [selectedWeekStart];
            if (applyToSemester) {
                targetWeeks = generateSemesterWeeks().concat(selectedWeekStart);
                if (!window.confirm(`This will apply the bulk schedule to ${targetWeeks.length} weeks in ${selectedSemester} for Room ${section.room_number}. Continue?`)) return;
            }

            const scheduleEntries = [];
            targetWeeks.forEach(weekStart => {
                Object.entries(bulkScheduleData).forEach(([key, data]) => {
                    const [timeSlotId, day] = key.split('-');
                    if (data.course_id && data.teacher_id) {
                        scheduleEntries.push({
                            class_section_id: section.id,
                            time_slot_id: parseInt(timeSlotId),
                            course_id: data.course_id,
                            teacher_id: data.teacher_id,
                            room_id: section.room_id,
                            day_of_week: parseInt(day),
                            week_start_date: weekStart,
                            semester: selectedSemester
                        });
                    }
                });
            });

            if (scheduleEntries.length === 0) {
                alert('No valid schedule entries to save. Please assign both courses and teachers.');
                return;
            }

            await Promise.all(scheduleEntries.map(entry =>
                axios.post('http://localhost:5000/api/scheduling/schedule', entry)
            ));

            setBulkScheduleData({});
            fetchAllSchedules();
            alert(`Successfully scheduled ${scheduleEntries.length} classes for Room ${section.room_number}${applyToSemester ? ` across entire ${selectedSemester}` : ' for the selected week'}!`);
        } catch (error) {
            console.error('Error saving bulk schedule:', error);
            alert('Error saving bulk schedule. Please try again.');
        }
    };

    // Render Functions
    const renderPersonalSchedule = () => {
        if (personalLoading) return <div className="loading">Loading your schedule...</div>;

        const groupedByTimeAndDay = personalSchedules.reduce((acc, item) => {
            const dayName = daysOfWeek.find(d => d.value === item.day_of_week)?.label;
            const timeKey = `${item.start_time}-${item.end_time}`;
            if (!acc[timeKey]) acc[timeKey] = {};
            if (!acc[timeKey][dayName]) acc[timeKey][dayName] = [];
            acc[timeKey][dayName].push(item);
            return acc;
        }, {});

        const timeSlotsList = Object.keys(groupedByTimeAndDay)
            .map(key => ({ key, start: key.split('-')[0], end: key.split('-')[1] }))
            .sort((a, b) => a.start.localeCompare(b.start));

        return (
            <div className="personal-schedule-container">
                <div className="section-header">
                    <h2>Your Weekly Schedule</h2>
                    {(role === "teacher" || role === "student") && (
                        <button className="btn-download" onClick={() => exportToPDF("personal-schedule-export", "My_Weekly_Schedule.pdf")}>
                            Download Schedule (PDF)
                        </button>
                    )}
                </div>

                {timeSlotsList.length === 0 ? (
                    <p>No scheduled classes found.</p>
                ) : (
                    <div id="personal-schedule-export">
                        <div className="schedule-user-info">
                            <h2 className="schedule-user-info-title">
                                {role === "teacher" ? "Teacher Schedule" : "Student Schedule"}
                            </h2>
                            {userInfo && (
                                <div className="schedule-user-info-grid">
                                    <div><strong>Name:</strong> {userInfo.name}</div>
                                    {role === "student" && (
                                        <>
                                            <div><strong>Student ID:</strong> {userInfo.student_id}</div>
                                            <div><strong>Grade:</strong> {userInfo.grade_level}</div>
                                            <div><strong>Section:</strong> {userInfo.section || 'Not Assigned'}</div>
                                        </>
                                    )}
                                    {role === "teacher" && (
                                        <>
                                            <div><strong>Employee ID:</strong> {userInfo.employee_id}</div>
                                            <div><strong>Email:</strong> {userInfo.email}</div>
                                            <div><strong>Phone:</strong> {userInfo.phone || 'N/A'}</div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="timetable-container">
                            <div className="timetable-header">
                                <div className="time-cell"></div>
                                {WEEKDAYS.map(day => (
                                    <div key={day} className="day-header"><strong>{day}</strong></div>
                                ))}
                            </div>

                            {timeSlotsList.map(({ key, start, end }) => {
                                const dayData = groupedByTimeAndDay[key];
                                return (
                                    <div key={key} className="timetable-row">
                                        <div className="time-cell">{`${formatTime(start)} – ${formatTime(end)}`}</div>
                                        {WEEKDAYS.map(day => {
                                            const classes = dayData?.[day] || [];
                                            return (
                                                <div key={day} className="day-cell">
                                                    {classes.map((cls, i) => (
                                                        <div key={`${day}-${key}-${cls.course_name}-${cls.room_number}-${i}`} className="class-card">
                                                            <strong>{cls.course_name}</strong>
                                                            <div className="class-details">
                                                                <span>{cls.grade_level} {cls.section_name}</span>
                                                                <span>Room {cls.room_number}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const checkForConflicts = () => {
        const allCurrentSchedules = [...Object.values(allSchedules), ...Object.values(draftSchedules)];
        return allCurrentSchedules.some(schedule => {
            if (schedule.teacher_id) {
                return allCurrentSchedules.some(other =>
                    other.teacher_id === schedule.teacher_id &&
                    other.time_slot_id === schedule.time_slot_id &&
                    other.day_of_week === schedule.day_of_week &&
                    other.class_section_id !== schedule.class_section_id
                );
            }
            return false;
        });
    };

    const renderBulkScheduling = () => {
        if (!selectedSection) {
            return (
                <div className="bulk-no-selection">
                    <h3>Select a Room to Start Bulk Scheduling</h3>
                    <p>Choose a room from the dropdown above to schedule classes across multiple days.</p>
                </div>
            );
        }

        const section = classSections.find(s => s.id == selectedSection);

        return (
            <div className="bulk-grade-scheduling">
                <div className="bulk-scheduling-header">
                    <h3 className="bulk-scheduling-title">
                        Bulk Scheduling for Room {section?.room_number} - {section?.room_name}
                    </h3>
                    <p className="bulk-scheduling-subtitle">
                        {section?.grade_level} {section?.section_name} • Set courses and teachers for each time slot and day.
                    </p>
                </div>

                <div className="bulk-schedule-grid">
                    <div className="grid-header">
                        <div className="header-cell time-header">Time Slots</div>
                        {bulkScheduleDays.map(day => (
                            <div key={day} className="header-cell day-header">
                                <strong>{daysOfWeek.find(d => d.value === day)?.label}</strong>
                            </div>
                        ))}
                    </div>

                    {timeSlots.map(slot => (
                        <div key={slot.id} className="grid-row">
                            <div className="time-cell">
                                <strong>{slot.slot_name}</strong>
                                <div className="time-range">{slot.start_time} - {slot.end_time}</div>
                            </div>

                            {bulkScheduleDays.map(day => {
                                const key = `${slot.id}-${day}`;
                                const scheduleData = bulkScheduleData[key] || {};
                                const selectedCourse = courses.find(c => c.id == scheduleData.course_id);
                                const availableTeachers = selectedCourse ? getTeachersForCourse(selectedCourse.id) : [];

                                return (
                                    <div key={day} className="schedule-cell bulk-cell">
                                        <select
                                            value={scheduleData.course_id || ''}
                                            onChange={(e) => handleBulkCourseChange(slot.id, day, parseInt(e.target.value) || null)}
                                            className="course-select bulk-course-select"
                                        >
                                            <option value="">Select Course</option>
                                            {courses.map(course => (
                                                <option key={course.id} value={course.id}>{course.course_code}</option>
                                            ))}
                                        </select>

                                        {selectedCourse && (
                                            <select
                                                value={scheduleData.teacher_id || ''}
                                                onChange={(e) => handleBulkTeacherChange(slot.id, day, parseInt(e.target.value) || null)}
                                                className="teacher-select"
                                            >
                                                <option value="">Select Teacher</option>
                                                {availableTeachers.map(teacher => (
                                                    <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                                                ))}
                                            </select>
                                        )}

                                        {selectedCourse && (
                                            <div className="course-info bulk-course-info">
                                                <div className="course-name">{selectedCourse.course_name}</div>
                                                {scheduleData.teacher_id && (
                                                    <div className="teacher-name">
                                                        {teachers.find(t => t.id == scheduleData.teacher_id)?.name}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>

                <div className="bulk-actions">
                    <button
                        onClick={() => saveBulkSchedule(false)}
                        className="save-all-btn bulk-save-btn"
                        disabled={Object.keys(bulkScheduleData).length === 0}
                    >
                        Save for Current Week
                    </button>
                    <button
                        onClick={() => saveBulkSchedule(true)}
                        className="copy-semester-btn bulk-save-btn"
                        disabled={Object.keys(bulkScheduleData).length === 0}
                    >
                        Apply to Entire Semester
                    </button>
                    <button
                        onClick={() => setBulkScheduleData({})}
                        className="copy-week-btn"
                        disabled={Object.keys(bulkScheduleData).length === 0}
                    >
                        Clear All
                    </button>
                    <div className="bulk-assignments-count">
                        {Object.keys(bulkScheduleData).length} schedule assignments configured
                    </div>
                </div>
            </div>
        );
    };

    const renderAdminScheduling = () => {
        const hasConflicts = checkForConflicts();

        return (
            <div className="admin-scheduling-container">
                <div className="scheduling-controls">
                    <div className="control-group">
                        <label>Scheduling Mode:</label>
                        <select
                            value={schedulingMode}
                            onChange={(e) => {
                                setSchedulingMode(e.target.value);
                                if (e.target.value === 'bulk-grade') setBulkScheduleData({});
                            }}
                            className="mode-select"
                        >
                            <option value="single-day">Single Day Scheduling</option>
                            <option value="bulk-grade">Bulk Grade Scheduling</option>
                        </select>
                    </div>

                    <div className="control-group">
                        <label>Semester:</label>
                        <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)} className="semester-select">
                            {semesters.map(semester => (
                                <option key={semester.value} value={semester.value}>{semester.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="control-group">
                        <label>Week Start (Monday):</label>
                        <select
                            value={selectedWeekStart}
                            onChange={(e) => setSelectedWeekStart(e.target.value)}
                            className="week-select"
                        >
                            {getAvailableMondaysForSemester().length > 0 ? (
                                getAvailableMondaysForSemester().map(monday => (
                                    <option key={monday} value={monday}>
                                        {formatDate(monday)}
                                    </option>
                                ))
                            ) : (
                                <option value={selectedWeekStart}>{formatDate(selectedWeekStart)}</option>
                            )}
                        </select>
                    </div>

                    {schedulingMode === 'single-day' && (
                        <div className="control-group">
                            <label>Select Day:</label>
                            <select value={selectedDay} onChange={(e) => setSelectedDay(parseInt(e.target.value))} className="day-select">
                                {daysOfWeek.map(day => (
                                    <option key={day.value} value={day.value}>{day.label}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {schedulingMode === 'bulk-grade' && (
                        <>
                            <div className="control-group">
                                <label>Select Room:</label>
                                <select
                                    value={selectedSection}
                                    onChange={(e) => {
                                        setSelectedSection(e.target.value);
                                    }}
                                    className="grade-select"
                                >
                                    <option value="">Choose Room...</option>
                                    {classSections.map(section => (
                                        <option key={section.id} value={section.id}>
                                            Room {section.room_number} - {section.room_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="control-group">
                                <label>Schedule Days:</label>
                                <div className="schedule-days-checkboxes">
                                    {daysOfWeek.map(day => (
                                        <label key={day.value} className="day-checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={bulkScheduleDays.includes(day.value)}
                                                onChange={(e) => {
                                                    setBulkScheduleDays(e.target.checked
                                                        ? [...bulkScheduleDays, day.value].sort()
                                                        : bulkScheduleDays.filter(d => d !== day.value)
                                                    );
                                                }}
                                                className="day-checkbox"
                                            />
                                            {day.label}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    <div className="action-buttons">
                        <button onClick={() => setShowSemesterEditor(true)} className="manage-semesters-btn">
                            Manage Semesters
                        </button>
                        <button onClick={() => setShowTimeslotEditor(true)} className="manage-timeslots-btn">
                            Manage Time Slots
                        </button>
                        {schedulingMode === 'single-day' && (
                            <>
                                <button onClick={saveAllSchedules} className="save-all-btn" disabled={Object.keys(draftSchedules).length === 0}>
                                    Save All Changes ({Object.keys(draftSchedules).length})
                                </button>
                                <button onClick={copyDayToWeek} className="copy-week-btn">
                                    Copy {daysOfWeek.find(d => d.value === selectedDay)?.label} to Entire Week
                                </button>
                                <button onClick={copyWeekToSemester} className="copy-semester-btn">
                                    Copy Current Week to Entire {semesters.find(s => s.value === selectedSemester)?.label || `Academic Year ${selectedSemester}`}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {schedulingMode === 'single-day' && hasConflicts && (
                    <div className="conflict-message-top">Scheduling conflicts detected. Please review highlighted cells.</div>
                )}

                {schedulingMode === 'single-day' && (
                    <div className="schedule-master-grid">
                        <div className="grid-header">
                            <div className="header-cell time-header">Time Slots</div>
                            {classSections.map(section => (
                                <div key={section.id} className="header-cell section-header">
                                    Room {section.room_number}
                                    <div className="room-info">{section.room_name}</div>
                                </div>
                            ))}
                        </div>

                        {timeSlots.map(slot => (
                            <div key={slot.id} className="grid-row">
                                <div className="time-cell">
                                    <strong>{slot.slot_name}</strong>
                                    <div className="time-range">{slot.start_time} - {slot.end_time}</div>
                                </div>

                                {classSections.map(section => {
                                    const key = `${section.id}-${slot.id}`;
                                    const currentEntry = draftSchedules[key] || allSchedules[key] || {};
                                    const selectedCourse = courses.find(c => c.id == currentEntry.course_id);
                                    const selectedTeacher = teachers.find(t => t.id == currentEntry.teacher_id);
                                    const isDraft = !!draftSchedules[key];
                                    const conflictDetails = selectedTeacher ? validateScheduling(section.id, slot.id, currentEntry.course_id, selectedTeacher.id) : [];
                                    const hasConflict = conflictDetails.length > 0;
                                    const availableTeachers = selectedCourse ? getTeachersForCourse(selectedCourse.id) : [];

                                    return (
                                        <div key={section.id} className={`schedule-cell ${isDraft ? 'draft-cell' : ''} ${hasConflict ? 'conflict-cell' : ''}`}>
                                            <select
                                                value={currentEntry.course_id || ''}
                                                onChange={(e) => handleCourseChange(section.id, slot.id, parseInt(e.target.value) || null)}
                                                className="course-select"
                                            >
                                                <option value="">Select Course</option>
                                                {courses.map(course => (
                                                    <option key={course.id} value={course.id}>{course.course_code}</option>
                                                ))}
                                            </select>

                                            {selectedCourse && (
                                                <select
                                                    value={currentEntry.teacher_id || ''}
                                                    onChange={(e) => handleTeacherChange(section.id, slot.id, parseInt(e.target.value) || null)}
                                                    className="teacher-select"
                                                >
                                                    <option value="">Select Teacher</option>
                                                    {availableTeachers.map(teacher => (
                                                        <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                                                    ))}
                                                </select>
                                            )}

                                            {selectedCourse && (
                                                <div className="course-info">
                                                    <div className="course-name">{selectedCourse.course_name}</div>
                                                    <div className="teacher-name">
                                                        {teachers.find(t => t.id == currentEntry.teacher_id)?.name || 'No teacher assigned'}
                                                    </div>
                                                    {isDraft && <div className="draft-indicator">• Draft</div>}
                                                </div>
                                            )}
                                            {isDraft && !selectedCourse && <div className="draft-indicator">• Draft</div>}
                                            {hasConflict && (
                                                <div className="conflict-alert">
                                                    <strong>⚠️ Conflict:</strong>
                                                    <div className="conflict-message">
                                                        {conflictDetails.map((conflict, index) => (
                                                            <div key={`conflict-${section.id}-${slot.id}-${index}`}>{conflict}</div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                )}

                {schedulingMode === 'bulk-grade' && renderBulkScheduling()}

                {showTimeslotEditor && (
                    <div className="modal-overlay">
                        <div className="modal-content timeslot-modal">
                            <div className="modal-header">
                                <h3>Manage Time Slots</h3>
                                <button onClick={closeTimeslotEditor} className="close-btn">×</button>
                            </div>

                            <div className="modal-body">
                                <div className="timeslot-form-section">
                                    <h4>{editingTimeslot ? 'Edit Time Slot' : 'Add New Time Slot'}</h4>
                                    <div className="form-row">
                                        <div className="form-field">
                                            <label>Slot Name:</label>
                                            <input
                                                type="text"
                                                value={timeslotForm.slot_name}
                                                onChange={(e) => setTimeslotForm({ ...timeslotForm, slot_name: e.target.value })}
                                                placeholder="e.g., Period 1"
                                            />
                                        </div>
                                        <div className="form-field">
                                            <label>Start Time:</label>
                                            <input
                                                type="time"
                                                value={timeslotForm.start_time}
                                                onChange={(e) => setTimeslotForm({ ...timeslotForm, start_time: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-field">
                                            <label>End Time:</label>
                                            <input
                                                type="time"
                                                value={timeslotForm.end_time}
                                                onChange={(e) => setTimeslotForm({ ...timeslotForm, end_time: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-field">
                                            <label>Order:</label>
                                            <input
                                                type="number"
                                                value={timeslotForm.slot_order}
                                                onChange={(e) => setTimeslotForm({ ...timeslotForm, slot_order: e.target.value })}
                                                placeholder="1, 2, 3..."
                                                min="1"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-actions">
                                        <button
                                            onClick={saveTimeslot}
                                            className="save-timeslot-btn"
                                            disabled={!timeslotForm.slot_name || !timeslotForm.start_time || !timeslotForm.end_time || !timeslotForm.slot_order}
                                        >
                                            {editingTimeslot ? 'Update' : 'Add'} Time Slot
                                        </button>
                                        {editingTimeslot && (
                                            <button onClick={() => openTimeslotEditor()} className="cancel-edit-btn">Cancel Edit</button>
                                        )}
                                    </div>
                                </div>

                                <div className="existing-timeslots">
                                    <h4>Existing Time Slots</h4>
                                    <div className="timeslots-list">
                                        {timeSlots.map(slot => (
                                            <div key={slot.id} className="timeslot-item">
                                                <div className="timeslot-info">
                                                    <span className="slot-name">{slot.slot_name}</span>
                                                    <span className="slot-time">{slot.start_time} - {slot.end_time}</span>
                                                    <span className="slot-order">Order: {slot.slot_order}</span>
                                                </div>
                                                <div className="timeslot-actions">
                                                    <button onClick={() => openTimeslotEditor(slot)} className="edit-timeslot-btn">Edit</button>
                                                    <button onClick={() => deleteTimeslot(slot.id)} className="delete-timeslot-btn">Delete</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showSemesterEditor && (
                    <div className="modal-overlay">
                        <div className="modal-content semester-modal">
                            <div className="modal-header">
                                <h3>Manage Semesters</h3>
                                <button onClick={closeSemesterEditor} className="close-btn">×</button>
                            </div>

                            <div className="modal-body">
                                <div className="semester-form-section">
                                    <h4>{editingSemester ? 'Edit Semester' : 'Add New Semester'}</h4>
                                    <div className="form-row">
                                        <div className="form-field">
                                            <label>Semester Name:</label>
                                            <input
                                                type="text"
                                                value={semesterForm.semester_name}
                                                onChange={(e) => setSemesterForm({ ...semesterForm, semester_name: e.target.value })}
                                                placeholder="e.g., 2024-25, Fall 2024"
                                            />
                                        </div>
                                        <div className="form-field">
                                            <label>Start Date:</label>
                                            <input
                                                type="date"
                                                value={semesterForm.start_date}
                                                onChange={(e) => setSemesterForm({ ...semesterForm, start_date: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-field">
                                            <label>End Date:</label>
                                            <input
                                                type="date"
                                                value={semesterForm.end_date}
                                                onChange={(e) => setSemesterForm({ ...semesterForm, end_date: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-actions">
                                        <button
                                            onClick={saveSemester}
                                            className="save-semester-btn"
                                            disabled={!semesterForm.semester_name || !semesterForm.start_date || !semesterForm.end_date}
                                        >
                                            {editingSemester ? 'Update' : 'Add'} Semester
                                        </button>
                                        {editingSemester && (
                                            <button onClick={() => openSemesterEditor()} className="cancel-edit-btn">Cancel Edit</button>
                                        )}
                                    </div>
                                </div>

                                <div className="existing-semesters">
                                    <h4>Existing Semesters</h4>
                                    <div className="semesters-list">
                                        {semesters.map(semester => (
                                            <div key={semester.id || semester.value} className="semester-item">
                                                <div className="semester-info">
                                                    <span className="semester-name">{semester.label}</span>
                                                    {semester.start_date && (
                                                        <span className="semester-dates">{formatDate(semester.start_date)} to {formatDate(semester.end_date)}</span>
                                                    )}
                                                </div>
                                                {semester.id && (
                                                    <div className="semester-actions">
                                                        <button onClick={() => openSemesterEditor(semester)} className="edit-semester-btn">Edit</button>
                                                        <button onClick={() => deleteSemester(semester.id)} className="delete-semester-btn">Delete</button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="schedule-page">
            <h1>
                {role === "admin" ? "Admin Scheduling" :
                    role === "teacher" ? "My Teaching Schedule" :
                        "My Class Schedule"}
            </h1>
            {role === "admin" ? renderAdminScheduling() : renderPersonalSchedule()}
        </div>
    );
};

export default Schedule;