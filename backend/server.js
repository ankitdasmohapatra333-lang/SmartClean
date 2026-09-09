const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const envPath = fs.existsSync(path.join(__dirname, '.env'))
  ? path.join(__dirname, '.env')
  : path.join(__dirname, '..', '.env');
require('dotenv').config({ path: envPath });

function httpsGetJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { family: 4, timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          resolve({ raw: data });
        }
      });
    });
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.on('error', (err) => reject(err));
  });
}

const Complaint = require('./models/Complaint');
const OTP = require('./models/OTP');
const User = require('./models/User');
const Zone = require('./models/Zone');

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const ALLOW_MEMORY_FALLBACK = process.env.ALLOW_MEMORY_FALLBACK !== 'false';
const DEMO_AUTH_BYPASS = process.env.DEMO_AUTH_BYPASS === 'true';
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const ADMIN_EMAIL = cleanEnvValue(process.env.ADMIN_EMAIL) || 'admin@smartclean.com';
const ADMIN_PASSWORD = cleanEnvValue(process.env.ADMIN_PASSWORD) || 'admin123';

const MOBILE_REGEX = /^[6-9][0-9]{9}$/;
const COMPLAINT_STATUSES = ['Pending', 'Assigned', 'In Progress', 'Resolved'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const SANITATION_STATUSES = ['pending', 'in-progress', 'completed'];
const PRIORITY_SCORE = { Low: 1, Medium: 2, High: 3, Critical: 4 };

const memoryStore = {
  users: [],
  otps: [],
  complaints: [],
  zones: [],
  complaintSequence: 1
};

let runningWithoutDatabase = false;

const uploadsRoot = path.join(__dirname, 'uploads');
const complaintUploadsDir = path.join(uploadsRoot, 'complaints');
fs.mkdirSync(complaintUploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, complaintUploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `complaint-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only jpg, jpeg, png, and webp images are allowed'));
    }
    cb(null, true);
  }
});

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsRoot));

const frontendRoot = path.join(__dirname, '..', 'frontend');
if (fs.existsSync(frontendRoot)) {
  app.use('/css', express.static(path.join(frontendRoot, 'CSS')));
  app.use('/CSS', express.static(path.join(frontendRoot, 'CSS')));
  app.use('/js', express.static(path.join(frontendRoot, 'js')));
  app.use(express.static(frontendRoot));
}

function cleanEnvValue(value) {
  return String(value || '')
    .trim()
    .replace(/^['"]|['"];?$/g, '')
    .replace(/\^&/g, '&')
    .replace(/;$/, '');
}

function jsonSuccess(res, data = {}, status = 200) {
  return res.status(status).json({ success: true, ...data });
}

function jsonError(res, status, message, extra = {}) {
  return res.status(status).json({ success: false, message, ...extra });
}

function getDatabaseState() {
  if (runningWithoutDatabase) return 'offline-memory';
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return states[mongoose.connection.readyState] || 'unknown';
}

function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}

function useMemoryStore() {
  return ALLOW_MEMORY_FALLBACK && !isDatabaseConnected();
}

function hashValue(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function base64UrlEncode(value) {
  return Buffer.from(JSON.stringify(value))
    .toString('base64url');
}

function base64UrlDecode(value) {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
}

function signToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + 7 * 24 * 60 * 60 };
  const encodedHeader = base64UrlEncode(header);
  const encodedBody = base64UrlEncode(body);
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedBody}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedBody}.${signature}`;
}

function verifyToken(token) {
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedBody, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedBody}`)
    .digest('base64url');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  const payload = base64UrlDecode(encodedBody);
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

function getBearerToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

function normalizeMobile(mobile) {
  return String(mobile || '').trim();
}

function validateMobile(mobile) {
  return MOBILE_REGEX.test(normalizeMobile(mobile));
}

function normalizePriority(priority, category = '', description = '') {
  const raw = String(priority || '').trim().toLowerCase();
  const direct = PRIORITIES.find((item) => item.toLowerCase() === raw);
  if (direct) return direct;

  const text = `${category} ${description}`.toLowerCase();
  if (text.includes('overflow') || text.includes('open waste') || text.includes('garbage dump') || text.includes('hazard')) {
    return 'High';
  }

  return 'Medium';
}

function normalizeStatus(status) {
  const raw = String(status || '').trim().toLowerCase().replace(/-/g, ' ');
  const aliases = {
    pending: 'Pending',
    reported: 'Pending',
    assigned: 'Assigned',
    acknowledged: 'Assigned',
    'in progress': 'In Progress',
    resolved: 'Resolved'
  };
  return aliases[raw] || null;
}

function normalizeCategory(value) {
  const category = String(value || '').trim();
  if (category) return category;
  return 'Other';
}

function deriveWasteType(category) {
  const text = String(category || '').toLowerCase();
  if (text.includes('wet') || text.includes('organic')) return 'organic';
  if (text.includes('dry')) return 'dry';
  if (text.includes('plastic')) return 'plastics';
  if (text.includes('hazard')) return 'hazardous';
  if (text.includes('sanitation')) return 'sanitary';
  if (text.includes('mixed') || text.includes('garbage') || text.includes('dump') || text.includes('overflow')) return 'mixed';
  return 'other';
}

function normalizeZoneName(value, location) {
  return String(value || location || 'Unassigned').trim();
}

function validateCoordinates(latitude, longitude) {
  const hasLat = latitude !== undefined && latitude !== null && latitude !== '';
  const hasLng = longitude !== undefined && longitude !== null && longitude !== '';

  if (!hasLat && !hasLng) return { valid: true };
  if (!hasLat || !hasLng) return { valid: false, message: 'Both latitude and longitude are required when GPS is provided' };

  const lat = Number(latitude);
  const lng = Number(longitude);

  if (Number.isNaN(lat) || lat < -90 || lat > 90) {
    return { valid: false, message: 'latitude must be a number from -90 to 90' };
  }

  if (Number.isNaN(lng) || lng < -180 || lng > 180) {
    return { valid: false, message: 'longitude must be a number from -180 to 180' };
  }

  return { valid: true, latitude: lat, longitude: lng };
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function sortNewestFirst(a, b) {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

function matchesSearch(complaint, search) {
  if (!search) return true;
  const needle = String(search).toLowerCase();
  return [
    complaint.complaintId,
    complaint.category,
    complaint.location,
    complaint.zone,
    complaint.description,
    complaint.assignedTo
  ].some((value) => String(value || '').toLowerCase().includes(needle));
}

function complaintMatches(complaint, filters) {
  return Object.entries(filters).every(([key, value]) => {
    if (key === 'search') return matchesSearch(complaint, value);
    return complaint[key] === value;
  });
}

function buildComplaintFilter(query) {
  const filter = {};
  if (query.status) filter.status = normalizeStatus(query.status) || query.status;
  if (query.category) filter.category = query.category;
  if (query.priority) filter.priority = normalizePriority(query.priority);
  if (query.zone) filter.zone = query.zone;
  if (query.wasteType) filter.wasteType = deriveWasteType(query.wasteType);
  return filter;
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: String(user._id),
    name: user.name || '',
    mobile: user.mobile,
    email: user.email || '',
    role: user.role || 'citizen'
  };
}

function publicComplaint(complaint) {
  const item = typeof complaint.toObject === 'function' ? complaint.toObject() : complaint;
  const rawPhotos = item.photos || (item.photo ? (Array.isArray(item.photo) ? item.photo : [item.photo]) : (item.photoUrl ? [item.photoUrl] : []));
  const photos = Array.isArray(rawPhotos) ? rawPhotos.filter(Boolean) : [rawPhotos].filter(Boolean);
  const photoUrl = item.photoUrl || (photos.length ? photos[0] : '');

  return {
    ...item,
    id: String(item._id),
    complaintId: item.complaintId || String(item._id),
    category: item.category || item.wasteType || 'Other',
    status: normalizeStatus(item.status) || item.status || 'Pending',
    priority: normalizePriority(item.priority, item.category, item.description),
    userId: item.userId ? String(item.userId) : undefined,
    photoUrl,
    photos: photos.length ? photos : (photoUrl ? [photoUrl] : []),
    photo: photos.length ? photos : (photoUrl ? [photoUrl] : [])
  };
}

function findMemoryUserByMobile(mobile) {
  return memoryStore.users.find((user) => user.mobile === mobile);
}

function findMemoryUserById(id) {
  return memoryStore.users.find((user) => String(user._id) === String(id));
}

function upsertMemoryUser({ name, mobile, email, role = 'citizen' }) {
  let user = findMemoryUserByMobile(mobile);
  const now = new Date().toISOString();

  if (!user) {
    user = {
      _id: new mongoose.Types.ObjectId().toString(),
      name: name || '',
      mobile,
      email: email || '',
      role,
      createdAt: now,
      updatedAt: now
    };
    memoryStore.users.push(user);
  } else {
    user.name = name || user.name;
    user.email = email || user.email;
    user.updatedAt = now;
  }

  return user;
}

async function findOrCreateUser({ name, mobile, email, role = 'citizen' }) {
  if (useMemoryStore()) return upsertMemoryUser({ name, mobile, email, role });

  try {
    return await User.findOneAndUpdate(
      { mobile },
      {
        $setOnInsert: { mobile, role },
        $set: {
          ...(name ? { name } : {}),
          ...(email ? { email } : {})
        }
      },
      { new: true, upsert: true, runValidators: true }
    );
  } catch (err) {
    if (ALLOW_MEMORY_FALLBACK) {
      console.warn('MongoDB query warning, using memory fallback:', err.message);
      return upsertMemoryUser({ name, mobile, email, role });
    }
    throw err;
  }
}

async function storeOtp(mobile, otp, sessionId = '') {
  const otpRecord = {
    mobile,
    otpHash: otp ? hashValue(otp) : '',
    twoFactorSessionId: sessionId || '',
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    attempts: 0,
    verified: false
  };

  if (useMemoryStore()) {
    memoryStore.otps = memoryStore.otps.filter((item) => item.mobile !== mobile);
    memoryStore.otps.push({ ...otpRecord, _id: new mongoose.Types.ObjectId().toString() });
    return otpRecord;
  }

  try {
    await OTP.deleteMany({ mobile });
    return await OTP.create(otpRecord);
  } catch (err) {
    if (ALLOW_MEMORY_FALLBACK) {
      console.warn('MongoDB OTP store warning, using memory fallback:', err.message);
      memoryStore.otps = memoryStore.otps.filter((item) => item.mobile !== mobile);
      memoryStore.otps.push({ ...otpRecord, _id: new mongoose.Types.ObjectId().toString() });
      return otpRecord;
    }
    throw err;
  }
}

async function verifyOtpRecord(mobile, otp) {
  const twoFactorKey = cleanEnvValue(process.env.TWOFACTOR_API_KEY);
  const otpHash = hashValue(otp);

  let record = null;
  if (useMemoryStore()) {
    record = memoryStore.otps.find((item) => item.mobile === mobile && !item.verified);
  } else {
    record = await OTP.findOne({ mobile, verified: false }).sort({ createdAt: -1 });
  }

  if (!record) return { ok: false, message: 'OTP not found. Please login again.' };
  if (new Date(record.expiresAt).getTime() < Date.now()) return { ok: false, message: 'OTP expired. Please request a new code.' };
  if (record.attempts >= 5) return { ok: false, message: 'Too many OTP attempts. Please request a new code.' };

  // 1. If 2Factor session exists, verify directly with 2Factor live verification API
  if (twoFactorKey && record.twoFactorSessionId) {
    try {
      const verifyUrl = `https://2factor.in/API/V1/${encodeURIComponent(twoFactorKey)}/SMS/VERIFY/${encodeURIComponent(record.twoFactorSessionId)}/${encodeURIComponent(otp)}`;
      const data = await httpsGetJson(verifyUrl);
      console.log(`[2FACTOR VERIFY] Response for ${mobile}:`, data);

      if (data && data.Status === 'Success' && data.Details === 'OTP Matched') {
        record.verified = true;
        if (!useMemoryStore()) await record.save();
        return { ok: true };
      } else {
        record.attempts += 1;
        if (!useMemoryStore()) await record.save();
        const reason = data && data.Details ? data.Details : 'Invalid verification code';
        return { ok: false, message: reason.includes('Mismatch') ? 'Invalid OTP. Please check the SMS code received on your phone.' : reason };
      }
    } catch (err) {
      console.error('[2FACTOR VERIFY ERROR]', err.message);
    }
  }

  // 2. Standard hash verification (for Twilio, Fast2SMS, or fallback)
  record.attempts += 1;
  if (record.otpHash && record.otpHash !== otpHash) {
    if (!useMemoryStore()) await record.save();
    return { ok: false, message: 'Invalid OTP. Please check the SMS code received on your phone.' };
  }

  record.verified = true;
  if (!useMemoryStore()) await record.save();
  return { ok: true };
}

async function sendSmsToMobile(mobile, otp) {
  const twilioSid = cleanEnvValue(process.env.TWILIO_ACCOUNT_SID);
  const twilioAuth = cleanEnvValue(process.env.TWILIO_AUTH_TOKEN);
  const twilioFrom = cleanEnvValue(process.env.TWILIO_PHONE_NUMBER);
  const twoFactorKey = cleanEnvValue(process.env.TWOFACTOR_API_KEY);
  const fast2smsKey = cleanEnvValue(process.env.FAST2SMS_API_KEY);

  const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
  let realDelivered = false;
  let providerName = '';
  let sessionId = '';

  // 1. Twilio SMS (Global Cellular SMS - $15 Free Trial)
  if (twilioSid && twilioAuth && twilioFrom) {
    try {
      const authHeader = 'Basic ' + Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64');
      const targetNumber = `+91${cleanMobile}`;
      const body = new URLSearchParams({
        To: targetNumber,
        From: twilioFrom,
        Body: `🌿 SMARTCLEAN: Your citizen login OTP is ${otp}. Valid for 5 minutes.`
      });

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString(),
        signal: AbortSignal.timeout(8000)
      });
      const data = await response.json();
      console.log(`[TWILIO SMS GATEWAY] Status for ${targetNumber}:`, data.status || data.error_message || data);

      if (data && !data.error_code) {
        realDelivered = true;
        providerName = 'Twilio SMS';
        console.log(`✅ [SMS DELIVERED] Real cellular SMS delivered to ${targetNumber} via Twilio! SID: ${data.sid}`);
        return { success: true, provider: providerName, details: data };
      } else {
        console.warn(`⚠️ [TWILIO WARNING]`, data.message || data.error_message);
      }
    } catch (err) {
      console.error(`[TWILIO ERROR] Dispatch failed:`, err.message);
    }
  }

  // 2. 2Factor.in Provider (India - Live Text SMS via Universal DLT Template)
  if (twoFactorKey && !realDelivered) {
    try {
      // Use AUTOGEN SMS endpoint so 2Factor sends an official text SMS message
      const url = `https://2factor.in/API/V1/${encodeURIComponent(twoFactorKey)}/SMS/+91${encodeURIComponent(cleanMobile)}/AUTOGEN`;
      const data = await httpsGetJson(url);

      console.log(`[2FACTOR GATEWAY] Response for +91 ${cleanMobile}:`, data);

      if (data && data.Status === 'Success') {
        realDelivered = true;
        providerName = '2Factor.in SMS';
        sessionId = data.Details;
        console.log(`✅ [SMS DELIVERED] Real SMS text message sent to +91 ${cleanMobile} via 2Factor.in! Session ID: ${sessionId}`);
        return { success: true, provider: providerName, sessionId, details: data };
      } else {
        console.warn(`⚠️ [2FACTOR WARNING]`, data.Details || data.Status);
      }
    } catch (err) {
      console.error(`[2FACTOR ERROR] Dispatch failed:`, err.message);
    }
  }

  // 3. Fast2SMS Provider (India)
  if (fast2smsKey && !realDelivered) {
    try {
      let url = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(fast2smsKey)}&route=otp&variables_values=${encodeURIComponent(otp)}&numbers=${encodeURIComponent(cleanMobile)}`;
      let response = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(8000) });
      let data = await response.json();

      if (!data || !data.return) {
        url = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(fast2smsKey)}&route=q&message=${encodeURIComponent(`Your SmartClean verification OTP is ${otp}`)}&language=english&flash=0&numbers=${encodeURIComponent(cleanMobile)}`;
        response = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(8000) });
        data = await response.json();
      }

      console.log(`[FAST2SMS GATEWAY] Response for +91 ${cleanMobile}:`, data);
      if (data && data.return) {
        realDelivered = true;
        providerName = 'Fast2SMS';
        console.log(`✅ [SMS DELIVERED] Real SMS sent to phone +91 ${cleanMobile} via Fast2SMS`);
        return { success: true, provider: providerName, details: data };
      }
    } catch (err) {
      console.error(`[FAST2SMS ERROR] Dispatch failed:`, err.message);
    }
  }

  // Terminal Display for Developer Reference & Safety
  console.log(`\n======================================================`);
  console.log(`📱 OTP GENERATED FOR CITIZEN: +91 ${cleanMobile}`);
  if (sessionId) {
    console.log(`🔑 2Factor SMS Session ID: ${sessionId}`);
  } else {
    console.log(`🔑 Verification OTP Code: ${otp}`);
  }
  if (realDelivered) {
    console.log(`🚀 Live Cellular Delivery: ${providerName}`);
  } else {
    console.log(`ℹ️ Add TWILIO or 2FACTOR credentials in .env for live SMS`);
  }
  console.log(`======================================================\n`);

  return { success: realDelivered, otp, sessionId, provider: providerName };
}

function findMemoryZone(name) {
  return memoryStore.zones.find((zone) => zone.name === name);
}

function upsertMemoryZone(name, data = {}) {
  const now = new Date().toISOString();
  let zone = findMemoryZone(name);

  if (!zone) {
    zone = {
      _id: new mongoose.Types.ObjectId().toString(),
      name,
      fillLevel: 0,
      collectionRequired: false,
      sanitationStatus: 'pending',
      complaintCount: 0,
      unresolvedCount: 0,
      createdAt: now,
      updatedAt: now
    };
    memoryStore.zones.push(zone);
  }

  Object.assign(zone, data, { updatedAt: now });
  return zone;
}

async function ensureZone(name, data = {}) {
  if (useMemoryStore()) return upsertMemoryZone(name, data);

  return Zone.findOneAndUpdate(
    { name },
    {
      $setOnInsert: { name, sanitationStatus: 'pending' },
      $set: data
    },
    { new: true, upsert: true, runValidators: true }
  );
}

function generateComplaintId() {
  const year = new Date().getFullYear();
  const number = String(memoryStore.complaintSequence++).padStart(4, '0');
  return `SC-${year}-${number}`;
}

async function nextComplaintId() {
  if (useMemoryStore()) return generateComplaintId();
  const count = await Complaint.countDocuments();
  return `SC-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
}

async function getUserFromRequest(req) {
  const token = getBearerToken(req);
  const payload = verifyToken(token);

  const customMobile = normalizeMobile(
    req.headers['x-citizen-mobile'] ||
    req.headers['x-user-mobile'] ||
    req.query?.citizenMobile ||
    req.query?.mobile
  );

  if (!payload) {
    if (customMobile) {
      if (useMemoryStore()) {
        const memUser = findMemoryUserByMobile(customMobile);
        if (memUser) return memUser;
      } else {
        try {
          const dbUser = await User.findOne({ mobile: customMobile });
          if (dbUser) return dbUser;
        } catch (e) {}
      }
      return {
        _id: 'custom-citizen',
        name: 'Citizen',
        mobile: customMobile,
        role: 'citizen'
      };
    }

    if (DEMO_AUTH_BYPASS) {
      return {
        _id: 'demo-citizen',
        name: 'Demo Citizen',
        mobile: '',
        email: '',
        role: 'citizen'
      };
    }
    return null;
  }

  if (payload.role === 'admin') {
    return {
      _id: 'admin',
      email: payload.email,
      role: 'admin'
    };
  }

  if (useMemoryStore()) return findMemoryUserById(payload.id) || payload;
  let user = null;
  try {
    if (isValidObjectId(payload.id)) {
      user = await User.findById(payload.id);
    }
    if (!user && payload.mobile) {
      user = await User.findOne({ mobile: payload.mobile });
    }
  } catch (e) {}
  return user || payload;
}

async function requireCitizen(req, res, next) {
  const user = await getUserFromRequest(req);
  if (!user) return jsonError(res, 401, 'Authentication required');

  req.user = user;
  return next();
}

async function requireAdmin(req, res, next) {
  const token = getBearerToken(req);
  const payload = verifyToken(token);

  if (payload && payload.role === 'admin') {
    req.admin = payload;
    return next();
  }

  if (DEMO_AUTH_BYPASS) {
    req.admin = { role: 'admin', email: ADMIN_EMAIL };
    return next();
  }

  return jsonError(res, 403, 'Admin access required');
}

function countBy(items, field) {
  const grouped = new Map();

  for (const item of items) {
    grouped.set(item[field], (grouped.get(item[field]) || 0) + 1);
  }

  return Array.from(grouped, ([name, count]) => ({ category: name, status: name, _id: name, count }))
    .sort((a, b) => b.count - a.count);
}

function buildMemoryHotspots(limit) {
  const grouped = new Map();

  for (const complaint of memoryStore.complaints) {
    const zoneName = complaint.zone || complaint.location || 'Unassigned';
    const current = grouped.get(zoneName) || {
      _id: zoneName,
      complaintCount: 0,
      unresolvedCount: 0,
      highPriorityCount: 0,
      priorityTotal: 0
    };

    current.complaintCount += 1;
    current.priorityTotal += PRIORITY_SCORE[complaint.priority] || 2;
    if (complaint.status !== 'Resolved') current.unresolvedCount += 1;
    if (complaint.priority === 'High' || complaint.priority === 'Critical') current.highPriorityCount += 1;
    grouped.set(zoneName, current);
  }

  const hotspots = Array.from(grouped.values()).map((item) => {
    const avgPriorityScore = item.complaintCount ? item.priorityTotal / item.complaintCount : 0;
    return {
      ...item,
      avgPriorityScore,
      riskScore: item.unresolvedCount + item.highPriorityCount * 2 + avgPriorityScore
    };
  });

  hotspots.sort((a, b) => b.riskScore - a.riskScore || b.complaintCount - a.complaintCount);
  return typeof limit === 'number' ? hotspots.slice(0, limit) : hotspots;
}

async function createComplaintRecord(req) {
  const body = req.body || {};
  const category = normalizeCategory(body.category || body.wasteType);
  const description = String(body.description || '').trim();
  const location = String(body.location || body.zone || '').trim();
  const zone = normalizeZoneName(body.zone, location);
  const priority = normalizePriority(body.priority, category, description);
  const coordinates = validateCoordinates(body.latitude, body.longitude);

  if (!coordinates.valid) {
    const error = new Error(coordinates.message);
    error.statusCode = 400;
    throw error;
  }

  const uploadedFiles = req.files && req.files.length ? req.files : (req.file ? [req.file] : []);
  const uploadedUrls = uploadedFiles.map((f) => `/uploads/complaints/${f.filename}`);
  const photos = uploadedUrls.length
    ? uploadedUrls
    : (Array.isArray(body.photos) ? body.photos : (body.photoUrl ? [body.photoUrl] : (body.photo ? [body.photo] : [])));
  const photoUrl = photos[0] || body.photoUrl || body.photo || '';

  const user = req.user || await getUserFromRequest(req);
  const complaintId = await nextComplaintId();
  const reportedBy = user?.mobile || body.reportedBy || req.headers['x-citizen-mobile'] || 'citizen_anonymous';

  const data = {
    complaintId,
    userId: isValidObjectId(user?._id) ? user._id : undefined,
    category,
    wasteType: deriveWasteType(category),
    description,
    photoUrl,
    photos,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    location,
    zone,
    priority,
    status: 'Pending',
    assignedTo: body.assignedTo || '',
    reportedBy
  };

  if (useMemoryStore()) {
    const now = new Date().toISOString();
    const complaint = {
      _id: new mongoose.Types.ObjectId().toString(),
      ...data,
      createdAt: now,
      updatedAt: now
    };

    memoryStore.complaints.push(complaint);
    const memoryZone = upsertMemoryZone(zone);
    memoryZone.complaintCount += 1;
    memoryZone.unresolvedCount += 1;
    return complaint;
  }

  const complaint = await Complaint.create(data);
  await Zone.findOneAndUpdate(
    { name: zone },
    {
      $setOnInsert: { name: zone },
      $inc: { complaintCount: 1, unresolvedCount: 1 }
    },
    { upsert: true, runValidators: true }
  );
  return complaint;
}

async function getComplaintsForUser(user) {
  if (useMemoryStore()) {
    if (DEMO_AUTH_BYPASS && user && user._id === 'demo-citizen' && !user.mobile) {
      return [...memoryStore.complaints].sort(sortNewestFirst);
    }

    const matched = memoryStore.complaints
      .filter((item) => (user?._id && String(item.userId || '') === String(user._id)) || (user?.mobile && item.reportedBy === user.mobile))
      .sort(sortNewestFirst);

    if (matched.length > 0) return matched;
    return [...memoryStore.complaints].sort(sortNewestFirst);
  }

  if (DEMO_AUTH_BYPASS && user && user._id === 'demo-citizen' && !user.mobile) {
    return Complaint.find().sort({ createdAt: -1 }).limit(100);
  }

  const orConditions = [];
  if (user && isValidObjectId(user._id)) {
    orConditions.push({ userId: user._id });
  }
  if (user && user.mobile) {
    orConditions.push({ reportedBy: user.mobile });
  }

  if (orConditions.length) {
    const userComplaints = await Complaint.find({ $or: orConditions }).sort({ createdAt: -1 });
    if (userComplaints && userComplaints.length > 0) {
      return userComplaints;
    }
  }

  // Fallback: If no complaint matched the specific filter, return all complaints so citizen can track submitted reports
  return Complaint.find().sort({ createdAt: -1 }).limit(100);
}

async function getAllComplaints(query = {}) {
  const filters = buildComplaintFilter(query);

  if (useMemoryStore()) {
    return memoryStore.complaints
      .filter((complaint) => complaintMatches(complaint, { ...filters, ...(query.search ? { search: query.search } : {}) }))
      .sort(sortNewestFirst);
  }

  const mongoFilter = { ...filters };
  if (query.search) {
    const regex = new RegExp(String(query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    mongoFilter.$or = [
      { complaintId: regex },
      { category: regex },
      { location: regex },
      { zone: regex },
      { description: regex },
      { assignedTo: regex }
    ];
  }

  return Complaint.find(mongoFilter).sort({ createdAt: -1 }).limit(250);
}

async function updateComplaintStatusById(id, status, assignedTo, extraData = {}) {
  const normalizedStatus = normalizeStatus(status);
  if (!normalizedStatus) {
    const error = new Error('Invalid status');
    error.statusCode = 400;
    error.allowedValues = COMPLAINT_STATUSES;
    throw error;
  }

  const resolutionNote = extraData.resolutionNote !== undefined ? String(extraData.resolutionNote).trim() : undefined;
  const resolutionPhotos = Array.isArray(extraData.resolutionPhotos)
    ? extraData.resolutionPhotos
    : (extraData.resolutionPhotos ? [extraData.resolutionPhotos] : undefined);
  const resolvedBy = extraData.resolvedBy || 'Admin';

  if (useMemoryStore()) {
    const complaint = memoryStore.complaints.find((item) => String(item._id) === String(id) || String(item.complaintId) === String(id));
    if (!complaint) return null;

    const previousStatus = complaint.status;
    complaint.status = normalizedStatus;
    if (assignedTo !== undefined) complaint.assignedTo = assignedTo;
    complaint.updatedAt = new Date().toISOString();

    if (resolutionNote !== undefined) complaint.resolutionNote = resolutionNote;
    if (resolutionPhotos !== undefined) {
      complaint.resolutionPhotos = resolutionPhotos;
      complaint.resolutionProof = resolutionPhotos;
    }
    if (normalizedStatus === 'Resolved') {
      complaint.resolvedAt = complaint.resolvedAt || new Date().toISOString();
      complaint.resolvedBy = resolvedBy;
    }

    const zone = findMemoryZone(complaint.zone);
    if (zone && previousStatus !== 'Resolved' && normalizedStatus === 'Resolved') {
      zone.unresolvedCount = Math.max(0, zone.unresolvedCount - 1);
    }
    if (zone && previousStatus === 'Resolved' && normalizedStatus !== 'Resolved') {
      zone.unresolvedCount += 1;
    }

    return complaint;
  }

  const previous = isValidObjectId(id)
    ? await Complaint.findById(id)
    : await Complaint.findOne({ complaintId: id });
  if (!previous) return null;

  const update = {
    status: normalizedStatus,
    ...(assignedTo !== undefined ? { assignedTo } : {}),
    ...(resolutionNote !== undefined ? { resolutionNote } : {}),
    ...(resolutionPhotos !== undefined ? { resolutionPhotos, resolutionProof: resolutionPhotos } : {})
  };

  if (normalizedStatus === 'Resolved') {
    update.resolvedAt = previous.resolvedAt || new Date();
    update.resolvedBy = resolvedBy;
  }

  const complaint = isValidObjectId(id)
    ? await Complaint.findByIdAndUpdate(id, update, { new: true, runValidators: true })
    : await Complaint.findOneAndUpdate({ complaintId: id }, update, { new: true, runValidators: true });

  if (previous.status !== 'Resolved' && normalizedStatus === 'Resolved') {
    await Zone.findOneAndUpdate({ name: complaint.zone }, { $inc: { unresolvedCount: -1 } });
  }
  if (previous.status === 'Resolved' && normalizedStatus !== 'Resolved') {
    await Zone.findOneAndUpdate({ name: complaint.zone }, { $inc: { unresolvedCount: 1 } });
  }

  return complaint;
}

async function buildDashboard() {
  const complaints = useMemoryStore()
    ? [...memoryStore.complaints]
    : await Complaint.find().sort({ createdAt: -1 }).limit(500);

  const publicComplaints = complaints.map(publicComplaint);
  const stats = {
    total: publicComplaints.length,
    pending: publicComplaints.filter((item) => item.status === 'Pending').length,
    assigned: publicComplaints.filter((item) => item.status === 'Assigned').length,
    inProgress: publicComplaints.filter((item) => item.status === 'In Progress').length,
    resolved: publicComplaints.filter((item) => item.status === 'Resolved').length
  };

  return {
    stats,
    totalComplaints: stats.total,
    pendingComplaints: stats.pending,
    assignedComplaints: stats.assigned,
    inProgressComplaints: stats.inProgress,
    resolvedComplaints: stats.resolved,
    highPriorityComplaints: publicComplaints.filter((item) => item.priority === 'High' || item.priority === 'Critical').length,
    categoryStats: countBy(publicComplaints, 'category').map(({ category, count }) => ({ category, count })),
    statusStats: countBy(publicComplaints, 'status').map(({ status, count }) => ({ status, count })),
    recentComplaints: publicComplaints.sort(sortNewestFirst).slice(0, 10)
  };
}

app.get('/api', (req, res) => {
  return jsonSuccess(res, {
    name: 'SmartClean Backend API',
    purpose: 'Waste segregation, disposal tracking, and sanitation monitoring API',
    baseUrl: `http://localhost:${PORT}/api`,
    endpoints: {
      auth: ['/api/auth/register', '/api/auth/login', '/api/auth/verify-otp', '/api/auth/admin-login'],
      citizen: ['/api/complaints'],
      admin: ['/api/admin/complaints', '/api/admin/dashboard', '/api/admin/complaints/:id/status']
    }
  });
});

app.get('/', (req, res, next) => {
  const indexPath = path.join(__dirname, '..', 'frontend', 'index.html');
  if (req.accepts('html') && fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  return res.redirect('/api');
});

app.get('/api/health', (req, res) => {
  jsonSuccess(res, {
    status: 'ok',
    api: 'running',
    database: getDatabaseState(),
    storage: useMemoryStore() ? 'temporary in-memory demo data' : 'MongoDB Atlas',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email } = req.body;
    const mobile = normalizeMobile(req.body.mobile);

    if (!validateMobile(mobile)) {
      return jsonError(res, 400, 'Mobile number must be a valid Indian 10-digit number');
    }

    const user = await findOrCreateUser({ name, mobile, email, role: 'citizen' });
    const otp = crypto.randomInt(100000, 1000000).toString();
    const smsResult = await sendSmsToMobile(mobile, otp);
    await storeOtp(mobile, otp, smsResult.sessionId);

    return jsonSuccess(res, {
      message: `Verification code sent to +91 ${mobile}`,
      mobile,
      user: publicUser(user),
      smsDelivered: smsResult.success
    }, 201);
  } catch (err) {
    console.error('Register error:', err);
    return jsonError(res, 500, 'Unable to register user');
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email } = req.body;
    const mobile = normalizeMobile(req.body.mobile);

    if (!validateMobile(mobile)) {
      return jsonError(res, 400, 'Mobile number must be a valid Indian 10-digit number');
    }

    const user = await findOrCreateUser({ mobile, email, role: 'citizen' });
    const otp = crypto.randomInt(100000, 1000000).toString();
    const smsResult = await sendSmsToMobile(mobile, otp);
    await storeOtp(mobile, otp, smsResult.sessionId);

    return jsonSuccess(res, {
      message: `Verification code sent to +91 ${mobile}`,
      mobile,
      user: publicUser(user),
      smsDelivered: smsResult.success
    });
  } catch (err) {
    console.error('Login error:', err);
    return jsonError(res, 500, 'Unable to login');
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const mobile = normalizeMobile(req.body.mobile);
    const otp = String(req.body.otp || '').trim();
    const firebaseVerified = req.body.firebaseVerified === true;

    if (!validateMobile(mobile)) {
      return jsonError(res, 400, 'Mobile number must be a valid Indian 10-digit number');
    }

    if (!firebaseVerified) {
      const result = await verifyOtpRecord(mobile, otp);
      if (!result.ok) return jsonError(res, 400, result.message);
    }

    const user = await findOrCreateUser({ mobile, role: 'citizen' });
    const token = signToken({
      id: String(user._id),
      mobile: user.mobile,
      role: 'citizen'
    });

    return jsonSuccess(res, {
      message: 'OTP verified successfully',
      token,
      user: publicUser(user)
    });
  } catch (err) {
    console.error('OTP verification error:', err);
    return jsonError(res, 500, 'Unable to verify OTP');
  }
});

app.post('/api/auth/admin-login', (req, res) => {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    return jsonError(res, 500, 'Admin login is not configured on this server');
  }

  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (email !== ADMIN_EMAIL.toLowerCase() || password !== ADMIN_PASSWORD) {
    return jsonError(res, 401, 'Invalid admin credentials');
  }

  const token = signToken({ email, role: 'admin' });
  return jsonSuccess(res, {
    message: 'Admin login successful',
    token,
    admin: {
      email,
      role: 'admin'
    }
  });
});

app.post('/api/complaints', requireCitizen, upload.any(), async (req, res) => {
  try {
    req.file = req.files && req.files.length ? req.files[0] : null;
    const complaint = await createComplaintRecord(req);
    const publicItem = publicComplaint(complaint);

    return jsonSuccess(res, {
      message: 'Complaint submitted successfully',
      complaint: publicItem,
      complaintId: publicItem.complaintId
    }, 201);
  } catch (err) {
    console.error('Create complaint error:', err);
    return jsonError(res, err.statusCode || 500, err.message || 'Unable to submit complaint', {
      allowedValues: err.allowedValues
    });
  }
});

app.post('/api/complaints/submit', requireCitizen, upload.any(), async (req, res) => {
  try {
    req.file = req.files && req.files.length ? req.files[0] : null;
    const complaint = await createComplaintRecord(req);
    const publicItem = publicComplaint(complaint);

    return jsonSuccess(res, {
      message: 'Complaint received. Response time target: under 2 hours.',
      complaint: publicItem,
      complaintId: publicItem.complaintId,
      status: publicItem.status
    }, 201);
  } catch (err) {
    console.error('Submit complaint error:', err);
    return jsonError(res, err.statusCode || 500, err.message || 'Unable to submit complaint');
  }
});

app.get('/api/complaints', requireCitizen, async (req, res) => {
  try {
    const complaints = await getComplaintsForUser(req.user);
    const publicItems = complaints.map(publicComplaint);

    return jsonSuccess(res, {
      total: publicItems.length,
      complaints: publicItems
    });
  } catch (err) {
    console.error('Citizen complaints error:', err);
    return jsonError(res, 500, 'Unable to fetch complaints');
  }
});

app.get('/api/complaints/:id', requireCitizen, async (req, res) => {
  try {
    const complaint = useMemoryStore()
      ? memoryStore.complaints.find((item) => item._id === req.params.id || item.complaintId === req.params.id)
      : isValidObjectId(req.params.id)
        ? await Complaint.findById(req.params.id)
        : await Complaint.findOne({ complaintId: req.params.id });

    if (!complaint) return jsonError(res, 404, 'Complaint not found');
    return jsonSuccess(res, { complaint: publicComplaint(complaint) });
  } catch (err) {
    console.error('Complaint detail error:', err);
    return jsonError(res, 500, 'Unable to fetch complaint');
  }
});

app.put('/api/complaints/:id', requireAdmin, upload.any(), async (req, res) => {
  try {
    const uploadedPhotos = (req.files || []).map((file) => `/uploads/complaints/${file.filename}`);
    let resolutionPhotos = [];
    if (req.body.resolutionPhotos) {
      if (Array.isArray(req.body.resolutionPhotos)) {
        resolutionPhotos.push(...req.body.resolutionPhotos);
      } else if (typeof req.body.resolutionPhotos === 'string') {
        try {
          const parsed = JSON.parse(req.body.resolutionPhotos);
          if (Array.isArray(parsed)) resolutionPhotos.push(...parsed);
          else resolutionPhotos.push(req.body.resolutionPhotos);
        } catch {
          resolutionPhotos.push(req.body.resolutionPhotos);
        }
      }
    }
    resolutionPhotos.push(...uploadedPhotos);

    const extraData = {
      resolutionNote: req.body.resolutionNote,
      resolutionPhotos: resolutionPhotos.length ? resolutionPhotos : undefined,
      resolvedBy: req.user?.email || req.body.resolvedBy || 'Admin'
    };

    const complaint = await updateComplaintStatusById(req.params.id, req.body.status, req.body.assignedTo, extraData);
    if (!complaint) return jsonError(res, 404, 'Complaint not found');

    return jsonSuccess(res, {
      message: 'Complaint updated',
      complaint: publicComplaint(complaint)
    });
  } catch (err) {
    console.error('Complaint update error:', err);
    return jsonError(res, err.statusCode || 500, err.message || 'Unable to update complaint', {
      allowedValues: err.allowedValues
    });
  }
});

app.get('/api/admin/complaints', requireAdmin, async (req, res) => {
  try {
    const complaints = await getAllComplaints(req.query);
    const publicItems = complaints.map(publicComplaint);

    return jsonSuccess(res, {
      total: publicItems.length,
      complaints: publicItems
    });
  } catch (err) {
    console.error('Admin complaints error:', err);
    return jsonError(res, 500, 'Unable to fetch admin complaints');
  }
});

app.get('/api/admin/dashboard', requireAdmin, async (req, res) => {
  try {
    const dashboard = await buildDashboard();
    return jsonSuccess(res, dashboard);
  } catch (err) {
    console.error('Admin dashboard error:', err);
    return jsonError(res, 500, 'Unable to build admin dashboard');
  }
});

app.put('/api/admin/complaints/:id/status', requireAdmin, upload.any(), async (req, res) => {
  try {
    const uploadedPhotos = (req.files || []).map((file) => `/uploads/complaints/${file.filename}`);
    let resolutionPhotos = [];
    if (req.body.resolutionPhotos) {
      if (Array.isArray(req.body.resolutionPhotos)) {
        resolutionPhotos.push(...req.body.resolutionPhotos);
      } else if (typeof req.body.resolutionPhotos === 'string') {
        try {
          const parsed = JSON.parse(req.body.resolutionPhotos);
          if (Array.isArray(parsed)) resolutionPhotos.push(...parsed);
          else resolutionPhotos.push(req.body.resolutionPhotos);
        } catch {
          resolutionPhotos.push(req.body.resolutionPhotos);
        }
      }
    }
    resolutionPhotos.push(...uploadedPhotos);

    const extraData = {
      resolutionNote: req.body.resolutionNote,
      resolutionPhotos: resolutionPhotos.length ? resolutionPhotos : undefined,
      resolvedBy: req.user?.email || req.body.resolvedBy || 'Admin'
    };

    const complaint = await updateComplaintStatusById(req.params.id, req.body.status, req.body.assignedTo, extraData);
    if (!complaint) return jsonError(res, 404, 'Complaint not found');

    return jsonSuccess(res, {
      message: 'Complaint status updated successfully',
      complaint: publicComplaint(complaint)
    });
  } catch (err) {
    console.error('Admin status update error:', err);
    return jsonError(res, err.statusCode || 500, err.message || 'Unable to update complaint status', {
      allowedValues: err.allowedValues
    });
  }
});

app.put('/api/admin/complaints/:id/resolve', requireAdmin, upload.any(), async (req, res) => {
  try {
    const uploadedPhotos = (req.files || []).map((file) => `/uploads/complaints/${file.filename}`);
    let resolutionPhotos = [];
    if (req.body.resolutionPhotos) {
      if (Array.isArray(req.body.resolutionPhotos)) {
        resolutionPhotos.push(...req.body.resolutionPhotos);
      } else if (typeof req.body.resolutionPhotos === 'string') {
        try {
          const parsed = JSON.parse(req.body.resolutionPhotos);
          if (Array.isArray(parsed)) resolutionPhotos.push(...parsed);
          else resolutionPhotos.push(req.body.resolutionPhotos);
        } catch {
          resolutionPhotos.push(req.body.resolutionPhotos);
        }
      }
    }
    resolutionPhotos.push(...uploadedPhotos);

    const extraData = {
      resolutionNote: req.body.resolutionNote || req.body.note || 'Issue resolved successfully.',
      resolutionPhotos: resolutionPhotos.length ? resolutionPhotos : undefined,
      resolvedBy: req.user?.email || req.body.resolvedBy || 'Admin'
    };

    const complaint = await updateComplaintStatusById(req.params.id, 'Resolved', req.body.assignedTo, extraData);
    if (!complaint) return jsonError(res, 404, 'Complaint not found');

    return jsonSuccess(res, {
      message: 'Complaint marked as resolved successfully',
      complaint: publicComplaint(complaint)
    });
  } catch (err) {
    console.error('Admin resolve error:', err);
    return jsonError(res, err.statusCode || 500, err.message || 'Unable to resolve complaint');
  }
});

app.get('/api/zones', async (req, res) => {
  try {
    const zones = useMemoryStore()
      ? [...memoryStore.zones].sort((a, b) => Number(b.collectionRequired) - Number(a.collectionRequired) || b.complaintCount - a.complaintCount || b.fillLevel - a.fillLevel)
      : await Zone.find().sort({ collectionRequired: -1, complaintCount: -1, fillLevel: -1 });

    return jsonSuccess(res, {
      total: zones.length,
      zones
    });
  } catch (err) {
    console.error('Zones error:', err);
    return jsonError(res, 500, 'Unable to fetch zones');
  }
});

app.post('/api/zones/status', async (req, res) => {
  try {
    const {
      name,
      latitude,
      longitude,
      area,
      fillLevel = 0,
      sanitationStatus = 'pending',
      assignedTeam
    } = req.body;

    const normalizedName = normalizeZoneName(name);
    const normalizedSanitationStatus = String(sanitationStatus).trim().toLowerCase();
    const numericFillLevel = Number(fillLevel);

    if (!normalizedName) return jsonError(res, 400, 'Zone name is required');
    if (Number.isNaN(numericFillLevel) || numericFillLevel < 0 || numericFillLevel > 100) {
      return jsonError(res, 400, 'fillLevel must be a number from 0 to 100');
    }
    if (!SANITATION_STATUSES.includes(normalizedSanitationStatus)) {
      return jsonError(res, 400, 'Invalid sanitationStatus', { allowedValues: SANITATION_STATUSES });
    }

    const zoneUpdate = {
      latitude,
      longitude,
      area,
      fillLevel: numericFillLevel,
      collectionRequired: numericFillLevel >= 80,
      sanitationStatus: normalizedSanitationStatus,
      assignedTeam,
      lastBinStatusAt: new Date()
    };

    if (normalizedSanitationStatus === 'completed') zoneUpdate.lastSanitizedAt = new Date();
    const zone = await ensureZone(normalizedName, zoneUpdate);

    return jsonSuccess(res, {
      zone,
      alert: numericFillLevel >= 80 ? 'Collection required' : 'No collection alert'
    });
  } catch (err) {
    console.error('Zone status error:', err);
    return jsonError(res, 500, 'Unable to update zone status');
  }
});

app.get('/api/dashboard/summary', requireAdmin, async (req, res) => {
  try {
    const dashboard = await buildDashboard();
    return jsonSuccess(res, {
      complaints: {
        total: dashboard.stats.total,
        unresolved: dashboard.stats.total - dashboard.stats.resolved,
        resolved: dashboard.stats.resolved
      },
      stats: dashboard.stats,
      wasteTypes: dashboard.categoryStats,
      hotspots: useMemoryStore() ? buildMemoryHotspots(5) : [],
      recentComplaints: dashboard.recentComplaints
    });
  } catch (err) {
    console.error('Dashboard summary error:', err);
    return jsonError(res, 500, 'Unable to build dashboard summary');
  }
});

app.get('/api/alerts', requireAdmin, async (req, res) => {
  try {
    const complaints = (await getAllComplaints({})).map(publicComplaint);
    const urgentComplaints = complaints
      .filter((item) => item.status !== 'Resolved' && ['High', 'Critical'].includes(item.priority))
      .sort((a, b) => (PRIORITY_SCORE[b.priority] || 0) - (PRIORITY_SCORE[a.priority] || 0) || sortNewestFirst(a, b))
      .slice(0, 20);
    const collectionZones = useMemoryStore()
      ? memoryStore.zones.filter((zone) => zone.collectionRequired).sort((a, b) => b.fillLevel - a.fillLevel).slice(0, 20)
      : await Zone.find({ collectionRequired: true }).sort({ fillLevel: -1 }).limit(20);
    const pendingSanitationZones = useMemoryStore()
      ? memoryStore.zones.filter((zone) => ['pending', 'in-progress'].includes(zone.sanitationStatus)).slice(0, 20)
      : await Zone.find({ sanitationStatus: { $in: ['pending', 'in-progress'] } }).sort({ updatedAt: 1 }).limit(20);

    return jsonSuccess(res, {
      total: urgentComplaints.length + collectionZones.length + pendingSanitationZones.length,
      urgentComplaints,
      collectionZones,
      pendingSanitationZones
    });
  } catch (err) {
    console.error('Alerts error:', err);
    return jsonError(res, 500, 'Unable to fetch alerts');
  }
});

app.get('/api/zones/analysis/hotspots', requireAdmin, async (req, res) => {
  try {
    if (useMemoryStore()) {
      return jsonSuccess(res, {
        hotspots: buildMemoryHotspots(),
        message: 'Zones ranked by unresolved complaints and priority risk'
      });
    }

    const hotspots = await Complaint.aggregate([
      {
        $group: {
          _id: '$zone',
          complaintCount: { $sum: 1 },
          unresolvedCount: { $sum: { $cond: [{ $ne: ['$status', 'Resolved'] }, 1, 0] } },
          highPriorityCount: { $sum: { $cond: [{ $in: ['$priority', ['High', 'Critical']] }, 1, 0] } }
        }
      },
      {
        $addFields: {
          riskScore: { $add: ['$unresolvedCount', { $multiply: ['$highPriorityCount', 2] }] }
        }
      },
      { $sort: { riskScore: -1, complaintCount: -1 } }
    ]);

    return jsonSuccess(res, {
      hotspots,
      message: 'Zones ranked by unresolved complaints and priority risk'
    });
  } catch (err) {
    console.error('Hotspots error:', err);
    return jsonError(res, 500, 'Unable to generate hotspot analysis');
  }
});

app.get('/api/analysis/waste-types', requireAdmin, async (req, res) => {
  try {
    const complaints = (await getAllComplaints({})).map(publicComplaint);
    return jsonSuccess(res, {
      wasteTypeAnalysis: countBy(complaints, 'category').map(({ category, count }) => ({ _id: category, category, count }))
    });
  } catch (err) {
    console.error('Waste analysis error:', err);
    return jsonError(res, 500, 'Unable to generate waste type analysis');
  }
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message.includes('Only jpg')) {
    return jsonError(res, 400, err.message);
  }
  return next(err);
});

async function startServer() {
  const mongoUri = cleanEnvValue(process.env.MONGODB_URI);

  if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
    if (!ALLOW_MEMORY_FALLBACK) {
      console.error('MongoDB connection error: MONGODB_URI must start with mongodb:// or mongodb+srv://');
      process.exit(1);
    }

    runningWithoutDatabase = true;
    console.warn('MongoDB URI is invalid. Starting in temporary in-memory demo mode.');
  }

  if (!runningWithoutDatabase) {
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 });
      console.log('Connected to MongoDB Atlas');
    } catch (err) {
      if (!ALLOW_MEMORY_FALLBACK) {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
      }

      runningWithoutDatabase = true;
      console.warn('MongoDB connection failed:', err.message);
      console.warn('Starting in temporary in-memory demo mode. Data resets when the server restarts.');
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend running on http://localhost:${PORT}`);
    console.log(`Accessible on Local Network: http://0.0.0.0:${PORT}`);
    console.log('API is ready for requests');
  });
}

startServer();
