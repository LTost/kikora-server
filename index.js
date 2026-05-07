const express = require("express");
const app     = express();
const PORT    = process.env.PORT || 3000;

const REDIS_URL   = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Upstash Redis REST-kall
async function redisGet(key) {
	if (!REDIS_URL) return null;
	const res = await fetch(`${REDIS_URL}/get/${encodeURIComponent(key)}`, {
		headers: { Authorization: `Bearer ${REDIS_TOKEN}` }
	});
	const data = await res.json();
	return data.result || null;
}

async function redisSet(key, value) {
	if (!REDIS_URL) return;
	await fetch(`${REDIS_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}`, {
		headers: { Authorization: `Bearer ${REDIS_TOKEN}` }
	});
}

async function redisDel(key) {
	if (!REDIS_URL) return false;
	const res = await fetch(`${REDIS_URL}/del/${encodeURIComponent(key)}`, {
		headers: { Authorization: `Bearer ${REDIS_TOKEN}` }
	});
	const data = await res.json();
	return data.result > 0;
}

async function redisKeys() {
	if (!REDIS_URL) return [];
	const res = await fetch(`${REDIS_URL}/keys/*`, {
		headers: { Authorization: `Bearer ${REDIS_TOKEN}` }
	});
	const data = await res.json();
	return data.result || [];
}

app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
	res.header("Access-Control-Allow-Headers", "Content-Type");
	if (req.method === "OPTIONS") return res.sendStatus(200);
	next();
});

app.use(express.json());

app.post("/api/place", async (req, res) => {
	const { name, answer } = req.body;
	if (!name || !answer) return res.status(400).json({ error: "name og answer kreves" });
	await redisSet(name, answer);
	console.log(`[+] Lagret: ${name} => ${answer}`);
	res.json({ ok: true });
});

app.post("/api/get", async (req, res) => {
	const { name } = req.body;
	if (!name) return res.status(400).json({ error: "name kreves" });
	const answer = await redisGet(name);
	if (answer) console.log(`[?] Hentet: ${name} => ${answer}`);
	res.json({ answer });
});

app.post("/api/delete", async (req, res) => {
	const { name } = req.body;
	if (!name) return res.status(400).json({ error: "name kreves" });
	const deleted = await redisDel(name);
	console.log(`[-] Slettet: ${name} (fantes: ${deleted})`);
	res.json({ ok: true, deleted });
});

app.get("/api/all", async (req, res) => {
	const keys = await redisKeys();
	const result = {};
	for (const key of keys) {
		result[key] = await redisGet(key);
	}
	res.json(result);
});

app.get("/", (req, res) => res.json({ status: "ok", redis: !!REDIS_URL }));

app.listen(PORT, () => console.log(`Kikora server kjører på port ${PORT}, Redis: ${!!REDIS_URL}`));
