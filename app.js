// 将本地存储配置
// const upload = multer({ dest: 'uploads/' });

// 替换为导入您的 Cloudinary 配置
const { multerCloudinary } = require('./routes/upload'); 