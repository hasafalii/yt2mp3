import ytdl from 'ytdl-core';
import { exec } from 'child_process';
import fs from 'fs';
import nodemailer from 'nodemailer';

const codes = {}; // Store verification codes temporarily

export async function sendVerificationEmail(req, res) {
    const { email } = req.body;

    if (!email) {
        return res.status(400).send('Email is required');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit code
    codes[email] = code;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'your-email@gmail.com',
            pass: 'your-email-password',
        },
    });

    const mailOptions = {
        from: 'your-email@gmail.com',
        to: email,
        subject: 'Your Verification Code',
        text: `Your verification code is: ${code}`,
    };

    try {
        await transporter.sendMail(mailOptions);
        res.send('Verification code sent to your email');
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).send('Error sending email');
    }
}

export async function verifyCode(req, res) {
    const { email, code } = req.body;

    if (!email || !code) {
        return res.status(400).send('Email and code are required');
    }

    if (codes[email] === code) {
        delete codes[email];
        res.send('Code verified');
    } else {
        res.status(400).send('Invalid code');
    }
}

export async function downloadVideo(req, res) {
    const { email, url } = req.body;

    if (!email || !codes[email]) {
        return res.status(400).send('Please verify your email first');
    }

    if (!ytdl.validateURL(url)) {
        return res.status(400).send('Invalid YouTube URL');
    }

    try {
        const videoInfo = await ytdl.getInfo(url);
        const title = videoInfo.videoDetails.title.replace(/[^a-zA-Z0-9]/g, '_');
        const outputPath = `/tmp/${title}.mp3`;

        const videoStream = ytdl(url, { quality: 'highestaudio' });
        const ffmpegCommand = `ffmpeg -i pipe: -vn "${outputPath}"`;

        const ffmpegProcess = exec(ffmpegCommand);
        videoStream.pipe(ffmpegProcess.stdin);

        ffmpegProcess.on('close', () => {
            res.setHeader('Content-Disposition', `attachment; filename="${title}.mp3"`);
            res.setHeader('Content-Type', 'audio/mpeg');
            const readStream = fs.createReadStream(outputPath);
            readStream.pipe(res);
            readStream.on('close', () => fs.unlinkSync(outputPath));
        });
    } catch (error) {
        console.error('Error during conversion:', error);
        res.status(500).send('Error during conversion');
    }
}