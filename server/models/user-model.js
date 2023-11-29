const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

//註冊登入的表格,mongodb要存的資料
const userSchema = new mongoose.Schema({
  username: { type: String, minLength: 3, maxLength: 50, required: true },
  email: { type: String, minLength: 6, maxLength: 100, required: true },
  password: { type: String, minLength: 6, maxLength: 1024, required: true },
  role: { type: String, required: true, enum: ["student", "instructor"] },
  date: { type: Date, default: Date.now },
});

//確認role 的 method(學生,講師,網站管理者)
userSchema.methods.isStudent = function () {
  return this.role == "student";
};
userSchema.methods.isInstructor = function () {
  return this.role == "instructor";
};
userSchema.methods.isAdmin = function () {
  return this.role == "admin";
};

//mongoose middleware(執行fn前，先執行其它fn)
//這邊處理password先hash加密後再儲存
//password是否被修改過or是否為新的
userSchema.pre("save", async function (next) {
  if (this.isModified("password") || this.isNew) {
    const hash = await bcrypt.hash(this.password, 10);
    this.password = hash;
    next();
  } else {
    return next();
  }
});

//驗證解密
userSchema.methods.comparePassword = function (password, cb) {
  bcrypt.compare(password, this.password, (err, isMatch) => {
    if (err) {
      return cb(err, isMatch);
    } else {
      cb(null, isMatch);
    }
  });
};

//匯出語法，其他檔案才能使用
const User = mongoose.model("User", userSchema);
module.exports = User;
