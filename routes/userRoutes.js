import express from 'express';
import { register, login, logout, getOtherUsers, getProfile, deleteAccount, updateProfile } from '../controllers/userController.js';
import isAuthenticated from '../middleware/isAuthenticated.js';

const router = express.Router();

router.route('/register').post(register);
router.route('/login').post(login);
router.route('/logout').get(logout);
router.route('/profile').get(isAuthenticated, getProfile);
router.route('/profile').put(isAuthenticated, updateProfile);
router.route('/delete').delete(isAuthenticated, deleteAccount);
router.route('/').get(isAuthenticated, getOtherUsers);

export default router;