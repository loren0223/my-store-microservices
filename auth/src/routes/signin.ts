import express from 'express';

const router = express.Router();

router.post('/api/user/signin', (req, res) => {
  res.status(200).send({ message: 'success' });
});

export { router as signinRouter };
