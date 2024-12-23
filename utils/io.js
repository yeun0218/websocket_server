// 통신 관련된 코드는 모두 여기 작성 
import customerController from "../Controllers/customer.controller.js";
import chatController from "../Controllers/chat.controller.js";
import reservationController from "../Controllers/reservation.controller.js";
import branchController from "../Controllers/branch.controller.js";
import roomController  from "../Controllers/room.controller.js";


export default function(io) { // io를 매개변수로 불러와 
    // io관련된 모든 작업 여기서 실행
    // 말하는 함수 emit()
    // 듣는 함수 on()

    let branchSocketId = null; // 직원 소켓 아이디
    let customerSocketIds = {}; // 고객 소켓 아이디, 여러고객연결을 위한 객체체
    let rooms = {}; // 채팅방 관리 객체

    io.on("connection", async(socket) => {
        // 연결된 사람은 socket이라는 매개변수로 담아줘
        console.log("Client is connected", socket.id);
// 고객 연결결
        socket.on("customerLogin", async(customerTel, cb) => {
            // "login"을 불렀을 때 실행되는 함수  
            // 유저 정보를 저장하고 소켓 아이디 정보도 저장
           try{
            // MariaDB에서 고객 정보 불러오기
           const customer = await customerController.getCustomerById(customerTel);

           if (!customer) {
               console.error(`Customer not found for Tel: ${customerTel}`);
               return cb({ ok: false, message: "Customer not found" });
           }
           // 고객 로그인 시
           if (customerSocketIds[customerTel]) {
            console.log(`Customer ${customerTel} is reconnecting`);
           }
           // 고객 ID를 키로 사용해 소켓 ID 저장장
           (customerSocketIds[customerTel]) = socket.id;
           socket.customerTel = customerTel;
           console.log(`Customer${customerTel} logged in: `, customer);

           // 방 생성 또는 조회
            const branchCode = branchSocketId; // 현재 브랜치 코드
            const roomData = { branchCode, customerTel };
            const room = await new Promise((resolve, reject) => {
            roomController.createRoom(roomData, (response) => {
                if (response.ok) {
                resolve(response.data);
                } else {
                reject(response.error);
                }
            });
            });

        if (branchSocketId) {
            io.to(branchSocketId).emit("customerConnected", customer);
        }

        //    if(branchSocketId) {
        //     io.to(socket.id).emit("message", {
        //         message : `뷰티샵 '${branch_name}' 입니다`,
        //         sender_type : "system",
        //     });
        //     cb({ ok: true, data: room });
        //     }
           

        }catch (error) {
                cb({ ok: false, error: error.message });
            }
        });
        
        
        // 상담원 로그인
        socket.on("branchLogin", async (branchCode, cb) => {
            try {
                console.log("Received branchCode:", branchCode); 
                // DB에서 branchCode로 branchName 가져오기 (MariaDB 예시)
                const branch = await branchController.getBranchByCode(branchCode);
                if (!branch) {
                    console.log("Branch found:", branch); // branch가 정상적으로 조회되었는지 확인
                    return cb({ ok: false, message: "Branch not found" });
                }
                
                console.log("Branch found:", branch); // branch가 정상적으로 조회되었는지 확인
              // 지점 로그인 시
              if(branchSocketId) {
                console.log("Branch is reconnecting");
              }
              branchSocketId = socket.id;
              socket.branchId = branchCode;
              console.log("Branch logged in:", branch.branch_name);
          
              // 방 목록 가져오기
              const branchRooms = await new Promise((resolve, reject) => {
                roomController.getRoomsByBranch(branchCode, (response) => {
                  if (response.ok) {
                    resolve(response.data);
                  } else {
                    reject(response.error);
                  }
                });
              });

              // 방이 없으면 기본 방 생성
            if (branchRooms.length === 0) {
                const defaultRoomData = { branchCode, customerTel: "default" };
                await new Promise((resolve, reject) => {
                roomController.createRoom(defaultRoomData, (response) => {
                    if (response.ok) {
                    resolve(response.data);
                    } else {
                    reject(response.error);
                    }
                });
                });
            }

              
              // 상담원 상태 알림
              io.emit("branchStatus", { online: true });
              const rooms = await getRoomsByBranch(branchCode);
              
              cb({
                ok: true,
                branchName: branch.branch_name,
                rooms: branchRooms,
            });
            } catch (error) {
              cb({ ok: false, message: error.message });
            }
          });
           
          // 채팅방 생성
          socket.on("getRooms", async (branchCode, cb) => {
            try {
                const rooms = await new Promise((resolve, reject) => {
                    roomController.getRoomsByBranch(branchCode, (response) => {
                      if (response.ok) {
                        resolve(response.data);
                      } else {
                        reject(response.error);
                      }
                    });
                  });
              
                  cb({ ok: true, data: rooms || [] }); // 빈 배열 반환
            } catch (error) {
              cb({ ok: false, error: error.message });
            }
          });
          

           
           // 예약 생성 
            socket.on("makeReservation", async (reservationData, cb) => {
                try{
                    const reservation = await reservationController.saveReservation(reservationData);
                
                    // 브랜치에 예약 정보 알림
                    if(branchSocketId) {
                        io.to(branchSocketId).emit("newReservation", reservation);
                    }

                    cb({ ok:true, data:reservation});
                } catch(error) {
                    cb({ ok:false, error: error.message});
                }
        });

        // 고객이 예약 목록 요청
        socket.on("getReservations", async (customerId, cb) => {
            try {
                const reservations = await reservationController.getReservationsByCustomerId(customerId);
                cb({ ok: true, data: reservations });
            } catch (error) {
                cb({ ok: false, error: error.message });
            }
        });

        // 지점이 예약 확인
        socket.on("getBranchReservations", async (branchCode, cd) => {
            try{
                const reservations = await reservationController.getReservationsByBranch(branchCode);
                cb({ ok: true, data: reservations });
            } catch (error) {
                cb({ ok: false, error: error.message });
            }
        })
        // socket.on("sendMessage", async(message,cb) => { //"sendMessage"가 날아왔을 때 실행되는 함수
        //     try {
        //         // 유저찾기(socket id로)
        //         const user = await userController.checkUser(socket.id);
        //         // 메시지 저장(유저불러오고 나서)
        //         const newMessage = await chatController.saveChat(message,user);
        //         // 메시지랑 유저정보 날려줘
        //         //cb({ok:true,data:newMessage}); // -> 보낸 클라이언트한테만 알려주는거 
        //         // 새로운 메시지는 io.js에 접속한 모두한테 알려줘야 돼
        //         io.emit("message", newMessage);
        //         cb({ok:true}) 
        //     } catch (error) {
        //         cb({ok : false, error : error.message});
        //     }
        // })

// 실시간 메시지
    socket.on("sendMessage", async(messageData, cb) => {
     const { message, sender_tel, sender_id, sender_type } = messageData;

    // // 데이터 유효성 검사
    // console.log("Received messageData:", messageData);
    // if (!message || !sender_type || !["branch","customer"].includes(sender_type)) {
    //     console.error("Error: Invalid message data received:", messageData);
    //     return cb({ ok: false, message: "Invalid message data." });
    // }
    
    // if (!message || !sender_type) {
        //     return cb({ ok: false, message: "Invalid message data." });
        //   }
        
        //   // sender_tel 확인 (브랜치가 고객에게 보낼 때 필수)
        // if (sender_type === "branch" && !sender_tel) {
            //     console.error("Branch message must include a valid sender_tel for the customer.");
            //     return cb({ ok: false, message: "Invalid sender_tel for branch message." });
            // }
            
            try {
                // 메시지 저장
                const savedMessage = await chatController.saveChatMessage(messageData);
                
                const roomId = sender_type === "branch"
                ? `${sender_tel}-${sender_id}`
                : `${sender_id}-${branchSocketId}`;
            
                if (!rooms[roomId]) throw new Error("Room not found");
            
                // 메시지 저장
                rooms[roomId].messages.push({
                    sender: sender_type,
                    content: message,
                    timestamp: new Date(),
                });

        //메시지 전송
        if (sender_type === "branch") {
            // 브랜치 -> 고객
            if (customerSocketIds[sender_tel]) {
                io.to(customerSocketIds[sender_tel]).emit("message", savedMessage);
            } else {
                console.error(`Customer socket not found for sender_tel: ${sender_tel}`);
            }
            // 브랜치 자신의 화면 업데이트 (실시간으로 보낸 메시지 표시)
            if(branchSocketId) {
                io.to(branchSocketId).emit("message", savedMessage);
            }
            } else if (sender_type === "customer") {
                // 고객 -> 브랜치
                if (branchSocketId) {
                    io.to(branchSocketId).emit("message", savedMessage);
                } else {
                    console.error("Branch socket not found");
                }
                // 고객 자신의 화면 업데이트 (실시간으로 보낸 메시지 표시)
                if(customerSocketIds[sender_tel]) {
                io.to(customerSocketIds[sender_tel]).emit("message", savedMessage);
                }
            } else {
               console.error("Invalid sender_type:", sender_type);
            }
            // if (messageData.sender_type === "branch" && customerSocketIds[messageData.sender_tel]) {
            //     io.to(customerSocketIds[messageData.sender_tel]).emit("message", savedMessage);
            // } else if (messageData.sender_type === "customer" && branchSocketId) {
            //     io.to(branchSocketId).emit("message", savedMessage);
            // }
            // 메시지 저장 성공 시


        cb({ ok: true, data: savedMessage });
    } catch(error) {
            // 메시지 저장 실패 시
            console.error("Error saving message:", error);
            cb({ ok: false, error: error.message });
        };
    });

    // 메시지 이력 조회
    socket.on("getMessageHistory", async ({roomId}, cb) => {
        try {
            if (!rooms[roomId]) {
                return cb({ ok: false, message: "Room not found" });
            }
            const messages = rooms[roomId].messages;
            cb({ ok: true, data: rooms[roomId].messages });
        } catch (error) {
            cb({ ok: false, error: error.message });
        }
    });

    // 브랜치 메시지 이력 조회
    socket.on("getBranchMessages", async ({ branchCode }, cb) => {
        try {
          // 특정 브랜치와 관련된 메시지 가져오기
          const messages = await chatController.getMessagesByBranch(branchCode);
      
          if (!messages || messages.length === 0) {
            return cb({ ok: false, message: "No messages found for this branch." });
          }
      
          cb({ ok: true, data: messages }); // 메시지 목록 반환
        } catch (error) {
          console.error("Error fetching branch messages:", error);
          cb({ ok: false, error: error.message });
        }
      });

    // 메시지 읽음 처리 이벤트
    socket.on("markRead", async (messageId, cb) => {
        try {
            const success = await chatController.markMessageAsRead(messageId);
            if(success) {
                cb({ok : true});
            } else {
                cb({ok:false, message:"Failed to marked message read"});
            }
        } catch (error) {
            console.error ("Error marking Msg", error);
            cb({ok :false, error : error.message});
        }
    });


// 연결 종료 이벤트
        socket.on("disconnect", () => {
            console.log("Client is disconnected", socket.id);

            if(socket.id === branchSocketId) {
                branchSocketId = null;
                io.emit("branchStatus", {online : false});
            }

            for (const [customerId, id] of Object.entries(customerSocketIds)) {
                if (id === socket.id) {
                    delete customerSocketIds[customerId];
                    if (branchSocketId) {
                        io.to(branchSocketId).emit("customerDisconnected", { customerTel });
                    }
                }
            }
        })
    });
}
