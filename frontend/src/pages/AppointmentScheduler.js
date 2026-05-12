import React, { useState, useEffect } from 'react';

const AppointmentScheduler = ({ token, user }) => {
  const [appointments, setAppointments] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [showScheduler, setShowScheduler] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/appointments/my-appointments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setAppointments(data.appointments || []);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async (date) => {
    if (!date) return;
    try {
      const response = await fetch(`/api/appointments/available-slots?date=${date}`);
      const data = await response.json();
      setAvailableSlots(data.slots || []);
    } catch (error) {
      console.error('Failed to fetch slots:', error);
    }
  };

  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    fetchAvailableSlots(date);
  };

  const scheduleAppointment = async () => {
    if (!selectedSlot) {
      alert('Please select a time slot');
      return;
    }

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          appointmentTime: selectedSlot,
          durationMinutes: 15,
          notes
        })
      });

      if (response.ok) {
        alert('Appointment scheduled! Check your email for confirmation and cancellation link.');
        setShowScheduler(false);
        setSelectedSlot(null);
        setNotes('');
        fetchAppointments();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to schedule');
      }
    } catch (error) {
      console.error('Schedule error:', error);
      alert('Failed to schedule appointment');
    }
  };

  const cancelAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;

    try {
      const response = await fetch(`/api/appointments/reschedule/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'cancelled' })
      });

      if (response.ok) {
        alert('Appointment cancelled');
        fetchAppointments();
      }
    } catch (error) {
      console.error('Cancel error:', error);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      scheduled: <span className="badge scheduled">🟡 Scheduled</span>,
      confirmed: <span className="badge confirmed">🟢 Confirmed</span>,
      completed: <span className="badge completed">✅ Completed</span>,
      cancelled: <span className="badge cancelled">❌ Cancelled</span>
    };
    return badges[status] || <span className="badge">{status}</span>;
  };

  return (
    <div className="appointment-scheduler">
      <div className="scheduler-header">
        <h2>📅 WhatsApp Consultation Scheduling</h2>
        <p>
          Schedule a 15-minute consultation via WhatsApp with our divine agent.
          All calls are conducted via WhatsApp video/voice.
        </p>
        <div className="whatsapp-info">
          <span className="whatsapp-icon">📱</span>
          <span>Agent WhatsApp: <strong>+1 (647) 228-1215</strong></span>
          <span className="important">⚠️ You must add this number as a contact before the call!</span>
        </div>
      </div>

      {!showScheduler ? (
        <div className="appointments-list">
          <div className="list-header">
            <h3>Your Appointments</h3>
            <button className="new-appointment-btn" onClick={() => setShowScheduler(true)}>
              + New Appointment
            </button>
          </div>

          {loading ? (
            <p>Loading appointments...</p>
          ) : appointments.length === 0 ? (
            <div className="no-appointments">
              <p>You have no appointments scheduled.</p>
              <button className="schedule-btn" onClick={() => setShowScheduler(true)}>
                Schedule Your First Appointment
              </button>
            </div>
          ) : (
            <div className="appointments-grid">
              {appointments.map(apt => (
                <div key={apt.id} className="appointment-card">
                  <div className="appointment-time">
                    {new Date(apt.appointment_time).toLocaleString()}
                  </div>
                  <div className="appointment-status">
                    {getStatusBadge(apt.status)}
                  </div>
                  <div className="appointment-duration">
                    ⏱️ {apt.duration_minutes} minutes
                  </div>
                  {apt.notes && <div className="appointment-notes">📝 {apt.notes}</div>}
                  {apt.status === 'scheduled' && (
                    <button 
                      className="cancel-appointment-btn"
                      onClick={() => cancelAppointment(apt.id)}
                    >
                      Cancel
                    </button>
                  )}
                  {apt.status === 'confirmed' && (
                    <div className="whatsapp-reminder">
                      📱 Call will be on WhatsApp at scheduled time
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="scheduler-form">
          <button className="back-btn" onClick={() => setShowScheduler(false)}>
            ← Back to Appointments
          </button>

          <div className="form-group">
            <label>Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {availableSlots.length > 0 && (
            <div className="time-slots">
              <label>Select Time (15-minute slots, 9 AM - 5 PM)</label>
              <div className="slots-grid">
                {availableSlots.map((slot, idx) => (
                  <button
                    key={idx}
                    className={`slot-btn ${selectedSlot === slot ? 'selected' : ''}`}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    {new Date(slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any specific topics you'd like to discuss?"
              rows="3"
            />
          </div>

          <div className="whatsapp-reminder-box">
            <p>📱 <strong>Before your call:</strong></p>
            <ol>
              <li>Add <strong>+1 (647) 228-1215</strong> to your WhatsApp contacts</li>
              <li>You will receive a confirmation email with a cancellation link</li>
              <li>Calls are 15 minutes maximum</li>
              <li>You can reschedule or cancel up to 1 hour before</li>
            </ol>
          </div>

          <button 
            className="schedule-submit-btn"
            onClick={scheduleAppointment}
            disabled={!selectedSlot}
          >
            Schedule Appointment
          </button>

          <p className="testing-note">⚠️ TESTING ONLY: Appointment scheduling is functional but for testing purposes.</p>
        </div>
      )}
    </div>
  );
};

export default AppointmentScheduler;