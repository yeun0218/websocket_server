// 예시: 대화 이력을 데이터베이스에서 가져오는 함수 (MariaDB 사용)
import db from '../utils/db.js'; // 데이터베이스 쿼리 실행 함수 (MariaDB 연결)

export async function getMessagesByCustomerId(customerTel) {
    try {
        // 고객 ID에 해당하는 메시지들을 데이터베이스에서 가져오는 쿼리
        const result = await query(
            'SELECT * FROM chat_messages WHERE customer_tel= ? ORDER BY created_at DESC',
            [customerId]
        );
        return result; // 가져온 메시지 리스트 반환
    } catch (error) {
        console.error("Error fetching messages:", error);
        throw new Error('Unable to fetch messages');
    }
}
