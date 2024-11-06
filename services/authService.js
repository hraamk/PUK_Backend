const jwt = require('jsonwebtoken');
const User = require('../models/user');

class AuthService {
    generateAccessToken(userId) {
        return jwt.sign(
            { userId },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: '15m' } // Short-lived access token
        );
    }

    generateRefreshToken(userId) {
        return jwt.sign(
            { userId },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' } // Longer-lived refresh token
        );
    }

    async registerUser(userData) {
        try {
            console.log('Attempting to create user:', userData.email);
            
            const user = new User({
                username: userData.username,
                email: userData.email,
                password: userData.password
            });

            await user.save();
            console.log('User successfully saved to MongoDB:', user._id);

            const accessToken = this.generateAccessToken(user._id);
            const refreshToken = this.generateRefreshToken(user._id);

            // Save refresh token hash in user document
            user.refreshToken = refreshToken;
            await user.save();

            return { 
                user,
                accessToken,
                refreshToken
            };
        } catch (error) {
            console.error('Error saving user to MongoDB:', error);
            throw error;
        }
    }

    async loginUser(email, password) {
        try {
            console.log('Attempting to find user:', email);
            
            const user = await User.findOne({ email });
            if (!user) {
                throw new Error('Invalid login credentials');
            }

            const isPasswordMatch = await user.comparePassword(password);
            if (!isPasswordMatch) {
                throw new Error('Invalid login credentials');
            }

            const accessToken = this.generateAccessToken(user._id);
            const refreshToken = this.generateRefreshToken(user._id);

            // Save refresh token hash in user document
            user.refreshToken = refreshToken;
            await user.save();

            return { 
                user,
                accessToken,
                refreshToken
            };
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async refreshToken(refreshToken) {
        try {
            if (!refreshToken) {
                throw new Error('Refresh token required');
            }

            // Verify refresh token
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            
            // Find user and check if refresh token matches
            const user = await User.findById(decoded.userId);
            if (!user || user.refreshToken !== refreshToken) {
                throw new Error('Invalid refresh token');
            }

            // Generate new tokens
            const accessToken = this.generateAccessToken(user._id);
            const newRefreshToken = this.generateRefreshToken(user._id);

            // Update refresh token in database
            user.refreshToken = newRefreshToken;
            await user.save();

            return {
                accessToken,
                refreshToken: newRefreshToken
            };
        } catch (error) {
            throw new Error('Invalid refresh token');
        }
    }

    async logout(userId) {
        try {
            // Clear refresh token in database
            await User.findByIdAndUpdate(userId, { refreshToken: null });
            return true;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new AuthService();