import { Router } from 'express';

const router = Router();

// Define your routes here
router.get('/example', (req, res) => {
    res.send('This is an example route');
});

// Add more routes as needed

export default router;