# GAS → Vercel Login/Forgot-Password API

## 🩹 নতুন ফিক্স: "Failed to send email: no subject"

আপনার Apps Script `MailApp`/`GmailApp` দিয়ে ইমেইল পাঠানোর সময় একটা **subject** প্যারামিটার আশা করে, কিন্তু আগে `/api/send-code` সেটা পাঠাচ্ছিল না — তাই আপনার script নিজেই ভেতরে `throw new Error("no subject")` করে দিচ্ছিল, আর সেটা ধরা পরে `"Failed to send email: no subject"` হিসেবে ফেরত আসছিল।

**যা বদলানো হয়েছে:** `api/send-code.js` এখন সবসময় একটা `subject` পাঠায় (ডিফল্ট: *"Your verification code"*), Apps Script কল করার সময়। আপনি চাইলে:
- Vercel-এ `DEFAULT_EMAIL_SUBJECT` env variable বসিয়ে ডিফল্ট টেক্সট বদলাতে পারবেন, অথবা
- প্রতিটা কলে নিজের `subject` (এবং চাইলে `message`) পাঠাতে পারবেন: `{ "email": "...", "subject": "আপনার কোড", "message": "..." }`

⚠️ **সততার সাথে একটা কথা বলে রাখি:** Google আপনার Apps Script-এর ভেতরের কোড (doGet/doPost) আমাকে fetch করতে দেয় না (robots.txt ব্লক করে), তাই আমি অনুমান করেছি যে আপনার script ঠিক `subject` নামেই প্যারামিটারটা পড়ে — কারণ error message-এ ঠিক ওই শব্দটাই ছিল। **যদি রিডিপ্লয়ের পরও একই এরর আসে**, আপনার Apps Script-এর `doGet`/`doPost` কোডটা আমাকে পাঠান (Extensions → Apps Script থেকে কপি করে) — তাহলে প্যারামিটারের নাম হুবহু মিলিয়ে ফিক্স করে দেব।

## 🎨 UI আপডেট

`index.html` এখন ফোনে ভালোভাবে কাজ করে: ছোট স্ক্রিনে ন্যাভিগেশন hamburger মেনুতে ভাঁজ হয়, ইনপুট বক্সগুলো iOS-এ zoom করে না, টেবিল আর কোড ব্লক পাশে স্ক্রল হয়, বাটনগুলো টাচের জন্য যথেষ্ট বড়, আর Base URL এখন যেই ডোমেইনে হোস্ট হয়েছে সেটা থেকে automatic ধরে নেয় (হার্ডকোড করা পুরনো URL আর দেখাবে না)।


আপনার Google Apps Script Web App এর সামনে একটা Vercel API — যাতে PHP থেকে সহজে **কোড পাঠানো (send code)** আর **কোড যাচাই (verify code)** করা যায়। এটা একটা সাধারণ password-forget/OTP সিস্টেমে যা যা লাগে তার মূল অংশ।

Apps Script URL হিসেবে এখানে যেটা ব্যবহার করা হয়েছে:
```
https://script.google.com/macros/s/AKfycbx2g_SYx03AQQ2RkcfiAxLNd4qePy1DiboQPdcA4wJ1J1MFYUM6QnT3UMpUkjSc27bF3Q/exec
```

## ⚠️ গুরুত্বপূর্ণ assumption

আমি আপনার Apps Script এর ভেতরের কোড দেখতে পারিনি (Google robots.txt / URL দৈর্ঘ্যের কারণে fetch ব্লক হয়েছে)। তাই ধরে নেওয়া হয়েছে আপনার script:

- `e.parameter.action` (মান: `"sendCode"` বা `"verifyCode"`), `e.parameter.email`, `e.parameter.code` — এই নামে parameter গুলো পড়ে
- JSON রেসপন্স দেয়, যেমন `{ "success": true }` অথবা `{ "success": false, "message": "..." }`
- `doGet(e)` ফাংশন আছে (GET request দিয়ে কল হয়)

**যদি আপনার script অন্যভাবে কাজ করে**, নিচের জায়গাগুলো বদলাতে হবে:

| তোমার script যা করে | কী বদলাবে |
|---|---|
| শুধু `doPost(e)` আছে, `doGet` নেই | Vercel-এ env variable `GAS_METHOD=POST` সেট করুন |
| parameter এর নাম আলাদা (যেমন `mail` না `email`) | `api/send-code.js` ও `api/verify-code.js` তে `action`/`email`/`code` কী-গুলো বদলান |
| রেসপন্স ফরম্যাট আলাদা (যেমন `{"status":"ok"}`) | PHP ডেমো ফাইলে `$result['success']` চেক করার জায়গাটা বদলান |

এই default না মিললে, আপনার script এর `doGet`/`doPost` কোডটা পাঠালে আমি হুবহু মিলিয়ে ঠিক করে দিতে পারব।

## ফোল্ডার স্ট্রাকচার

```
gas-vercel-proxy/
├── index.html                   ← 3D animated API doc page (root URL)
├── api/
│   ├── _lib/
│   │   └── gasClient.js        ← Apps Script কল করার শেয়ারড লজিক
│   ├── send-code.js             ← POST /api/send-code
│   ├── verify-code.js           ← POST /api/verify-code
│   └── proxy.js                 ← জেনেরিক পাস-থ্রু (অন্য যেকোনো action এর জন্য)
├── forgot-password-demo.php     ← পুরো ফ্লো এর চলমান ডেমো
├── example.php                  ← কার্ল দিয়ে সহজ উদাহরণ
├── package.json
├── .env.example
└── README.md
```

## 🩹 404 কেন হচ্ছিল

`https://gmail-code-verify-v2.vercel.app/` (মূল root URL) এ hit করলে 404 আসছিল কারণ প্রজেক্টে root এ কোনো ফাইল ছিল না — শুধু `/api/...` ফাংশন ছিল। এখন `index.html` যোগ করা হয়েছে, Vercel এটা এমনিতেই static ফাইল হিসেবে root এ সার্ভ করবে, তাই re-deploy করলেই 404 চলে যাবে।

এই `index.html` একটা animated 3D API documentation পেজ — উপরে ঘোরানো low-poly shapes ও কাচের মতো blob (Three.js দিয়ে), নিচে দুইটা endpoint এর বিস্তারিত ডকুমেন্টেশন, এবং একদম নিচে একটা লাইভ "Try it" প্যানেল যেটা আপনার আসল deploy করা `/api/send-code` ও `/api/verify-code` কে সরাসরি কল করে।

## ১. Deploy করুন

```bash
npm i -g vercel
cd gas-vercel-proxy
vercel
```
আপনার এই প্রজেক্টের আসল URL: `https://gmail-code-verify-v2.vercel.app`

## ২. এন্ডপয়েন্টগুলো

### কোড পাঠান
```
POST https://gmail-code-verify-v2.vercel.app/api/send-code
Body: { "email": "user@example.com" }
```
এটা ভেতরে Apps Script কে `?action=sendCode&email=user@example.com` দিয়ে কল করে।

### কোড যাচাই
```
POST https://gmail-code-verify-v2.vercel.app/api/verify-code
Body: { "email": "user@example.com", "code": "123456" }
```
এটা ভেতরে Apps Script কে `?action=verifyCode&email=...&code=...` দিয়ে কল করে।

### GET দিয়েও কল করা যায় (টেস্ট করার জন্য সুবিধাজনক)
```
https://gmail-code-verify-v2.vercel.app/api/send-code?email=user@example.com
https://gmail-code-verify-v2.vercel.app/api/verify-code?email=user@example.com&code=123456
```

## ৩. PHP থেকে ব্যবহার

- `example.php` — শুধু দুইটা API কল করার সহজ curl উদাহরণ
- `forgot-password-demo.php` — **সম্পূর্ণ চলমান ডেমো**: email ফর্ম → code ফর্ম → নতুন password ফর্ম, PHP session দিয়ে ধাপ মনে রাখে। এই ফাইলের ভেতরে `$API_BASE` বদলে আপনার আসল Vercel URL বসিয়ে সরাসরি চালাতে পারবেন।

পাসওয়ার্ড রিসেটের শেষ ধাপ — অর্থাৎ কোড ভেরিফাই হওয়ার পর নতুন পাসওয়ার্ড আপনার নিজের ডাটাবেজে (MySQL ইত্যাদি) সেভ করা — সেটা আপনার নিজের অ্যাপ্লিকেশনের অংশ, তাই `forgot-password-demo.php` তে ওই জায়গায় একটা comment রাখা আছে যেখানে আপনার `UPDATE users SET password = ...` বসাবেন।

## নিরাপত্তা সংক্রান্ত পরামর্শ (সাধারণ ভালো চর্চা)

- কোড কয়েক মিনিট পর expire করে দিন (এটা আপনার Apps Script এর দায়িত্ব)
- একই ইমেইলে বারবার কোড পাঠানো rate-limit করুন, যাতে কেউ spam না করতে পারে
- verify-code এর রেসপন্সে আসল কোড কখনো ফেরত পাঠাবেন না
- ইমেইল আসলে সিস্টেমে আছে কিনা তা প্রকাশ না করে সবসময় একই রকম মেসেজ দিন (যেমন "কোড পাঠানো হয়েছে যদি ইমেইলটি নিবন্ধিত থাকে")

## যদি default assumption না মেলে

আপনার Apps Script এর `doGet`/`doPost` ফাংশনের কোডটা শেয়ার করলে আমি `api/_lib/gasClient.js`, `api/send-code.js`, ও `api/verify-code.js` — এই তিনটা ফাইল আপনার script এর সাথে হুবহু মিলিয়ে ঠিক করে দেব।
