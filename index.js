import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendVerificationEmail, verifyCode, downloadVideo } from './api/download.js';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/send-verification', sendVerificationEmail);
app.post('/api/verify-code', verifyCode);
app.post('/api/download', downloadVideo);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});