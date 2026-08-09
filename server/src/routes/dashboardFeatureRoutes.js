const { Router } = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const wellness = require('../controllers/wellnessController');
const diet = require('../controllers/dietController');
const meditation = require('../controllers/meditationController');
const travel = require('../controllers/travelExtrasController');

const router = Router();

// Wellness scores & journey
router.get('/wellness/scores', verifyToken, wellness.getScores);
router.post('/wellness/assessment', verifyToken, wellness.submitAssessment);
router.patch('/wellness/journey/:id', verifyToken, wellness.toggleJourneyItem);

// Diet
router.get('/diet/profile', verifyToken, diet.getHealthProfile);
router.put('/diet/profile', verifyToken, diet.upsertHealthProfile);
router.get('/diet/meal-plans', verifyToken, diet.listMealPlans);
router.get('/diet/meal-plans/:id', verifyToken, diet.getMealPlan);
router.post('/diet/meal-plans/:id/log', verifyToken, diet.logMealCompliance);
router.get('/diet/logs', verifyToken, diet.myMealLogs);
router.get('/diet/slots', verifyToken, diet.listOpenSlots);
router.post('/diet/slots/:id/book', verifyToken, diet.bookSlot);
router.get('/diet/bookings', verifyToken, diet.myBookings);
router.post('/diet/slots', verifyToken, requireRole('instructor', 'admin'), diet.createSlot);
router.post('/diet/meal-plans', verifyToken, requireRole('admin', 'instructor'), diet.adminUpsertMealPlan);

// Meditation
router.get('/meditation', verifyToken, meditation.listMeditations);
router.get('/meditation/stats', verifyToken, meditation.myMeditationStats);
router.get('/meditation/daily', verifyToken, meditation.getDailyPractice);
router.post('/meditation/daily', verifyToken, meditation.saveDailyPractice);
router.post('/meditation/:id/favorite', verifyToken, meditation.toggleFavorite);
router.post('/meditation/:id/play', verifyToken, meditation.recordPlay);
router.post('/meditation', verifyToken, requireRole('admin', 'instructor'), meditation.adminUpsertMeditation);

// Travel
router.get('/travel/destinations', verifyToken, travel.listDestinations);
router.get('/travel/retreats', verifyToken, travel.listRetreats);
router.get('/travel/retreats/:id', verifyToken, travel.getRetreat);
router.post('/travel/retreats/:id/save', verifyToken, travel.toggleSaveRetreat);
router.post('/travel/retreats/:id/waitlist', verifyToken, travel.joinWaitlist);
router.post('/travel/destinations', verifyToken, requireRole('admin'), travel.adminUpsertDestination);
router.post('/travel/retreats', verifyToken, requireRole('admin'), travel.adminUpsertRetreat);

// Journal
router.get('/journal', verifyToken, travel.listJournal);
router.post('/journal', verifyToken, travel.createJournal);
router.get('/journal/report', verifyToken, travel.journalReport);

// Events & courses
router.get('/events', verifyToken, travel.listEvents);
router.get('/courses', verifyToken, travel.listCourses);
router.post('/courses/:id/enroll', verifyToken, travel.enrollCourse);
router.post('/events', verifyToken, requireRole('admin'), travel.adminUpsertEvent);
router.post('/courses', verifyToken, requireRole('admin'), travel.adminUpsertCourse);

module.exports = router;
