import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/AdminScheduling.css';

const AdminScheduling = () => {
    const [timeSlots, setTimeSlots] = useState([]);
    const [classSections, setClassSections] = useState([]);
    const [courses, setCourses] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [allSchedules, setAllSchedules] = useState({});
    const [draftSchedules, setDraftSchedules] = useState({});
    const [selectedDay, setSelectedDay] = useState(1); // Monday
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [showTimeslotEditor, setShowTimeslotEditor] = useState(false);
    const [editingTimeslot, setEditingTimeslot] = useState(null);
    const [timeslotForm, setTimeslotForm] = useState({
        slot_name: '',
        start_time: '',
        end_time: '',
        slot_order: ''
    });

    const daysOfWeek = [
        { value: 1, label: 'Monday' },
        { value: 2, label: 'Tuesday' },
        { value: 3, label: 'Wednesday' },
        { value: 4, label: 'Thursday' },
        { value: 5, label: 'Friday' }
    ];

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchAllSchedules();
    }, [selectedDay]);

    useEffect(() => {
        setDraftSchedules({});
    }, [selectedDay]);

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

            setLoading(false);
        } catch (error) {
            console.error('Error fetching initial data:', error);
            setMessage('Error loading data');
            setLoading(false);
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
        const key = `${sectionId}-${timeSlotId}`;

        if (!courseId) {
            const updatedDraft = { ...draftSchedules };
            delete updatedDraft[key];
            setDraftSchedules(updatedDraft);
            return;
        }

        const course = courses.find(c => c.id == courseId);
        if (!course) {
            setMessage('Selected course not found');
            return;
        }

        const suitableTeachers = teachers.filter(t => t.subject === course.subject);
        if (suitableTeachers.length === 0) {
            setMessage(`No teacher available for ${course.subject}`);
            return;
        }

        const selectedTeacher = suitableTeachers.find(teacher =>
            validateScheduling(sectionId, timeSlotId, courseId, teacher.id).length === 0
        );

        if (!selectedTeacher) {
            setMessage(`All ${course.subject} teachers are busy at this time slot`);
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

        setMessage('');
    };

    const handleTeacherChange = (sectionId, timeSlotId, teacherId) => {
        const key = `${sectionId}-${timeSlotId}`;
        const currentEntry = draftSchedules[key] || allSchedules[key];

        if (!currentEntry || !currentEntry.course_id) {
            setMessage('Please select a course first');
            return;
        }

        if (!teacherId) {
            setMessage('Please select a teacher');
            return;
        }

        const conflicts = validateScheduling(sectionId, timeSlotId, currentEntry.course_id, teacherId);
        if (conflicts.length > 0) {
            setMessage(conflicts.join(', '));
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

        setMessage('');
    };

    const saveAllSchedules = async () => {
        if (Object.keys(draftSchedules).length === 0) {
            setMessage('No changes to save');
            return;
        }

        setSaving(true);
        try {
            const savePromises = Object.values(draftSchedules).map(scheduleEntry =>
                axios.post('http://localhost:5000/api/scheduling/schedule', scheduleEntry)
            );

            await Promise.all(savePromises);

            setMessage(`Successfully saved ${Object.keys(draftSchedules).length} schedule entries`);
            setDraftSchedules({});
            fetchAllSchedules();
        } catch (error) {
            console.error('Error saving schedules:', error);
            setMessage(error.response?.data?.error || 'Error saving schedules');
        } finally {
            setSaving(false);
        }
    };

    const copyDayToWeek = async () => {
        try {
            setSaving(true);

            const currentSchedules = Object.keys(allSchedules).length + Object.keys(draftSchedules).length;
            if (currentSchedules === 0) {
                setMessage('No schedules found to copy. Please create a schedule first.');
                return;
            }

            if (Object.keys(draftSchedules).length > 0) {
                await saveAllSchedules();
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            const targetDays = daysOfWeek.filter(d => d.value !== selectedDay).map(d => d.value);

            const response = await axios.post('http://localhost:5000/api/scheduling/schedule/copy-day-to-week', {
                from_day: selectedDay,
                to_days: targetDays
            });

            let message = response.data.message || 'All schedules copied to entire week successfully';
            if (response.data.errorCount && response.data.errorCount > 0) {
                message += ` (${response.data.errorCount} errors occurred)`;
                if (response.data.errors && response.data.errors.length > 0) {
                    console.error('Copy errors:', response.data.errors);
                }
            }

            setMessage(message);
            await fetchAllSchedules();
        } catch (error) {
            console.error('Error copying schedules:', error);
            const errorMessage = error.response?.data?.error || 'Error copying schedules to week';
            setMessage(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const getCoursesForGrade = (gradeLevel) => courses;

    const getTeachersForCourse = (courseId) => {
        const course = courses.find(c => c.id == courseId);
        if (!course) return [];
        return teachers.filter(teacher => teacher.subject === course.subject);
    };

    const handleTimeslotFormChange = (field, value) => {
        setTimeslotForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const openTimeslotEditor = (timeslot = null) => {
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
            setTimeslotForm({
                slot_name: '',
                start_time: '',
                end_time: '',
                slot_order: ''
            });
        }
        setShowTimeslotEditor(true);
    };

    const closeTimeslotEditor = () => {
        setShowTimeslotEditor(false);
        setEditingTimeslot(null);
        setTimeslotForm({
            slot_name: '',
            start_time: '',
            end_time: '',
            slot_order: ''
        });
    };

    const saveTimeslot = async () => {
        try {
            setSaving(true);
            const timeslotData = {
                slot_name: timeslotForm.slot_name,
                start_time: timeslotForm.start_time,
                end_time: timeslotForm.end_time,
                slot_order: parseInt(timeslotForm.slot_order)
            };

            if (editingTimeslot) {
                await axios.put(`http://localhost:5000/api/scheduling/timeslots/${editingTimeslot.id}`, timeslotData);
                setMessage('Time slot updated successfully');
            } else {
                await axios.post('http://localhost:5000/api/scheduling/timeslots', timeslotData);
                setMessage('Time slot created successfully');
            }

            fetchInitialData();
            closeTimeslotEditor();
        } catch (error) {
            console.error('Error saving time slot:', error);
            setMessage(error.response?.data?.error || 'Error saving time slot');
        } finally {
            setSaving(false);
        }
    };

    const deleteTimeslot = async (timeslotId) => {
        if (!window.confirm('Are you sure you want to delete this time slot? This action cannot be undone.')) {
            return;
        }

        try {
            setSaving(true);
            await axios.delete(`http://localhost:5000/api/scheduling/timeslots/${timeslotId}`);
            setMessage('Time slot deleted successfully');
            fetchInitialData();
        } catch (error) {
            console.error('Error deleting time slot:', error);
            setMessage(error.response?.data?.error || 'Error deleting time slot');
        } finally {
            setSaving(false);
        }
    };


    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="admin-scheduling-container">

            {message && (
                <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
                    {message}
                </div>
            )}

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
                        disabled={saving}
                    >
                        Manage Time Slots
                    </button>

                    <button
                        onClick={saveAllSchedules}
                        className="save-all-btn"
                        disabled={saving || Object.keys(draftSchedules).length === 0}
                    >
                        {saving ? 'Saving...' : `Save All Changes (${Object.keys(draftSchedules).length})`}
                    </button>

                    <button onClick={copyDayToWeek} className="copy-week-btn" disabled={saving}>
                        {saving ? 'Copying...' : `Copy ${daysOfWeek.find(d => d.value === selectedDay)?.label} to Entire Week`}
                    </button>
                </div>
            </div>

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

                            const hasConflict = selectedTeacher && Object.values(allSchedules).some(schedule =>
                                schedule.teacher_id === selectedTeacher.id &&
                                schedule.time_slot_id === slot.id &&
                                schedule.day_of_week === selectedDay &&
                                schedule.class_section_id !== section.id
                            );

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
                                        disabled={saving || !timeslotForm.slot_name || !timeslotForm.start_time || !timeslotForm.end_time || !timeslotForm.slot_order}
                                    >
                                        {saving ? 'Saving...' : (editingTimeslot ? 'Update' : 'Add')} Time Slot
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
                                                    disabled={saving}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => deleteTimeslot(slot.id)}
                                                    className="delete-timeslot-btn"
                                                    disabled={saving}
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

export default AdminScheduling;