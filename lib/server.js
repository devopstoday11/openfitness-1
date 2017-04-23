import express from 'express';
import { port } from '../env';

const app = express();

app.get('/', res => {
  res.json({ success: true });
});

app.listen(port);
