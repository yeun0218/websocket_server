import mysql from "mysql2/promise";

const db = mysql.createPool({
    host: "svc.sel4.cloudtype.app", // Cloudtype에서 제공하는 호스트
    port: 30209,                   // 포트 번호
    user: "root",                  // 사용자명
    password: "1820",              // 비밀번호
    database: "acorn",             // 데이터베이스 이름
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// 연결 확인 함수
const testConnection = async () => {
    try {
        const connection = await db.getConnection();
        console.log("Database connection successful");
        connection.release(); // 연결 반환
    } catch (error) {
        console.error("Database connection failed", error);
        process.exit(1); // 심각한 오류일 경우 프로세스 종료
    }
};

// 서버 시작 시 연결 확인
testConnection();

export default db;

