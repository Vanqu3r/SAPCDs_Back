const mongoose = require('mongoose');
const { Schema } = mongoose;

const DetailRowRegSchema = new Schema({
  CURRENT: { type: Boolean, default: false },
  REGDATE: { type: Date, required: true },
  REGTIME: { type: Date, required: true },
  REGUSER: { type: String, required: true }
}, { _id: false });

const DetailRowSchema = new Schema({
  ACTIVED: { type: Boolean, default: true },
  DELETED: { type: Boolean, default: false },
  DETAIL_ROW_REG: { type: [DetailRowRegSchema], default: [] }
}, { _id: false });

const PrivilegeSchema = new Schema({
  PROCESSID: { type: String, required: true },
  PRIVILEGEID: { type: [String], required: true }
}, { _id: false });

const RoleSchema = new Schema({
  ROLEID: { type: String, required: true },
  ROLENAME: { type: String, required: true },
  DESCRIPTION: { type: String },
  PRIVILEGES: { type: [PrivilegeSchema], default: [] },
  DETAIL_ROW: { type: DetailRowSchema, default: {} }
}, {
  versionKey: false 
});

// Indica explícitamente el nombre de la colección "ZTEROLES"
module.exports = mongoose.model('ZTEROLES', RoleSchema, 'ZTEROLES');
