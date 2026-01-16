import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User } from '../entities/user.entity';
import { AuthRequest } from '../middleware/auth.middleware';

const generateToken = (userId: string): string => {
    const options: SignOptions = {
        expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn']
    };
    return jwt.sign({ userId }, process.env.JWT_SECRET!, options);
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required', message: 'Email and password are required' });
        }

        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials', message: 'Invalid credentials' });
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials', message: 'Invalid credentials' });
        }

        const token = generateToken(user.id);

        res.json({
            error: null,
            message: 'Login successful',
            token,
            user: user.toJSON()
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error', message: 'Server error' });
    }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
    res.json({ error: null, user: req.user?.toJSON() });
};
