import express from 'express';

const router = express.Router();

router.get('/api/user/signout', (req, res) => {
  res.status(200).send({ message: 'success' });
});

export { router as signoutRouter };
