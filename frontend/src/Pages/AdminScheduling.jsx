import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useExportPDF from '../hooks/useExportPDF';
import '../styles/AdminScheduling.css';

const Schedule = () => {
    const role = localStorage.getItem("role");
    const userId = localStorage.getItem("userId");

    const [timeSlots, setTimeSlots] = useState([]);
    const [classSections, setClassSections] = useState([]);
    const [courses, setCourses] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [allSchedules, setAllSchedules] = useState({});
    const [draftSchedules, setDraftSchedules] = useState({});
    const [selectedDay, setSelectedDay] = useState(1);
    const [showTimeslotEditor, setShowTimeslotEditor] = useState(false);
    const [editingTimeslot, setEditingTimeslot] = useState(null);
    const [timeslotForm, setTimeslotForm] = useState({
        slot_name: '',
        start_time: '',
        end_time: '',
        slot_order: ''
    });
    const [personalSchedules, setPersonalSchedules] = useState([]);
    const [personalLoading, setPersonalLoading] = useState(true);

    const { exportToPDF } = useExportPDF();

    const daysOfWeek = [
        { value: 1, label: 'Monday' },
        { value: 2, label: 'Tuesday' },
        { value: 3, label: 'Wednesday' },
        { value: 4, label: 'Thursday' },
        { value: 5, label: 'Friday' }
    ];

    useEffect(() => {
        if (role === "admin") {
            fetchInitialData();
        }
    }, []);

    useEffect(() => {
        if (role === "admin") {
            fetchAllSchedules();
        }
    }, [selectedDay, role]);

    useEffect(() => {
        if (role !== "admin") {
            fetchPersonalSchedule();
        }
    }, [role, userId]);

    const fetchPersonalSchedule = async () => {
        setPersonalLoading(true);
        try {
            let url = "";
            if (role === "teacher") {
                url = `http://localhost:5000/api/scheduling/teacher-by-user/${userId}/schedule`;
            } else if (role === "student") {
                url = `http://localhost:5000/api/scheduling/student/${userId}/schedule`;
            }

            const response = await axios.get(url);
            setPersonalSchedules(response.data);
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

    const fetchAllSchedules = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/scheduling/schedule/${selectedDay}`);

            const scheduleMap = {};
            response.data.forEach(item => {
                const key = `${item.class_section_id}-${item.time_slot_id}`;
                scheduleMap[key] = item;
            });

            setAllSchedules(scheduleMap);
        } catch (error) {
            console.error('Error fetching schedules:', error);
        }
    };

    const validateScheduling = (sectionId, timeSlotId, courseId, teacherId) => {
        if (role !== "admin") return [];
        const allCurrentSchedules = [...Object.values(allSchedules), ...Object.values(draftSchedules)];
        const teacherConflict = allCurrentSchedules.find(schedule =>
            schedule.teacher_id === teacherId &&
            schedule.time_slot_id === timeSlotId &&
            schedule.day_of_week === selectedDay &&
            schedule.class_section_id !== sectionId
        );

        if (teacherConflict) {
            const conflictSection = classSections.find(cs => cs.id === teacherConflict.class_section_id);
            return [`Teacher is already scheduled for ${conflictSection?.grade_level} ${conflictSection?.section_name} at this time`];
        }
        return [];
    };

    const handleCourseChange = (sectionId, timeSlotId, courseId) => {
        if (role !== "admin") return;
        const key = `${sectionId}-${timeSlotId}`;

        if (!courseId) {
            const updatedDraft = { ...draftSchedules };
            delete updatedDraft[key];
            setDraftSchedules(updatedDraft);
            return;
        }

        const course = courses.find(c => c.id == courseId);
        if (!course) return;

        const suitableTeachers = teachers.filter(t => t.subject === course.subject);
        if (suitableTeachers.length === 0) return;

        const selectedTeacher = suitableTeachers.find(teacher =>
            validateScheduling(sectionId, timeSlotId, courseId, teacher.id).length === 0
        );

        if (!selectedTeacher) {
            alert(`Scheduling Conflict!\n\nNo available teachers for ${course.subject} at this time slot. All qualified teachers are already scheduled.`);
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
                day_of_week: selectedDay
            }
        });
    };

    const handleTeacherChange = (sectionId, timeSlotId, teacherId) => {
        if (role !== "admin") return;
        const key = `${sectionId}-${timeSlotId}`;
        const currentEntry = draftSchedules[key] || allSchedules[key];

        if (!currentEntry || !currentEntry.course_id) return;
        if (!teacherId) return;

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
                day_of_week: selectedDay
            }
        });
    };

    const saveAllSchedules = async () => {
        if (role !== "admin") return;
        if (Object.keys(draftSchedules).length === 0) return;

        try {
            const savePromises = Object.values(draftSchedules).map(scheduleEntry =>
                axios.post('http://localhost:5000/api/scheduling/schedule', scheduleEntry)
            );

            await Promise.all(savePromises);
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
                to_days: targetDays
            });

            fetchAllSchedules();
        } catch (error) {
            console.error('Error copying schedules:', error);
        }
    };

    const handleTimeslotFormChange = (field, value) => {
        if (role !== "admin") return;
        setTimeslotForm(prev => ({ ...prev, [field]: value }));
    };

    const openTimeslotEditor = (timeslot = null) => {
        if (role !== "admin") return;
        if (timeslot) {
            setEditingTimeslot(timeslot);
            setTimeslotForm({
                slot_name: timeslot.slot_name,
                start_time: timeslot.start_time,
                end_time: timeslot.end_time,
                slot_order: timeslot.slot_order.toString()
            });
        } else {
            setEditingTimeslot(null);
            setTimeslotForm({ slot_name: '', start_time: '', end_time: '', slot_order: '' });
        }
        setShowTimeslotEditor(true);
    };

    const closeTimeslotEditor = () => {
        if (role !== "admin") return;
        setShowTimeslotEditor(false);
        setEditingTimeslot(null);
        setTimeslotForm({ slot_name: '', start_time: '', end_time: '', slot_order: '' });
    };

    const saveTimeslot = async () => {
        if (role !== "admin") return;
        try {
            const timeslotData = {
                slot_name: timeslotForm.slot_name,
                start_time: timeslotForm.start_time,
                end_time: timeslotForm.end_time,
                slot_order: parseInt(timeslotForm.slot_order)
            };

            if (editingTimeslot) {
                await axios.put(`http://localhost:5000/api/scheduling/timeslots/${editingTimeslot.id}`, timeslotData);
            } else {
                await axios.post('http://localhost:5000/api/scheduling/timeslots', timeslotData);
            }

            fetchInitialData();
            closeTimeslotEditor();
        } catch (error) {
            console.error('Error saving time slot:', error);
        }
    };

    const deleteTimeslot = async (timeslotId) => {
        if (role !== "admin") return;
        if (!window.confirm('Are you sure?')) return;

        try {
            await axios.delete(`http://localhost:5000/api/scheduling/timeslots/${timeslotId}`);
            fetchInitialData();
        } catch (error) {
            console.error('Error deleting time slot:', error);
        }
    };

    const getCoursesForGrade = (gradeLevel) => courses;
    const getTeachersForCourse = (courseId) => {
        const course = courses.find(c => c.id == courseId);
        if (!course) return [];
        return teachers.filter(teacher => teacher.subject === course.subject);
    };

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

        const timeKeys = Object.keys(groupedByTimeAndDay);
        const timeSlots = timeKeys
            .map(key => ({
                key,
                start: key.split('-')[0],
                end: key.split('-')[1]
            }))
            .sort((a, b) => a.start.localeCompare(b.start));

        const formatTime = (timeStr) => {
            if (!timeStr) return "—";
            const [hour, minute] = timeStr.split(':').map(Number);
            const period = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
        };

        return (
            <div className="personal-schedule-container">
                <div className="section-header">
                    <h2>Your Weekly Schedule</h2>
                    {(role === "teacher" || role === "student") && (
                        <button
                            className="btn-download"
                            onClick={() => exportToPDF("personal-schedule-export", "My_Weekly_Schedule.pdf")}
                        >
                            Download Schedule (PDF)
                        </button>
                    )}
                </div>

                {timeSlots.length === 0 ? (
                    <p>No scheduled classes found.</p>
                ) : (
                    <div id="personal-schedule-export" className="timetable-container">
                        <div className="timetable-header">
                            <div className="time-cell"></div>
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                                <div key={day} className="day-header">
                                    <strong>{day}</strong>
                                </div>
                            ))}
                        </div>

                        {timeSlots.map(({ key, start, end }) => {
                            const timeDisplay = `${formatTime(start)} – ${formatTime(end)}`;
                            const dayData = groupedByTimeAndDay[key];

                            return (
                                <div key={key} className="timetable-row">
                                    <div className="time-cell">{timeDisplay}</div>
                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => {
                                        const classes = dayData?.[day] || [];
                                        return (
                                            <div key={day} className="day-cell">
                                                {classes.map((cls, i) => (
                                                    <div key={i} className="class-card">
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
                )}
            </div>
        );
    };

    const checkForConflicts = () => {
        const allCurrentSchedules = [...Object.values(allSchedules), ...Object.values(draftSchedules)];
        return allCurrentSchedules.some(schedule => {
            if (schedule.teacher_id) {
                return allCurrentSchedules.some(otherSchedule =>
                    otherSchedule.teacher_id === schedule.teacher_id &&
                    otherSchedule.time_slot_id === schedule.time_slot_id &&
                    otherSchedule.day_of_week === schedule.day_of_week &&
                    otherSchedule.class_section_id !== schedule.class_section_id
                );
            }
            return false;
        });
    };

    const renderAdminScheduling = () => {
        const hasConflicts = checkForConflicts();

        return (
            <div className="admin-scheduling-container">
                <div className="scheduling-controls">
                    <div className="control-group">
                        <label>Select Day:</label>
                        <select
                            value={selectedDay}
                            onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                            className="day-select"
                        >
                            {daysOfWeek.map(day => (
                                <option key={day.value} value={day.value}>
                                    {day.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="action-buttons">
                        <button
                            onClick={() => setShowTimeslotEditor(true)}
                            className="manage-timeslots-btn"
                        >
                            Manage Time Slots
                        </button>

                        <button
                            onClick={saveAllSchedules}
                            className="save-all-btn"
                            disabled={Object.keys(draftSchedules).length === 0}
                        >
                            Save All Changes ({Object.keys(draftSchedules).length})
                        </button>

                        <button onClick={copyDayToWeek} className="copy-week-btn">
                            Copy {daysOfWeek.find(d => d.value === selectedDay)?.label} to Entire Week
                        </button>
                    </div>
                </div>

                {hasConflicts && (
                    <div className="conflict-message-top">
                        ⚠️ Scheduling conflicts detected. Please review highlighted cells.
                    </div>
                )}

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
                                <div className="time-range">
                                    {slot.start_time} - {slot.end_time}
                                </div>
                            </div>

                            {classSections.map(section => {
                                const key = `${section.id}-${slot.id}`;
                                const savedEntry = allSchedules[key] || {};
                                const draftEntry = draftSchedules[key];
                                const currentEntry = draftEntry || savedEntry;
                                const availableCourses = getCoursesForGrade(section.room_number);
                                const selectedCourse = courses.find(c => c.id == currentEntry.course_id);
                                const selectedTeacher = teachers.find(t => t.id == currentEntry.teacher_id);
                                const isDraft = !!draftEntry;

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
                                            {availableCourses.map(course => (
                                                <option key={course.id} value={course.id}>
                                                    {course.course_code}
                                                </option>
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
                                                    <option key={teacher.id} value={teacher.id}>
                                                        {teacher.name}
                                                    </option>
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
                                        {isDraft && !selectedCourse && (
                                            <div className="draft-indicator">• Draft</div>
                                        )}
                                        {hasConflict && (
                                            <div className="conflict-alert">
                                                <strong>⚠️ Conflict:</strong>
                                                <div className="conflict-message">
                                                    {conflictDetails.map((conflict, index) => (
                                                        <div key={index}>{conflict}</div>
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
                                                onChange={(e) => handleTimeslotFormChange('slot_name', e.target.value)}
                                                placeholder="e.g., Period 1"
                                            />
                                        </div>
                                        <div className="form-field">
                                            <label>Start Time:</label>
                                            <input
                                                type="time"
                                                value={timeslotForm.start_time}
                                                onChange={(e) => handleTimeslotFormChange('start_time', e.target.value)}
                                            />
                                        </div>
                                        <div className="form-field">
                                            <label>End Time:</label>
                                            <input
                                                type="time"
                                                value={timeslotForm.end_time}
                                                onChange={(e) => handleTimeslotFormChange('end_time', e.target.value)}
                                            />
                                        </div>
                                        <div className="form-field">
                                            <label>Order:</label>
                                            <input
                                                type="number"
                                                value={timeslotForm.slot_order}
                                                onChange={(e) => handleTimeslotFormChange('slot_order', e.target.value)}
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
                                            <button
                                                onClick={() => openTimeslotEditor()}
                                                className="cancel-edit-btn"
                                            >
                                                Cancel Edit
                                            </button>
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
                                                    <button
                                                        onClick={() => openTimeslotEditor(slot)}
                                                        className="edit-timeslot-btn"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => deleteTimeslot(slot.id)}
                                                        className="delete-timeslot-btn"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
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