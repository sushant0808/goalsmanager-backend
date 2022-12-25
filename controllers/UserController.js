const User = require("../models/UserModel");
const jwt = require("jsonwebtoken");

const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const {ObjectId} = mongoose.Types;

// const authenticateUser = async (req, res) => {
//     console.log('req.headers.authorization',req.headers.authorization);
//     if (req.headers.authorization) {
//         const [, token] = req.headers.authorization.split(" ");
//         console.log('This is user sent token', token);

//         if (!token) {
//             return res.json({
//                 message: 'Please provide a token',
//                 status: 404,
//             })
//         }

//         const isUserValid = jwt.verify(token, process.env.JWT_SECRET_KEY);
//         console.log('isValid', isUserValid);
//     } else {

//     }
// }

const registerUser = async (req, res) => {
    const { username, email, password } = req.body;

    const userObj = {
        username,
        email,
        password,
    }

    try {
        const date = new Date();
        const alreadyExistingUser = await User.find({ email });

        // Checking if user already exists
        if (Object.keys(alreadyExistingUser).length) {
            return res.json({
                message: 'User with this email already exists',
                status: 404,
            })
        }

        const response = await User.create(userObj)
        console.log('response from registration', response);

        const token = jwt.sign({ userId: response._id, isLoggedIn: true }, process.env.JWT_SECRET_KEY);

        res.cookie("token", token, { maxAge: date.setDate(date.getDate() + 1) });

        res.json({
            token,
            message: 'Registration successful',
            status: 200,
        })
    } catch (err) {
        console.log(err);
        res.json({
            message: 'Registration failed',
            status: 500,
        })
    }
}


const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const date = new Date();
        const response = await User.findOne({ email, password });

        console.log('Login ka response in server', response);

        if (!response) {
            return res.json({
                message: 'Invalid username or password',
                status: 404,
            })
        }

        const userObj = {
            userId: response._id,
            username: response.username,
            email: response.email,
            isLoggedIn: true
        }

        const token = jwt.sign(userObj, process.env.JWT_SECRET_KEY);

        res.cookie("token", token, { maxAge: date.setDate(date.getDate() + 1), httpOnly: false });
        res.json({
            message: "Login successful",
            token,
            userObj,
            status: 200,
        })

    } catch (err) {
        console.log(err);
        res.json({
            message: "Server error",
            status: 500,
        })
    }

}

const addUserTask = async (req, res) => {
    let { task, isComplete, taskId } = req.body;
    task = task.toLowerCase();
    const userId = req.user.userId; // We get this userId from the auth middleware function after authenticating the user.

    const newlyCreatedTask = {
        taskId,
        createdAt: new Date(),
        task,
        isComplete,
    }

    try {


        // Checking if a task already exists
        const alreadyExistingTask = await User.find({
            _id: mongoose.Types.ObjectId(userId),
            userTasks: {
                $elemMatch: { task }
            }
        })

        if (alreadyExistingTask.length) {
            return res.json({
                message: "Task with this name already exists",
                status: 404,
            })
        }

        // Adding the task to database
        const user = await User.findOneAndUpdate(
            { _id: mongoose.Types.ObjectId(userId) },
            { $push: { userTasks: newlyCreatedTask } },
            { returnDocument: 'after' },
        )

        res.json({
            message: 'Task added successfully',
            status: 200,
            createdTask: user.userTasks[user.userTasks.length - 1],
        })

    } catch (err) {
        console.log(err);
        res.json({
            message: 'Server error',
            status: 500,
        })
    }

}

const displayUsersTasks = async (req, res) => {
    const userId = req.user.userId; // We get this userId from the auth middleware function after authenticating the user.
    try {
        const { userTasks } = await User.findById(userId);
        res.json({
            message: 'Successfully retrieved all the tasks',
            status: 200,
            allTasks: userTasks
        })
    } catch (err) {
        console.log(err);
        res.json({
            message: 'Server error',
            status: 500,
        })
    }
}

const deleteUserTask = async (req, res) => {
    const userId = req.user.userId; // We get this userId from the auth middleware function after authenticating the user.
    try {
        const { userTasks } = await User.findOneAndUpdate(
            { _id: mongoose.Types.ObjectId(userId) },
            { $pull: { userTasks: { taskId: req.params.taskId } } },
            { returnDocument: 'after' }
        )

        console.log('This is deleteUserTask backend ', userTasks);

        res.json({
            message: 'Task deleted successfully',
            status: 200,
            allTasks: userTasks,
        })
    } catch (err) {
        console.log(err);
        res.json({
            message: 'Server error',
            status: 500,
        })
    }
}

const updateUserTask = async (req, res) => {
    const userId = req.user.userId; // We get this userId from the auth middleware function after authenticating the user.
    try {
        const { userTasks } = await User.findOneAndUpdate(
            { _id: mongoose.Types.ObjectId(userId), 'userTasks.taskId': req.params.taskId },
            { $set: { 'userTasks.$.task': req.body.newUpdatedTask } },
            { returnDocument: 'after' }
        )

        console.log('resp', userTasks);

        res.json({
            message: 'Task updated successfully',
            status: 200,
            allTasks: userTasks,
        })
    } catch (err) {
        console.log(err);
        res.json({
            message: 'Server error',
            status: 500,
        })
    }
}

const markTaskAsComplete = async (req, res) => {
    const userId = req.user.userId; // We get this userId from the auth middleware function after authenticating the user.
    try {
        const { userTasks } = await User.findOneAndUpdate(
            { _id: mongoose.Types.ObjectId(userId), 'userTasks.taskId': req.params.taskId },
            { $set: { 'userTasks.$.isComplete': !req.body.isComplete } },
            { returnDocument: 'after' }
        )

        // const completedTask = userTasks.filter((task) => {
        //     return task.isComplete === true;
        // })

        res.json({
            message: 'Task status updated successfully',
            status: 200,
            allTasks: userTasks,
        })
    } catch (err) {
        console.log(err);
        res.json({
            message: 'Server error',
            status: 500,
        })
    }
}

const sendResetPasswordEmail = async (req, res) => {
    try {
        const { userEmail } = req.body;

        const user = await User.findOne({ email: userEmail });

        if (!user) {
            return res.json({
                succes: false,
                message: 'User with this email does not exist',
                status: 401,
            })
        }

        const userId = user._id.toString();

        // Get user deatils with the userEmail
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'sushantmore09072000@gmail.com',
                pass: 'hqvjkccldkmpmdxe',
            }
        })

        const mailOptions = {
            from: 'sushantmore09072000@gmail.com',
            to: userEmail,
            subject: 'Reset password',
            text: 'done',
            html: `
                <p>Click on below link to reset password</p>
                <a href="https://goalsmanager.onrender.com/reset-password/${userId}">https://goalsmanager.onrender.com/reset-password/${userId}</a>
            `
        }

        transporter.sendMail(mailOptions, function (err, info) {
            if (err) {
                console.log('email error', err)
                res.json({
                    success: true,
                    message: 'Email failed',
                    status: 404,
                });

            } else {
                console.log('Email sent', info);

                res.json({
                    success: true,
                    message: 'Email sent successfully',
                    status: 200,
                });
            }
        })
    } catch (err) {
        res.json({
            success: false,
            message: 'Server error',
            status: 500,
        })
    }
}

const resetUserPassword = async (req, res) => {
    try {
        const { newPassword, confirmPassword, userId } = req.body;
        const updatedUser = await User.findOneAndUpdate({ _id: mongoose.Types.ObjectId(userId) }, {
            password: confirmPassword,
        }, {
            returnDocument: 'after'
        })

        res.json({
            success: true,
            message: 'Password changed sucessfully',
            status: 200,
        })
    } catch (err) {
        console.log(err);
        res.json({
            succes: false,
            message: 'Server error',
            status: 500,
        })
    }
}


module.exports = {
    registerUser,
    loginUser,
    addUserTask,
    displayUsersTasks,
    deleteUserTask,
    updateUserTask,
    markTaskAsComplete,
    sendResetPasswordEmail,
    resetUserPassword,
}