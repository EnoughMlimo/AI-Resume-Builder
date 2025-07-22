# AI Resume Builder

This is an intelligent resume generation system that creates customized, ATS-friendly resumes based on user inputs.

## How the Website Works

### 1. Sidebar (Left)
- **Resume History:** All your resumes are saved locally and listed in the sidebar. You can load, rename, duplicate, or delete any resume.
- **New Resume:** Click "+ New Resume" to start a fresh resume.
- **Export/Import:** Export all resumes as PDF, DOCX, or TXT. Import resumes from a TXT file (with each resume separated by `---`).

### 2. Resume Input
- **Single Textbox:** Paste or type your entire resume, or just your career details, into the large textbox.
- **Generate Resume:** Click "Generate Resume" to have the AI parse and structure your input into a professional resume.
- **Get Suggestions:** Click "Get Suggestions" to receive AI-powered recommendations for skills, summary, and keywords based on your target job role or industry.

### 3. AI Features
- **AI Parsing:** Uses Google Gemini API to turn your raw input into a structured resume, extracting sections like Experience, Education, Technical Skills, Soft Skills, Achievements, and Key Projects.
- **Smart Suggestions:** The AI can suggest tailored skills, summaries, and keywords for your chosen job role or industry.

### 4. Resume Preview
- **Section-by-Section Preview:** Use the tabs above the preview to view your full resume or just one section (Summary, Experience, Education, Skills).
- **Live Update:** The preview updates instantly after generating or editing your resume.
- **Multiple Templates:** Choose from three visual templates for your resume.

### 5. Export/Import
- **Export:** Download your resumes as PDF, DOCX, or TXT files for easy sharing or printing.
- **Import:** Upload a TXT file to add resumes to your history.

### 6. Privacy
- **Local Storage:** All your data is stored in your browser only. Nothing is uploaded to a server except for the text you send to the AI for content generation.

## Technical Specifications

- **Frontend:** HTML, CSS, JavaScript
- **API:** Google Gemini API for AI-powered content generation.
- **Libraries:**
    - `html2pdf.js` for PDF export.
    - `docx` for DOCX export.

## How to Use

1.  Open `index.html` in your web browser.
2.  Fill out the form with your personal information, work experience, education, and skills.
3.  Use the "Generate Resume" and "Get Suggestions" buttons for AI-powered help.
4.  Choose a template and preview your resume.
5.  Export or import resumes as needed.

</rewritten_file> 