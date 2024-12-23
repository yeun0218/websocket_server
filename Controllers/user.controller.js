const User = require("../Models/user");
const userController = {}

userController.saveUser = async(userName, socketId) => {
    // 이미 있는 유저인지 확인 
    let user = await User.findOne({name: userName});
    // 없다면 새로 유저 정보 만들기
    if(!user) {
        user = new User({
            name:userName,
            token:socketId,
            online:true,
        })
    }
    // 이미 있는 유저라면 연결정보 token값만 바꿔주기
    user.token = socketId;
    user.online = true;

    await user.save();
    return user;
};

userController.checkUser = async(socketId) => {
    const user = await User.findOne({token:socketId});
    if(!user) throw new Error ("user not found");
    return user;
};

module.exports = userController;