import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/AdminScheduling.css';

const AdminScheduling = () => {
    const [timeSlots, setTimeSlots] = useState([]);
    const [classSections, setClassSections] = useState([]);
    const [courses, setCourses] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [schedules, setSchedules] = useState({});
    const [selectedDay, setSelectedDay] = useState(1);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [conflicts, setConflicts] = useState([]);

    const days = [
        { value: 1, label: 'Monday' },
        { value: 2, label: 'Tuesday' },
        { value: 3, label: 'Wednesday' },
        { value: 4, label: 'Thursday' },
        { value: 5, label: 'Friday' }
    ];

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        loadSchedules();
    }, [selectedDay]);

    const loadData = async () => {
        try {
            const [slotsRes, sectionsRes, coursesRes, teachersRes] = await Promise.all([
                axios.get('http://localhost:5000/api/scheduling/timeslots'),
                axios.get('http://localhost:5000/api/scheduling/sections'),
                axios.get('http://localhost:5000/api/scheduling/courses'),
                axios.get('http://localhost:5000/api/scheduling/teachers')
            ]);

            // Filter out break and lunch slots
            const filteredSlots = slotsRes.data
                .filter(slot => !slot.slot_name.includes('Break') && !slot.slot_name.includes('Lunch'))
                .sort((a, b) => a.slot_order - b.slot_order);

            setTimeSlots(filteredSlots);
            setClassSections(sectionsRes.data);
            setCourses(coursesRes.data);
            setTeachers(teachersRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Error loading data:', error);
            setMessage('Error loading data');
            setLoading(false);
        }
    };

    const loadSchedules = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/scheduling/schedule/${selectedDay}`);
            
            const scheduleMap = {};
            response.data.forEach(item => {
                const key = `${item.class_section_id}-${item.time_slot_id}`;
                scheduleMap[key] = item;
            });

            setSchedules(scheduleMap);
        } catch (error) {
            console.error('Error loading schedules:', error);
        }
    };

    const checkTeacherConflict = (teacherId, timeSlotId, excludeSectionId) => {
        if (!teacherId || !timeSlotId) return false;
        
        return Object.values(schedules).some(schedule =>
            schedule.teacher_id === teacherId &&
            schedule.time_slot_id === timeSlotId &&
            schedule.class_section_id !== excludeSectionId
        );
    };

    const handleCourseChange = (sectionId, timeSlotId, courseId) => {
        const key = `${sectionId}-${timeSlotId}`;
        
        if (!courseId) {
            // Remove schedule if no course selected
            const newSchedules = { ...schedules };
            delete newSchedules[key];
            setSchedules(newSchedules);
            return;
        }

        const course = courses.find(c => c.id == courseId);
        if (!course) return;

        // Find available teacher for this subject
        const availableTeachers = teachers.filter(t => 
            t.subject === course.subject && 
            !checkTeacherConflict(t.id, timeSlotId, sectionId)
        );

        if (availableTeachers.length === 0) {
            setMessage(`No ${course.subject} teacher available for this time slot`);
            return;
        }

        const section = classSections.find(s => s.id == sectionId);
        
        setSchedules({
            ...schedules,
            [key]: {
                class_section_id: sectionId,
                time_slot_id: timeSlotId,
                course_id: courseId,
                teacher_id: availableTeachers[0].id,
                room_id: section?.room_id,
                day_of_week: selectedDay
            }
        });

        setMessage('');
    };

    const handleTeacherChange = (sectionId, timeSlotId, teacherId) => {
        const key = `${sectionId}-${timeSlotId}`;
        const currentSchedule = schedules[key];
        
        if (!currentSchedule) {
            setMessage('Please select a course first');
            return;
        }

        if (checkTeacherConflict(teacherId, timeSlotId, sectionId)) {
            setMessage('This teacher is already scheduled at this time');
            return;
        }

        setSchedules({
            ...schedules,
            [key]: {
                ...currentSchedule,
                teacher_id: teacherId
            }
        });

        setMessage('');
    };

    const saveSchedule = async (sectionId, timeSlotId) => {
        const key = `${sectionId}-${timeSlotId}`;
        const schedule = schedules[key];
        
        if (!schedule) return;

        try {
            await axios.post('http://localhost:5000/api/scheduling/schedule', schedule);
            setMessage('Schedule saved successfully');
            loadSchedules(); // Reload to get updated data
        } catch (error) {
            console.error('Error saving schedule:', error);
            setMessage('Error saving schedule');
        }
    };

    const saveAllSchedules = async () => {
        try {
            const savePromises = Object.values(schedules).map(schedule =>
                axios.post('http://localhost:5000/api/scheduling/schedule', schedule)
            );

            await Promise.all(savePromises);
            setMessage(`All schedules saved successfully`);
            loadSchedules();
        } catch (error) {
            console.error('Error saving schedules:', error);
            setMessage('Error saving schedules');
        }
    };

    const copyToAllDays = async () => {
        if (Object.keys(schedules).length === 0) {
            setMessage('No schedules to copy. Please create some schedules first.');
            return;
        }

        try {
            // First save current schedules
            await saveAllSchedules();
            
            // Then copy to other days
            const targetDays = days.filter(d => d.value !== selectedDay).map(d => d.value);
            
            await axios.post('http://localhost:5000/api/scheduling/schedule/copy-day-to-week', {
                from_day: selectedDay,
                to_days: targetDays
            });

            setMessage('Schedule copied to all days successfully');
        } catch (error) {
            console.error('Error copying schedules:', error);
            setMessage('Error copying schedules');
        }
    };

    const getTeachersForCourse = (courseId) => {
        const course = courses.find(c => c.id == courseId);
        if (!course) return [];
        return teachers.filter(t => t.subject === course.subject);
    };

    if (loading) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
    }

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1>Class Schedule Management</h1>

            {message && (
                <div style={{
                    padding: '10px',
                    margin: '10px 0',
                    backgroundColor: message.includes('Error') ? '#ffebee' : '#e8f5e8',
                    color: message.includes('Error') ? '#c62828' : '#2e7d32',
                    border: '1px solid ' + (message.includes('Error') ? '#c62828' : '#2e7d32'),
                    borderRadius: '4px'
                }}>
                    {message}
                </div>
            )}

            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <label>Select Day:</label>
                <select 
                    value={selectedDay} 
                    onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                    style={{ padding: '5px', fontSize: '14px' }}
                >
                    {days.map(day => (
                        <option key={day.value} value={day.value}>{day.label}</option>
                    ))}
                </select>

                <button
                    onClick={saveAllSchedules}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#d4b983',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Save All Changes
                </button>

                <button 
                    onClick={copyToAllDays}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Copy to All Days
                </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse',
                    backgroundColor: 'white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f5f5f5' }}>
                            <th style={{
                                border: '1px solid #ddd',
                                padding: '12px',
                                textAlign: 'left',
                                minWidth: '150px'
                            }}>
                                Time Slot
                            </th>
                            {classSections.map(section => (
                                <th key={section.id} style={{
                                    border: '1px solid #ddd',
                                    padding: '12px',
                                    textAlign: 'center',
                                    minWidth: '200px'
                                }}>
                                    <div>Room {section.room_number}</div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                        {section.room_name}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {timeSlots.map(slot => (
                            <tr key={slot.id}>
                                <td style={{ 
                                    border: '1px solid #ddd', 
                                    padding: '12px',
                                    backgroundColor: '#fafafa'
                                }}>
                                    <div style={{ fontWeight: 'bold' }}>{slot.slot_name}</div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                        {slot.start_time} - {slot.end_time}
                                    </div>
                                </td>
                                {classSections.map(section => {
                                    const key = `${section.id}-${slot.id}`;
                                    const schedule = schedules[key] || {};
                                    const selectedCourse = courses.find(c => c.id == schedule.course_id);
                                    const selectedTeacher = teachers.find(t => t.id == schedule.teacher_id);
                                    const availableTeachers = selectedCourse ? getTeachersForCourse(selectedCourse.id) : [];
                                    const hasConflict = selectedTeacher && checkTeacherConflict(selectedTeacher.id, slot.id, section.id);

                                    return (
                                        <td key={section.id} style={{ 
                                            border: '1px solid #ddd', 
                                            padding: '8px',
                                            backgroundColor: hasConflict ? '#ffebee' : 'white'
                                        }}>
                                            <div style={{ marginBottom: '5px' }}>
                                                <select
                                                    value={schedule.course_id || ''}
                                                    onChange={(e) => handleCourseChange(section.id, slot.id, parseInt(e.target.value) || null)}
                                                    style={{ 
                                                        width: '100%', 
                                                        padding: '4px', 
                                                        fontSize: '12px',
                                                        marginBottom: '5px'
                                                    }}
                                                >
                                                    <option value="">Select Course</option>
                                                    {courses.map(course => (
                                                        <option key={course.id} value={course.id}>
                                                            {course.course_code}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {selectedCourse && (
                                                <div style={{ marginBottom: '5px' }}>
                                                    <select
                                                        value={schedule.teacher_id || ''}
                                                        onChange={(e) => handleTeacherChange(section.id, slot.id, parseInt(e.target.value) || null)}
                                                        style={{ 
                                                            width: '100%', 
                                                            padding: '4px', 
                                                            fontSize: '12px',
                                                            backgroundColor: hasConflict ? '#ffcdd2' : 'white'
                                                        }}
                                                    >
                                                        <option value="">Select Teacher</option>
                                                        {availableTeachers.map(teacher => (
                                                            <option key={teacher.id} value={teacher.id}>
                                                                {teacher.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            {selectedCourse && (
                                                <div style={{ fontSize: '11px', color: '#333' }}>
                                                    <div style={{ fontWeight: 'bold' }}>
                                                        {selectedCourse.course_name}
                                                    </div>
                                                    {selectedTeacher && (
                                                        <div style={{ color: hasConflict ? '#c62828' : '#666' }}>
                                                            {selectedTeacher.name}
                                                            {hasConflict && (
                                                                <div style={{ color: '#c62828', fontSize: '10px' }}>
                                                                    ⚠️ CONFLICT!
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminScheduling;