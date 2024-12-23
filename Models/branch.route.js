// branch.routes.js
import express from 'express';
import branchController from '../Controllers/branch.controller.js';

const router = express.Router();

// 브랜치 코드로 로그인 처리
router.post('/login', async (req, res) => {
    const { branchCode } = req.body;  // 클라이언트로부터 받은 브랜치 코드
    try {
        const branch = await branchController.getBranchByCode(branchCode);  // 해당 브랜치 코드로 조회
        res.status(200).json({ ok: true, branchName: branch.branch_name });  // 브랜치 이름 반환
    } catch (error) {
        res.status(400).json({ ok: false, error: error.message });  // 오류 처리
    }
});

export default router;
