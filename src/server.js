const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const thuocRoutes = require('./routes/thuocRoutes');
const lothuocRoutes = require('./routes/lothuocRoutes');
const doitacRoutes = require('./routes/doitacRoutes');
const donhangRoutes = require('./routes/donhangRoutes');
const chitietdonhangRoutes = require('./routes/chitietdonhangRoutes');
const donvitinhRoutes = require('./routes/donvitinhRoutes');
const taikhoanRoutes = require('./routes/taikhoanRoutes');
const vitrikhoRoutes = require('./routes/vitrikhoRoutes');
const phieukiemkeRoutes = require('./routes/phieukiemkeRoutes');
const chitietkiemkeRoutes = require('./routes/chitietkiemkeRoutes');
const thongkeRoutes = require('./routes/thongkeRoutes');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');
require('dotenv').config();


const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Tuyến đường (Route) chạy thử
app.get('/', (req, res) => {
    res.send("Backend Kho Thuốc đã sẵn sàng chiến đấu!");
});

//appuse
app.use('/api', thuocRoutes);
app.use('/api', lothuocRoutes);
app.use('/api', doitacRoutes);
app.use('/api', donhangRoutes);
app.use('/api', chitietdonhangRoutes);
app.use('/api', donvitinhRoutes);
app.use('/api', taikhoanRoutes);
app.use('/api', vitrikhoRoutes);
app.use('/api', phieukiemkeRoutes);
app.use('/api', chitietkiemkeRoutes);
app.use('/api', thongkeRoutes);

// 404 + Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại cổng: ${PORT}`);
});