const router = require("express").Router();
const registerValidation = require("../validation").registerValidation;
const loginValidation = require("../validation").loginValidation;
const User = require("../models").userModel;
const jwt = require("jsonwebtoken");

//middleware
//當有人要驗證時，會先經過這個middleware
router.use((req, res, next) => {
  console.log("A request is coming in to auth.js");
  next();
});

//會用Postman和伺服器互動，確認目前route是否連結一起
router.get("/testAPI", (req, res) => {
  const msgObj = {
    message: "Test API is working.",
  };
  return res.json(msgObj);
});

//register router
router.post("/register", async (req, res) => {
  //console.log("Register sucessfully!");
  //假設輸入的value有誤
  const { error } = registerValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  //確認email是否被註冊過
  const emailExist = await User.findOne({ email: req.body.email });
  if (emailExist) return res.status(400).send("此Email已經被註冊過.");

  //若沒註冊過，幫user新註冊
  const newUser = new User({
    email: req.body.email,
    username: req.body.username,
    password: req.body.password,
    role: req.body.role,
  });
  try {
    const savedUser = await newUser.save();
    res.status(200).send({
      msg: "success",
      savedObject: savedUser,
    });
  } catch (err) {
    res.status(400).send("註冊失敗，請重新註冊一次.");
  }
});

//login router
router.post("/login", async (req, res) => {
  //確認是否符合規範
  let { error } = loginValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  //先找 email(輸入錯誤or找不到使用者)
  //else:有找到使用者，下一步確認密碼(user-model:middleware:comparePassword)
  //tokenObj=payload用戶資訊
  //jwt.sign(payload,secretKey,[option,callback])=產生一組JWT

  const foundUser = await User.findOne({ email: req.body.email });
  if (!foundUser) {
    return res.status(401).send("無法找到使用者，請確認信箱是否正確.");
  }

  foundUser.comparePassword(req.body.password, (err, isMatch) => {
    if (err) return res.status(500).send(err);
    if (isMatch) {
      const tokenObj = { _id: foundUser._id, email: foundUser.email };
      const token = jwt.sign(tokenObj, process.env.PASSPORT_SECRET);
      res.send({
        message: "成功登入！",
        success: true,
        token: "JWT " + token,
        user: foundUser,
      });
    } else {
      res.status(401).send("密碼錯誤.");
    }
    // User.findOne({ email: req.body.email }, function (err, user) {
    //   if (err) {
    //     res.status(400).send(err);
    //   }
    //   if (!user) {
    //     res.status(401).send("User not found.");
    //   } else {
    //     user.comparePassword(req.body.password, function (err, isMatch) {
    //       if (err) return res.status(400).send(err);
    //       if (isMatch) {
    //         const tokenObject = { _id: user._id, email: user.email };
    //         const token = jwt.sign(tokenObject, process.env.PASSPORT_SECRET);
    //         res.send({ success: true, token: "JWT " + token, user });
    //       } else {
    //         res.status(401).send("Wrong password.");
    //       }
    //     });
    //   }
  });
});

module.exports = router;
