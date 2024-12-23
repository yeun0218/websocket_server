import db from "../utils/db.js"; // 데이터베이스 연결 모듈 가져오기

// chatController 객체 선언
const chatController = {
    // 메시지 저장 함수
    saveChatMessage: async (messageData) => {
        const { sender_id,sender_tel, sender_type, message } = messageData;

        try {
            // 고객 메시지 처리 (전화번호 사용)
            if (sender_type === 'customer' && sender_tel) {
                const query = `
                    INSERT INTO chat_messages (message, sender_tel, sender_type) 
                    VALUES (?, ?, 'customer')
                `;
                const params = [message, sender_tel];
                const [result] = await db.execute(query, params);
                return { id: result.insertId, ...messageData, created_at: new Date() };
            }
            
            // 상담원 메시지 처리 (아이디 사용)
            else if (sender_type === 'branch' && sender_id) {
                const query = `
                    INSERT INTO chat_messages (message, sender_id, sender_type) 
                    VALUES (?, ?, 'branch')
                `;
                const params = [message, sender_id];
                const [result] = await db.execute(query, params);
                return { id: result.insertId, ...messageData, created_at: new Date() };
            } else {
                throw new Error("Invalid data: Sender type or ID is missing");
            }
        } catch (error) {
            console.error("Error saving chat message:", error);
            throw error;
        }
    },

    // 고객 ID로 메시지 이력 조회
    getMessagesByCustomerId: async (customerTel) => {
        if (!customerTel) {
            throw new Error("customerTel is required to fetch messages.");
        }
        try {
            const query = `
                SELECT * FROM chat_messages 
                WHERE sender_tel = ?
                ORDER BY created_at
            `;
            const [messages] = await db.execute(query, [customerTel ?? null]);
            return messages;
        } catch (error) {
            console.error("Error fetching messages by customerId:", error);
            throw error;
        }
    },

    // 브랜치 코드로 메시지 가져오기 
    getMessagesByBranch: async (branchCode) => {
        try {
          const query = `
            SELECT * 
            FROM chat_messages 
            WHERE sender_id = ? OR sender_tel IN (
              SELECT customer_tel
              FROM customer
              WHERE branch_code = ?
            )
            ORDER BY created_at ASC;
          `;
          const [rows] = await db.query(query, [branchCode, branchCode]);
          return rows;
        } catch (error) {
          console.error("Error in getMessagesByBranch:", error);
          throw error;
        }
      },
    

// 미확인 메시지 조회
    getUnreadMessages: async (senderTel) => {
        try {
            const query = `
                SELECT * FROM chat_messages 
                WHERE sender_tel = ? AND is_read = 0
                ORDER BY created_at
            `;
            const [messages] = await db.execute(query, [senderTel]);
            return messages;
        } catch (error) {
            console.error("Error fetching unread messages:", error);
            throw error;
        }
    },

// 메시지 읽음 처리
    markMessageAsRead: async (messageId) => {
        try {
            const query = `
                UPDATE chat_messages 
                SET is_read = 1 
                WHERE id = ?
            `;
            const [result] = await db.execute(query, [messageId]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error("Error marking message as read:", error);
            throw error;
        }
    },


// 채팅방 관련 코드
    findOrCreateRoom : async (customerTel, branchCode) => {
        const existingRoom = await db.query("SELECT * FROM chat_rooms WHERE customer_tel = ? AND branch_code = ?", [customerTel, branchCode]);
        if (existingRoom.length > 0) {
            return existingRoom[0];
        }

        const result = await db.query("INSERT INTO chat_rooms (customer_tel, branch_code) VALUES (?, ?)", [customerTel, branchCode]);
        return { id: result.insertId, customerTel, branchCode };
    },

    getRoomsByBranch : async (branchCode) => {
        return await db.query("SELECT * FROM chat_rooms WHERE branch_code = ?", [branchCode]);
    },

    getMessagesByRoom : async (roomId) => {
        return await db.query("SELECT * FROM chat_messages WHERE room_id = ? ORDER BY created_at ASC", [roomId]);
    }

};

export default chatController; // chatController 객체를 default export