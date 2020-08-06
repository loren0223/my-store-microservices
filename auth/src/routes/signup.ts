import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import jwt from 'jsonwebtoken';
import { User } from '../models/user';
import { validateRequest, BadRequestError } from '@agreejwc/common';

const router = express.Router();

router.post(
  '/api/users/signup',
  [
    body('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Invalid Email'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 8, max: 16 })
      .withMessage('Password must be 8~16 characters'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // validation
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new BadRequestError('Email in use');
    }

    // create user
    const user = User.build({ email, password });
    await user.save();

    // create json web token & add into cookie
    const userJwt = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET_KEY!
    );
    req.session = {
      jwt: userJwt,
    };

    // response
    res.status(201).send(user);
  }
);

export { router as signupRouter };
