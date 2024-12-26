import db from "../utils/db.js"; // DB 연결 파일

const RoomModel = {
    create: async ({ branchCode, customerTel }) => {
        const query = `INSERT INTO chat_rooms (branch_code, customer_tel, created_at) 
                       VALUES (?, ?, NOW())
                       ON DUPLICATE KEY UPDATE created_at = NOW()`;
        const [result] = await db.query(query, [branchCode, customerTel]);
        return result.insertId;
    },

    find: async ({ branchCode, customerTel }) => {
        const query = `SELECT * FROM chat_rooms WHERE branch_code = ? AND customer_tel = ?`;
        const [rows] = await db.query(query, [branchCode, customerTel]);
        return rows[0];
    },

    // 특정 지점의 채팅방 목록 가져오기
    findByBranch: async (branchCode) => {
        const query = `SELECT * FROM chat_rooms WHERE branch_code = ?`;
        const [rows] = await db.query(query, [branchCode]);
        return rows;
    },


};

export default RoomModel;
