import { createServer } from "http";
import app from "./app.js"; // Express 앱 가져오기
import { Server } from "socket.io"; // 웹소켓을 위한 서버
import dotenv from "dotenv";
import io from "./utils/io.js"; // io 핸들러 가져오기

dotenv.config(); // 환경 변수 로드

const httpServer = createServer(app);

const setIo = new Server(httpServer, {
    cors :{ // 웹소켓 서버 생성
        origin:["http://localhost:3000" ,"http://localhost:3001"],
        methods:["GET", "POST"]
    }
});

// 소켓 IO 핸들링 함수 호출
io(setIo);
// io함수 넘겨받기 

httpServer.listen(process.env.PORT, () => {
    console.log("server listening on port", process.env.PORT);
    // 서버 열어두기 
})