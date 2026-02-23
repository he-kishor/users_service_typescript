import { Router } from 'express';
import userRoute from '../routes/users';
import oauthRoute from '../routes/oath2';

const router = Router();


router.use('/users', userRoute); // All /users-related routes will be forwarded to the user microservice
router.use('/oauth2',oauthRoute); // All /oauth2-related routes will be forwarded to the oauth microservice
module.exports = router;


export default router;