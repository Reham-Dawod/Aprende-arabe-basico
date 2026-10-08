// api/chat.js
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const API_KEY = process.env.GEMINI_API_KEY; 

    if (!API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY no configurada en Vercel.' });
    }

    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const { userQuery, history } = body || {};

        if (!userQuery) {
            return res.status(400).json({ error: 'Consulta vacía' });
        }

        const SYSTEM_PROMPT = `Eres Reham (ريهام), una profesora nativa, experta y apasionada de lengua y cultura árabe. Tu objetivo es enseñar árabe básico de forma pedagógica, amigable, clara y respetuosa. 
Reglas de respuesta:
1. Responde siempre en español fluido.
2. Cada vez que incluyas una palabra o frase en árabe, pon la escritura en alfabeto árabe (con vocalización diacrítica/harakat cuando sea útil), seguida inmediatamente de su transliteración/pronunciación en fonética latina entre paréntesis o cursiva, y su traducción al español.
3. Si el usuario pregunta por dialectos (marroquí, egipcio, levantino), explica amablemente la diferencia con el Árabe Estándar Moderno (Fusha).
4. Mantén un tono cálido, alentador y profesional.
5. Utiliza formato Markdown con negritas y viñetas para que la explicación sea fácil de leer.`;

        const contents = [
            { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
            { role: "model", parts: [{ text: "¡Comprendido! Asumo mi rol como la Profesora Reham." }] },
            ...(history || []).slice(-8)
        ];

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({ error: data.error?.message || 'Error en Gemini API' });
        }

        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No se obtuvo respuesta.";
        return res.status(200).json({ reply });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
