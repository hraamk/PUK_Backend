const authService = require('../services/authService');

class AuthController {
    async register(req, res) {
        try {
            const { username, email, password } = req.body;
            
            if (!username || !email || !password) {
                return res.status(400).json({ message: 'All fields are required' });
            }

            const { user, token } = await authService.registerUser(req.body);
            res.status(201).json({
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                },
                token
            });
        } catch (error) {
            if (error.code === 11000) { // Duplicate key error
                res.status(400).json({ message: 'Email or username already exists' });
            } else {
                res.status(400).json({ message: error.message });
            }
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;
            
            if (!email || !password) {
                return res.status(400).json({ message: 'Email and password are required' });
            }

            const { user, token } = await authService.loginUser(email, password);
            res.json({
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                },
                token
            });
        } catch (error) {
            res.status(401).json({ message: error.message });
        }
    }

    async getProfile(req, res) {
        try {
            res.json({
                user: {
                    id: req.user._id,
                    username: req.user.username,
                    email: req.user.email,
                    role: req.user.role
                }
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}

module.exports = new AuthController();
