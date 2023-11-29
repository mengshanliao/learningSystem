const router = require("express").Router();
const Course = require("../models").courseModel;
const courseValidation = require("../validation").courseValidation;

//middleware
//當有人要驗證時，會先經過這個middleware
router.use((req, res, next) => {
  console.log("A request is coming into api......");
  next();
});

/** 取得全部課程資訊的頁面 */
//populate:和courseModel的instructor互相連結
router.get("/", (req, res) => {
  Course.find({})
    .populate("instructor", ["username", "email"])
    .then((course) => {
      res.send(course);
    })
    .catch(() => {
      res.status(500).send("無法取得所有課程資訊.");
    });
});

// router.get("/", async (req, res) => {
//   try {
//     const course = await Course.find({}).populate("instructor", [
//       "username",
//       "email",
//     ]);
//     res.send(course);
//   } catch {
//     (e) => {
//       res.status(500).send(e);
//     };
//   }
// });

/** 根據講師ID找到他的課程 */
router.get("/instructor/:_instructor_id", (req, res) => {
  let { _instructor_id } = req.params;
  Course.find({ instructor: _instructor_id })
    .populate("instructor", ["username", "email"])
    .then((data) => {
      res.send(data);
    })
    .catch(() => {
      res.status(500).send("無法取得此講師的課程資訊.");
    });
});

/** 學生會找到自己註冊過的課程*/
router.get("/student/:_student_id", (req, res) => {
  let { _student_id } = req.params;
  Course.find({ students: _student_id })
    .populate("instructor", ["username", "email"])
    .then((courses) => {
      res.status(200).send(courses);
    })
    .catch(() => {
      res.status(500).send("無法取得課程資訊.");
    });
});

/** 在學生EnrollCourse頁面，根據學生搜尋結果，出現相對應的課程*/
router.get("/findByName/:name", (req, res) => {
  let { name } = req.params;
  Course.find({ title: name })
    .populate("instructor", ["username", "email"])
    .then((course) => {
      res.status(200).send(course);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

/** 取得其中一個課程資訊 */
router.get("/:_id", (req, res) => {
  let { _id } = req.params;
  Course.findOne({ _id })
    .populate("instructor", ["email"])
    .then((course) => {
      res.send(course);
    })
    .catch((e) => {
      res.send(e);
    });
});

/** course router新增課程 */
//已經登入且身分是講師，才能新增課程
//需保護此路由，在index.js有設定:passport.authenticate
router.post("/", async (req, res) => {
  //假設輸入的value有誤
  const { error } = courseValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  //確認身分
  let { title, description, price } = req.body;
  if (req.user.isStudent()) {
    return res.status(400).send("只有講師才能新增課程.");
  }
  //講師可新增course
  let newCourse = new Course({
    title,
    description,
    price,
    instructor: req.user._id,
  });

  try {
    await newCourse.save();
    res.status(200).send("此課程已新增成功.");
  } catch (err) {
    res.status(400).send("課程新增失敗,請重新操作一次.");
  }
});

/**學生註冊
 * course-model中courseSchema有 students: { type: [String], default: [] }
 */
router.post("/enroll/:_id", async (req, res) => {
  let { _id } = req.params;
  let { user_id } = req.body;
  try {
    let course = await Course.findOne({ _id }); //根據id找到課程
    course.students.push(user_id); //array後繼續新增學生value
    await course.save(); //這邊course是小寫c
    res.send("註冊成功！");
  } catch (err) {
    res.send(err);
  }
});

/** 更新課程 */
router.patch("/:_id", async (req, res) => {
  //假設輸入的value有誤
  const { error } = courseValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  //先找到要更新的課程
  let { _id } = req.params;
  let course = await Course.findOne({ _id });

  //若課程不存在
  if (!course) {
    res.status(404);
    return res.json({ success: false, message: "無法取得課程或此課程不存在." });
  }
  //若有找到課程,講師Instructor和網站管理者Admin可以更新
  if (course.instructor.equals(req.user._id) || req.user.isAdmin()) {
    Course.findOneAndUpdate({ _id }, req.body, {
      new: true,
      runValidators: true,
    })
      .then(() => {
        res.send("課程資訊已更新.");
      })
      .catch((e) => {
        res.send({ success: false, message: e });
      });
  } else {
    res.status(403);
    return res.json({
      success: false,
      message: "非課程講師或網站管理者無法更新課程資訊.",
    });
  }
});

/** 刪除特定課程 */
router.delete("/:_id", async (req, res) => {
  //先找到要更新的課程
  let { _id } = req.params;
  let course = await Course.findOne({ _id });
  //若課程不存在
  if (!course) {
    res.status(404);
    return res.json({ success: false, message: "無法取得課程或此課程不存在." });
  }
  //若有找到課程,講師Instructor和網站管理者Admin可以更新
  if (course.instructor.equals(req.user._id) || req.user.isAdmin()) {
    Course.deleteOne({ _id })
      .then(() => {
        res.send("課程資訊已刪除.");
      })
      .catch((e) => {
        res.send({ success: false, message: e });
      });
  } else {
    res.status(403);
    return res.json({
      success: false,
      message: "非課程講師或網站管理者無法刪除課程資訊.",
    });
  }
});

module.exports = router;
