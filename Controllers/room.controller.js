import db from "../utils/db.js"; // DB 연결 파일
import RoomModel from "../Models/room.js"; 

const createOrFindRoom = async ({ branchCode, customerTel }) => {
    try {
        // 채팅방 찾기
        let room = await RoomModel.find({ branchCode, customerTel });
        if (!room) {
            // 채팅방이 없으면 새로 생성
            room = await RoomModel.create({ branchCode, customerTel });
            room = {  branch_code: branchCode, customer_tel: customerTel };

        }
        return { ok: true, data: room };
    } catch (error) {
        console.error("Error in createOrFindRoom:", error);
        return { ok: false, error: error.message };
    }
};

const getRoomsByBranch = async (branchCode) => {
    try {
        console.log("Fetching rooms for branch code:", branchCode); // 디버깅 로그
        const rooms = await RoomModel.findByBranch(branchCode);
        return rooms;
    } catch (error) {
        console.error("Error in getRoomsByBranch:", error);
        throw new Error("지점 채팅방 목록 조회 중 문제가 발생했습니다.");
    }
};

const findByCustomerTel = async (customerTel) => {
    const query = `
            SELECT * FROM chat_rooms
            WHERE customer_tel = ?`;
        const [rows] = await db.query(query, [customerTel]);
        return rows[0]; // 방이 존재하면 첫 번째 결과 반환
};



export default { createOrFindRoom, getRoomsByBranch, findByCustomerTel};
