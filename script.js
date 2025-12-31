// 1. Apni API Key yahan sahi se rakhein
const API_KEY = "AIzaSyBhXCvtgxTOTuwd7_RHRYx7_FgstFY9ifQ"; 

// 2. Files handle karne ke liye function (Image Preview)
function handleFiles(files) {
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = ""; 

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')){ continue }

        const img = document.createElement("img");
        img.classList.add("obj");
        img.style.width = "100px"; // Chhoti preview images ke liye
        img.style.margin = "5px";
        gallery.appendChild(img);

        const reader = new FileReader();
        reader.onload = (function(aImg) { 
            return function(e) { aImg.src = e.target.result; }; 
        })(img);
        reader.readAsDataURL(file);
    }
}

// 3. Asli AI Notes generate karne ka function
async function generateNotes() {
    const outputSection = document.getElementById('output-notes');
    const content = document.getElementById('notes-content');
    const imageFiles = document.getElementById('fileElem').files;

    // Check agar files hain
    if (imageFiles.length === 0) {
        alert("Pehle chapter ki images upload karein!");
        return;
    }

    content.innerHTML = "⌛ Gemini AI images ko scan kar raha hai aur notes bana raha hai...";
    outputSection.style.display = "block";

    try {
        // Image ko AI ke samajhne layak format mein badalna
        const imageToPart = async (file) => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve({
                    inlineData: { data: reader.result.split(',')[1], mimeType: file.type }
                });
                reader.readAsDataURL(file);
            });
        };

        const imageParts = await Promise.all([...imageFiles].map(imageToPart));

        // Google Gemini API URL
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: "In images ko dhyan se padhein aur inka ek 'Ready-to-read' study note banayein. Headings, bullet points aur important definitions ka use karein. Language Hinglish rakhein." },
                        ...imageParts
                    ]
                }]
            })
        });

        const data = await response.json();

        // Check if response is successful
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            const aiText = data.candidates[0].content.parts[0].text;
            content.innerText = aiText; // AI ka banaya hua note screen par dikhayega
        } else {
            console.error("API Error Response:", data);
            content.innerHTML = "❌ AI ne response nahi diya. Shayad API Key ki limit khatam ho gayi hai ya key galat hai.";
        }

    } catch (error) {
        console.error("Connection Error:", error);
        content.innerHTML = "❌ Connection Error! Internet check karein ya Console mein error dekhein.";
    }
}