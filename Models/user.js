// user가 어떻게 보여질 지 만드는 
// 유저 스키마 만들기 (몽구스 이용)
// 스키마 : 데이터의 설계도 같은 느낌 
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({ 
    // Scheme : 내가 받을 데이터가 이렇게 생겼다라는걸 설명
    name : { // 유저 이름
        type: String,
        required : [true, "User must type name"],
        unique : true,
    },
    token : { // 유저의 연결 id정보 
        // 컴퓨터는 어떤 연결 id인지만 관심 있어 
        type:String,
    },
    online: { // 유저가 온라인인지 오프라인인지 상태보여주는 
        type:Boolean,
        default: false,
    },
});

module.exports = mongoose.model("User", userSchema);