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

db.on("error", (err) => {
    console.error("Database error", err);
    if(err.code === "protodol_connection_lost") {
        db = mysql.createPool(db.config);
        console.log("reconnected to the db");
    }
});
export default db;
