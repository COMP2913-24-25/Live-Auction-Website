const nodemailer = require('nodemailer');
const express = require('express');
const router = express.Router();

// 创建邮件传输器 - 使用 Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Gmail 邮箱
    pass: process.env.EMAIL_PASSWORD // Gmail 密码或应用专用密码
  }
});

// 添加验证
transporter.verify(function(error, success) {
  if (error) {
    console.log('SMTP server connection error:', error);
  } else {
    console.log('SMTP server connection successful');
  }
});

// 发送中标通知邮件
const sendWinningBidEmail = async (userEmail, auctionTitle, finalPrice) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Congratulations! You won the auction!',
      html: `
        <h1>Congratulations!</h1>
        <p>You have won the auction for "${auctionTitle}"</p>
        <p>Final price: $${finalPrice}</p>
        <p>Please proceed with the payment to complete the transaction.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Winning bid email sent successfully');
  } catch (error) {
    console.error('Error sending winning bid email:', error);
  }
};

// 测试邮件发送的路由（可选）
router.post('/test-email', async (req, res) => {
  try {
    const { email } = req.body;
    await sendWinningBidEmail(email, 'Test Item', 100);
    res.json({ message: 'Test email sent successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send test email' });
  }
});

module.exports = {
  router,
  sendWinningBidEmail
}; 