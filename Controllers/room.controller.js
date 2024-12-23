import chatController from "./chat.controller.js";


const roomController = {

 createRoom : async (data, cb) => {
    const { customerTel, branchCode} = data;

    try {
        const room = await chatController.findOrCreateRoom(customerTel, branchCode);
        cb({ ok: true, data: room});
    } catch (error) {
        console.error("Error creating room : ", error);
        cb({ok:false, error: error.message})
    }
 },

 getRoomsByBranch : async(branchCode, cb) => {
    try {
        const rooms = await chatController.getRoomsByBranch(branchCode);
        cb({ok:true, data:rooms})
    } catch (error) {
        console.error("Error fetchig rooms : ", error);
        cb({ok:false, error:error.message});
    }
 },

 getMessagesByRoom : async (roomId, cb) => {
    try {
        const messages = await chatController.getMessagesByRoom(roomId);
        cb({ok:true, data:messages});
    } catch (error) {
        console.error("Error fetching messages : ", error);
        cb({ok:false, error:error.message})
    }
 }


}
export default roomController;