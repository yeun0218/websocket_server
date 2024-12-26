import customerController from "../Controllers/customer.controller.js";
import chatController from "../Controllers/chat.controller.js";
import roomController from "../Controllers/room.controller.js";

export default function (io) {
    const branchSocketId = {}; // 지점 소켓 ID 관리
    const customerSocketIds = {}; // 고객 소켓 ID 관리
    const customers = {}; // 모든 고객 정보 저장
    const BRANCH_CODE = "B004"; // 고정된 지점 코드

    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);

        // **고객 로그인**
        socket.on("customerLogin", async (customerTel, cb) => {
            console.log("Received customerTel:", customerTel); // 디버깅용 로그
            
            if (!customerTel) {
                console.error("customerTel is undefined or empty");
                return cb({ ok: false, message: "전화번호가 제공되지 않았습니다." });
              }

            try {
                console.log(`Customer login attempt: ${customerTel}`);
                const customer = await customerController.getCustomerById(customerTel);

                if (!customer) {
                    console.error(`Customer not found: ${customerTel}`);
                    return cb({ ok: false, message: "고객 정보를 찾을 수 없습니다." });
                }

                console.log("customer : ", customer);
                // 고객 소켓 ID 저장
                customerSocketIds[customerTel] = socket.id;
                customers[customerTel] = { tel: customerTel, name: customer.customer_name, id: customer.customer_id }; // 고객 정보 저장
                socket.customerTel = customerTel;

                console.log("Updated customers object:", customers);

                // 채팅방 생성 또는 가져오기
                const room = await roomController.createOrFindRoom({ branchCode: "B004", customerTel });

                // 고객용 방 생성
                const roomName = `room_branch_${BRANCH_CODE}`;
                socket.join(roomName);
                console.log(`Customer joined room: ${roomName}`);

                // 지점에 고객 연결 알림
                if (branchSocketId[BRANCH_CODE]) {
                    io.to(branchSocketId[BRANCH_CODE]).emit("customerConnected", {
                        customerTel,
                        room,
                        customers: Object.values(customers),
                    });
                }

                cb({ ok: true, customer: { ...customer, customerTel }, room });
            } catch (error) {
                console.error("Error during customer login:", error);
                cb({ ok: false, error: "고객 로그인 중 문제가 발생했습니다." });
            }
        });

        // **지점 연결**
        socket.on("branchLogin", async (cb) => {
            try {
                console.log(`Branch login for code: ${BRANCH_CODE}`);
                branchSocketId[BRANCH_CODE] = socket.id;
                //socket.branchCode = BRANCH_CODE;

                
                // 지점용 방 생성: 고객 이름을 기반으로
                Object.values(customers).forEach((customer) => {
                    const roomName = `room_customer_${customer.name}`;
                    socket.join(roomName);
                    console.log(`Branch joined room: ${roomName}`);
                });
                const rooms = await roomController.getRoomsByBranch(BRANCH_CODE);
                console.log(`Fetched rooms for branch: ${rooms}`);
                
                const customerList = Object.values(customers);
                console.log("customer : ", customerList);
                // 고객 리스트 반환
                if (typeof cb === "function") {
                    console.log("Returning customers:", Object.values(customers)); // 디버깅
                    cb({ ok: true, customers:  customerList});
                }

            } catch (error) {
                console.error("Error during branch login:", error);
                if (typeof cb === "function") {
                    cb({ ok: false, error: "지점 로그인 중 문제가 발생했습니다." });
                }}
        });

        // **메시지 전송**
        socket.on("sendMessage", async (messageData, cb) => {
            try {
                console.log("Message received:", messageData);
                const { sender_id,sender_tel, sender_type, message } = messageData;

                // 방ID 가져오기
                const customer = customers[sender_tel];
                if (!customer) {
                    console.error("Customer not found for sender_tel:", sender_tel);
                    return cb({ ok: false, error: "고객 정보를 찾을 수 없습니다." });
                }

                const room = await roomController.findByCustomerTel(sender_tel);
                if (!room || !room.id) {
                    console.error("Room not found for sender_tel:", sender_tel);
                    return cb({ ok: false, error: "방 정보를 찾을 수 없습니다." });
                }
 
                const room_id = room.id;
                console.log("Room Id : ", room_id);
                // 메시지 저장
                const savedMessage = await chatController.saveChatMessage({...messageData, room_id:room_id});

                // 메시지 송수신
                // if (sender_type === "customer" && branchSocketId[BRANCH_CODE]) {
                    //     io.to(branchSocketId[BRANCH_CODE]).emit("message", savedMessage);
                    // } else if (sender_type === "branch" && customerSocketIds[sender_tel]) {
                        //     io.to(customerSocketIds[sender_tel]).emit("message", savedMessage);
                        // }
                        // console.log("messageData : ", messageData);
                // 메시지 송수신
                let roomName="";
                if (sender_type === "customer") {
                    roomName = `room_branch_${BRANCH_CODE}`; // 고객 -> 지점
                } else if (sender_type === "branch") {
                    roomName = customer ? `room_customer_${customer.name}` : ""; // 지점 -> 고객
                }

                if (roomName) {
                    io.to(roomName).emit("message", savedMessage); // 해당 방으로 메시지 전송
                } else {
                    console.error("Room name not found for message");
                }

                cb({ ok: true, data: savedMessage });
            } catch (error) {
                console.error("Error during message sending:", error);
                cb({ ok: false, error: "메시지 전송 중 문제가 발생했습니다." });
            }
        });

        // **클라이언트 연결 종료**
        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);

            // 고객 소켓 제거
            for (const [customerTel, id] of Object.entries(customerSocketIds)) {
                if (id === socket.id) {
                    console.log(`Removing customer socket: ${customerTel}`);
                    delete customerSocketIds[customerTel];
                }
            }

            // 지점 소켓 제거
            if (branchSocketId[BRANCH_CODE] === socket.id) {
                console.log(`Removing branch socket: ${BRANCH_CODE}`);
                delete branchSocketId[BRANCH_CODE];
            }
        });
    });
}
