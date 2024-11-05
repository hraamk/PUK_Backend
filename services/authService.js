const jwt = require('jsonwebtoken');
const User = require('../models/user');

class AuthService {
    generateToken(userId) {
        return jwt.sign(
            { userId: userId },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
    }

    async registerUser(userData) {
        try {
            const user = new User(userData);
            await user.save();
            const token = this.generateToken(user._id);
            return { user, token };
        } catch (error) {
            throw error;
        }
    }

    async loginUser(email, password) {
        try {
            const user = await User.findOne({ email });
            if (!user) {
                throw new Error('Invalid login credentials');
            }

            const isPasswordMatch = await user.comparePassword(password);
            if (!isPasswordMatch) {
                throw new Error('Invalid login credentials');
            }

            const token = this.generateToken(user._id);
            return { user, token };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new AuthService();
