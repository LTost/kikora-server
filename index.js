const express = require("express");
const cors    = require("cors");
const fs      = require("fs");

const app  = express();
const DB   = "./answers.json";
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Last inn DB fra fil
function loadDB() {
	if (!fs.existsSync(DB)) return {};
	try { return JSON.parse(fs.readFileSync(DB, "utf8")); }
	catch (e) { return {}; }
}

function saveDB(data) {
	fs.writeFileSync(DB, JSON.stringify(data, null, 2));
}

// POST /api/place — lagre riktig svar
// Body: { name: "C173608|C173609|C173626|1103711620", answer: "5,0 cm" }
app.post("/api/place", (req, res) => {
	const { name, answer } = req.body;
	if (!name || !answer) return res.status(400).json({ error: "name og answer kreves" });

	const db = loadDB();
	db[name] = answer;
	saveDB(db);

	console.log(`[+] Lagret: ${name} => ${answer}`);
	res.json({ ok: true });
});

// POST /api/get — hent svar
// Body: { name: "C173608|C173609|C173626|1103711620" }
app.post("/api/get", (req, res) => {
	const { name } = req.body;
	if (!name) return res.status(400).json({ error: "name kreves" });

	const db = loadDB();
	const answer = db[name];

	if (answer) {
		console.log(`[?] Hentet: ${name} => ${answer}`);
		res.json({ answer });
	} else {
		res.json({ answer: null });
	}
});

// GET / — health check
app.get("/", (req, res) => res.send("Kikora answer server is running"));

app.listen(PORT, () => console.log(`Server kjører på port ${PORT}`));
