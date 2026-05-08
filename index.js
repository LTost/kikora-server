const express = require("express");
const app     = express();
const PORT    = process.env.PORT || 3000;

const REDIS_URL   = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// ===================== REDIS =====================
async function redisGet(key) {
	if (!REDIS_URL) return null;
	try {
		const res = await fetch(`${REDIS_URL}/get/${encodeURIComponent(key)}`, {
			headers: { Authorization: `Bearer ${REDIS_TOKEN}` }
		});
		const data = await res.json();
		return data.result || null;
	} catch(e) { console.error("redisGet feil:", e.message); return null; }
}

async function redisSet(key, value) {
	if (!REDIS_URL) return;
	try {
		await fetch(`${REDIS_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}`, {
			headers: { Authorization: `Bearer ${REDIS_TOKEN}` }
		});
	} catch(e) { console.error("redisSet feil:", e.message); }
}

async function redisDel(key) {
	if (!REDIS_URL) return false;
	try {
		const res = await fetch(`${REDIS_URL}/del/${encodeURIComponent(key)}`, {
			headers: { Authorization: `Bearer ${REDIS_TOKEN}` }
		});
		const data = await res.json();
		return data.result > 0;
	} catch(e) { console.error("redisDel feil:", e.message); return false; }
}

async function redisKeys() {
	if (!REDIS_URL) return [];
	try {
		const res = await fetch(`${REDIS_URL}/keys/*`, {
			headers: { Authorization: `Bearer ${REDIS_TOKEN}` }
		});
		const data = await res.json();
		return data.result || [];
	} catch(e) { console.error("redisKeys feil:", e.message); return []; }
}

// ===================== CORS =====================
app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
	res.header("Access-Control-Allow-Headers", "Content-Type");
	if (req.method === "OPTIONS") return res.sendStatus(200);
	next();
});

app.use(express.json());

// ===================== ENDEPUNKTER =====================

// POST /api/place — lagre riktig svar
app.post("/api/place", async (req, res) => {
	const { name, answer } = req.body;
	if (!name || !answer) return res.status(400).json({ error: "name og answer kreves" });
	await redisSet(name, answer);
	console.log(`[+] Lagret: ${name} => ${answer}`);
	res.json({ ok: true });
});

// POST /api/get — hent svar
app.post("/api/get", async (req, res) => {
	const { name } = req.body;
	if (!name) return res.status(400).json({ error: "name kreves" });
	const answer = await redisGet(name);
	if (answer) console.log(`[?] Hentet: ${name} => ${answer}`);
	res.json({ answer: answer || null });
});

// POST /api/delete — slett feil svar
app.post("/api/delete", async (req, res) => {
	const { name } = req.body;
	if (!name) return res.status(400).json({ error: "name kreves" });
	const deleted = await redisDel(name);
	console.log(`[-] Slettet: ${name} (fantes: ${deleted})`);
	res.json({ ok: true, deleted });
});

// GET /api/all — se alle lagrede svar (debug)
app.get("/api/all", async (req, res) => {
	const keys = await redisKeys();
	const result = {};
	await Promise.all(keys.map(async key => {
		result[key] = await redisGet(key);
	}));
	res.json(result);
});

// GET / — health check
app.get("/", (req, res) => res.json({
	status: "ok",
	redis: !!REDIS_URL,
}));

app.listen(PORT, () => console.log(`Kikora server kjorer pa port ${PORT}, Redis: ${!!REDIS_URL}`));
