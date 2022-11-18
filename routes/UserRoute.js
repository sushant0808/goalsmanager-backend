
const express = require("express");
const { registerUser, loginUser, addUserTask, displayUsersTasks, deleteUserTask, updateUserTask,markTaskAsComplete } = require("../controllers/UserController");
const jwt = require("jsonwebtoken");


const router = express.Router();

const authenticateUser = async (req, res, next) => {
    if (req.headers.authorization) {
        const [, token] = req.headers.authorization.split(" ");
        console.log('This is user sent token', token);

        if (!token) {
            return res.json({
                message: 'Please provide a token',
                status: 404,
            })
        }

        const userData = jwt.verify(token, process.env.JWT_SECRET_KEY);
        console.log('userData', userData);
        req.user = userData
        next();
    } else {
        res.json({
            message: 'Please provide a token',
            status: 404,
        })
    }
}

router.get("/users-all-tasks", authenticateUser, displayUsersTasks);
router.delete("/delete-user-task/:taskId", authenticateUser, deleteUserTask);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/add-user", authenticateUser, addUserTask)
router.post("/update-user-task/:taskId", authenticateUser, updateUserTask);
router.post("/update-task-status/:taskId",authenticateUser,markTaskAsComplete);

module.exports = router;