// authController.js
const authService = require('../services/authService');

class AuthController {
    async register(req, res) {
        try {
            const { username, email, password } = req.body;
            
            if (!username || !email || !password) {
                return res.status(400).json({ message: 'All fields are required' });
            }

            const { user, accessToken, refreshToken } = await authService.registerUser(req.body);
            
            // Set refresh token in HTTP-only cookie
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            res.status(201).json({
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                },
                accessToken
            });
        } catch (error) {
            if (error.code === 11000) {
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

            const { user, accessToken, refreshToken } = await authService.loginUser(email, password);
            
            // Set refresh token in HTTP-only cookie
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            res.json({
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                },
                accessToken
            });
        } catch (error) {
            res.status(401).json({ message: error.message });
        }
    }

    async refresh(req, res) {
        try {
            const refreshToken = req.cookies.refreshToken;
            
            if (!refreshToken) {
                return res.status(401).json({ message: 'Refresh token required' });
            }

            const tokens = await authService.refreshToken(refreshToken);
            
            // Set new refresh token in HTTP-only cookie
            res.cookie('refreshToken', tokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            res.json({ accessToken: tokens.accessToken });
        } catch (error) {
            res.status(401).json({ message: 'Invalid refresh token' });
        }
    }

    async logout(req, res) {
        try {
            await authService.logout(req.user._id);
            
            // Clear refresh token cookie
            res.clearCookie('refreshToken');
            
            res.json({ message: 'Logged out successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
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
