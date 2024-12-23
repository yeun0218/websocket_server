import express from "express";
import db from "./utils/db.js"; // MariaDB 연결 가져오기

const app = express();
app.use(express.json()); // JSON 요청 파싱

// 간단한 라우트 예제
app.get("/customers", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM customer");
        res.json({ ok: true, data: rows });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;