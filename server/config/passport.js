const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const User = require("../models").userModel;

//passport.use(new JwtStrategy(options,verify))
//options:secretOrKey必填,jwtFromRequest用來代入的fn
//verify=fn:verify(jwt_payload,done)解碼後的payload,callback<err,user,info>
module.exports = (passport) => {
  let opts = {};
  //設定opts屬性，Extract提取
  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("jwt");
  opts.secretOrKey = process.env.PASSPORT_SECRET;
  passport.use(
    new JwtStrategy(opts, async function (jwt_payload, done) {
      try {
        const user = await User.findOne({ _id: jwt_payload._id });
        if (user) {
          return done(null, user);
        } else {
          done(null, false);
        }
      } catch (err) {
        done(err, false);
      }
    })
  );
};
// passport.use(
//   new JwtStrategy(opts,function (jwt_payload, done) {
//     User.findOne({ _id: jwt_payload._id }, (err, user) => {
//       if (err) {
//         return done(err, false);
//       }
//       if (user) {
//         return done(null, user);
//       } else {
//         done(null, false);
//       }
//     });
//   })
// );
