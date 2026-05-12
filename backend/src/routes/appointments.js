const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { sendAppointmentConfirmation, sendAppointmentCancellation } = require('../services/emailService');

// CREATE appointment
router.post('/', verifyToken, async (req, res) => {
  const { appointmentTime, durationMinutes, notes } = req.body;
  
  if (!appointmentTime) {
    return res.status(400).json({ error: 'Appointment time is required' });
  }
  
  try {
    const appointment = await Appointment.create({
      userId: req.userId,
      appointmentTime: new Date(appointmentTime),
      durationMinutes: durationMinutes || 15,
      notes
    });
    
    // Send confirmation email
    await sendAppointmentConfirmation(req.userEmail, appointment);
    
    res.json({
      appointment,
      message: 'Appointment scheduled. Please ensure you have WhatsApp and have added +1-647-228-1215 as a contact before the call.',
      cancellation_link: `${process.env.FRONTEND_URL}/cancel-appointment/${appointment.cancellation_token}`
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET user's appointments
router.get('/my-appointments', verifyToken, async (req, res) => {
  try {
    const appointments = await Appointment.getUserAppointments(req.userId);
    res.json({ appointments });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// CANCEL appointment via token (no auth required)
router.delete('/cancel/:token', async (req, res) => {
  const { token } = req.params;
  
  try {
    const cancelled = await Appointment.cancelByToken(token);
    if (!cancelled) {
      return res.status(404).json({ error: 'Invalid or already cancelled appointment' });
    }
    
    // Send cancellation email if we have user email
    if (cancelled.user_id) {
      const user = await User.findById(cancelled.user_id);
      if (user) {
        await sendAppointmentCancellation(user.email, cancelled);
      }
    }
    
    res.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// RESCHEDULE appointment
router.put('/reschedule/:appointmentId', verifyToken, async (req, res) => {
  const { appointmentId } = req.params;
  const { newTime } = req.body;
  
  try {
    const rescheduled = await Appointment.reschedule(appointmentId, new Date(newTime), req.userId);
    if (!rescheduled) {
      return res.status(404).json({ error: 'Appointment not found or not authorized' });
    }
    
    res.json({ message: 'Appointment rescheduled', appointment: rescheduled });
  } catch (error) {
    console.error('Reschedule appointment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET available time slots
router.get('/available-slots', async (req, res) => {
  const { date } = req.query;
  
  if (!date) {
    return res.status(400).json({ error: 'Date parameter is required' });
  }
  
  try {
    const slots = await Appointment.getAvailableSlots(new Date(date));
    res.json({ slots });
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// RESCHEDULE appointment (cancel old + book new)
router.post('/reschedule/:token', async (req, res) => {
    const { token } = req.params;
    const { appointmentTime } = req.body;
    
    if (!appointmentTime) return res.status(400).json({ error: 'New appointment time is required' });
    
    try {
        // Cancel old
        const cancelled = await Appointment.cancelByToken(token);
        if (!cancelled) return res.status(404).json({ error: 'Invalid or already cancelled appointment' });
        
        // Send cancellation notice
        if (cancelled.user_id) {
            const user = await User.findById(cancelled.user_id);
            if (user?.email) await sendAppointmentCancellation(user.email, cancelled);
        }
        
        // Book new
        const appointment = await Appointment.create({
            userId: cancelled.user_id,
            appointmentTime: new Date(appointmentTime),
            durationMinutes: cancelled.duration_minutes || 15,
            notes: (cancelled.notes || '') + ' [Rescheduled]'
        });
        
        // Send new confirmation
        if (cancelled.user_id) {
            const user = await User.findById(cancelled.user_id);
            if (user?.email) await sendAppointmentConfirmation(user.email, appointment);
        }
        
        res.json({ 
            message: 'Appointment rescheduled successfully',
            appointment,
            cancellation_link: `${process.env.FRONTEND_URL}/cancel-appointment/${appointment.cancellation_token}`
        });
    } catch (error) {
        console.error('Reschedule error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;