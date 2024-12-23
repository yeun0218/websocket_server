// branch.controller.js
import db from "../utils/db.js";

const branchController = {
    // 브랜치 코드로 브랜치 정보 조회
    getBranchByCode: async (branchCode) => {
        const [rows] = await db.query("SELECT * FROM branch WHERE branch_code = ?", [branchCode]);
        console.log("Fetched branch:", rows); 
        if (rows.length === 0) {
            throw new Error(`Branch with code ${branchCode} not found`);
        }
        return rows[0];  // 브랜치 정보 반환
    }
};

export default branchController;
