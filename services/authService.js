const jwt = require('jsonwebtoken');
const User = require('../models/user');

class AuthService {
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

            const token = this.generateToken(user._id);
            return { user, token };
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

            console.log('User found in MongoDB:', user._id);

            const isPasswordMatch = await user.comparePassword(password);
            if (!isPasswordMatch) {
                throw new Error('Invalid login credentials');
            }

            const token = this.generateToken(user._id);
            return { user, token };
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    generateToken(userId) {
        return jwt.sign(
            { userId: userId },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
    }
}

module.exports = new AuthService();
