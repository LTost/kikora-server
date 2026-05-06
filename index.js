const express = require("express");
const app     = express();
const PORT    = process.env.PORT || 3000;

const db = {};

app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
	res.header("Access-Control-Allow-Headers", "Content-Type");
	if (req.method === "OPTIONS") return res.sendStatus(200);
	next();
});

app.use(express.json());

app.post("/api/place", (req, res) => {
	const { name, answer } = req.body;
	if (!name || !answer) return res.status(400).json({ error: "name og answer kreves" });
	db[name] = answer;
	console.log(`[+] Lagret: ${name} => ${answer}`);
	res.json({ ok: true });
});

app.post("/api/get", (req, res) => {
	const { name } = req.body;
	if (!name) return res.status(400).json({ error: "name kreves" });
	res.json({ answer: db[name] || null });
});

app.get("/", (req, res) => res.json({ status: "ok", entries: Object.keys(db).length }));

app.listen(PORT, () => console.log(`Kikora server kjører på port ${PORT}`));
