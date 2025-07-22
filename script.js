document.addEventListener('DOMContentLoaded', () => {
    const previewContent = document.getElementById('preview-content');
    const rawResumeInput = document.getElementById('raw-resume-input');
    const generateBtn = document.getElementById('generate-from-text');
    const saveDataBtn = document.getElementById('save-data');
    const templateSelect = document.getElementById('template-select');
    const exportPdfBtn = document.getElementById('export-pdf');
    const exportDocxBtn = document.getElementById('export-docx');
    const exportHtmlBtn = document.getElementById('export-html');
    const sidebarHistory = document.getElementById('resume-history');
    const newResumeBtn = document.getElementById('new-resume');
    const sectionTabs = document.querySelectorAll('.section-tab');

    let parsedData = {}; // Global variable to hold the parsed resume data
    let currentResumeId = null;
    let currentSection = 'full';

    // --- Sidebar/History Logic ---
    function getAllResumes() {
        return JSON.parse(localStorage.getItem('resumeHistory') || '[]');
    }
    function saveResumeToHistory(id, rawText, parsed) {
        let resumes = getAllResumes();
        if (!id) {
            id = Date.now().toString();
        }
        const name = (parsed && parsed.name) ? parsed.name : `Resume ${id}`;
        const entry = { id, name, rawText, parsed, updated: new Date().toISOString() };
        resumes = resumes.filter(r => r.id !== id); // Remove old if exists
        resumes.unshift(entry); // Add to top
        localStorage.setItem('resumeHistory', JSON.stringify(resumes));
        renderHistory();
        return id;
    }
    function renderHistory() {
        const resumes = getAllResumes();
        sidebarHistory.innerHTML = '';
        resumes.forEach(resume => {
            const li = document.createElement('li');
            li.textContent = resume.name;
            li.title = resume.updated ? `Last updated: ${new Date(resume.updated).toLocaleString()}` : '';
            li.onclick = () => loadResume(resume.id);
            // Delete button
            const delBtn = document.createElement('button');
            delBtn.textContent = '🗑';
            delBtn.className = 'delete-history';
            delBtn.onclick = (e) => {
                e.stopPropagation();
                deleteResume(resume.id);
            };
            // Rename button
            const renameBtn = document.createElement('button');
            renameBtn.textContent = '✏️';
            renameBtn.className = 'rename-history';
            renameBtn.onclick = (e) => {
                e.stopPropagation();
                const newName = prompt('Enter new name for this resume:', resume.name);
                if (newName && newName.trim()) {
                    renameResume(resume.id, newName.trim());
                }
            };
            // Duplicate button
            const dupBtn = document.createElement('button');
            dupBtn.textContent = '📄';
            dupBtn.className = 'duplicate-history';
            dupBtn.onclick = (e) => {
                e.stopPropagation();
                duplicateResume(resume.id);
            };
            li.appendChild(renameBtn);
            li.appendChild(dupBtn);
            li.appendChild(delBtn);
            sidebarHistory.appendChild(li);
        });
    }
    function loadResume(id) {
        const resumes = getAllResumes();
        const resume = resumes.find(r => r.id === id);
        if (resume) {
            rawResumeInput.value = resume.rawText;
            parsedData = resume.parsed || {};
            currentResumeId = id;
            renderPreview(parsedData, currentSection);
        }
    }
    function deleteResume(id) {
        let resumes = getAllResumes();
        resumes = resumes.filter(r => r.id !== id);
        localStorage.setItem('resumeHistory', JSON.stringify(resumes));
        renderHistory();
        // If current resume deleted, clear form
        if (currentResumeId === id) {
            rawResumeInput.value = '';
            previewContent.innerHTML = '';
            parsedData = {};
            currentResumeId = null;
        }
    }
    function renameResume(id, newName) {
        let resumes = getAllResumes();
        resumes = resumes.map(r => r.id === id ? { ...r, name: newName, updated: new Date().toISOString() } : r);
        localStorage.setItem('resumeHistory', JSON.stringify(resumes));
        renderHistory();
    }
    function duplicateResume(id) {
        const resumes = getAllResumes();
        const resume = resumes.find(r => r.id === id);
        if (resume) {
            const newId = Date.now().toString();
            const newName = resume.name + ' (Copy)';
            const entry = { ...resume, id: newId, name: newName, updated: new Date().toISOString() };
            resumes.unshift(entry);
            localStorage.setItem('resumeHistory', JSON.stringify(resumes));
            renderHistory();
        }
    }
    newResumeBtn.addEventListener('click', () => {
        rawResumeInput.value = '';
        previewContent.innerHTML = '';
        parsedData = {};
        currentResumeId = null;
    });

    // --- Section-by-Section Preview Logic ---
    sectionTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            sectionTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentSection = tab.dataset.section;
            renderPreview(parsedData, currentSection);
        });
    });
    // Set default active tab
    document.getElementById('tab-full').classList.add('active');

    // --- Resume Generation and Parsing ---
    loadData();
    renderHistory();

    generateBtn.addEventListener('click', async () => {
        const rawText = rawResumeInput.value;
        if (!rawText) {
            alert('Please paste your resume information first.');
            return;
        }
        await parseAndRender(rawText);
    });

    templateSelect.addEventListener('change', (e) => {
        previewContent.className = e.target.value;
        renderPreview(parsedData, currentSection); // Re-render with new template
    });

    saveDataBtn.addEventListener('click', () => {
        if (!parsedData || !rawResumeInput.value) {
            alert('Please generate and preview your resume first.');
            return;
        }
        currentResumeId = saveResumeToHistory(currentResumeId, rawResumeInput.value, parsedData);
        alert('Resume saved to history!');
    });

    async function parseAndRender(rawText) {
        const apiKey = 'AIzaSyBTUgW-mbIOHIPjpW3xomOfZX5SM3-YmVo'; // User's API Key
        const prompt = `Please parse the following resume text and return a structured JSON object. The JSON should include fields for "name", "email", "phone", "linkedin", "github", "summary", an array for "experience" (with "company", "jobTitle", "dates", "description"), an array for "education" (with "school", "degree", "dates"), arrays for "technicalSkills" and "softSkills", and arrays for "achievements" and "keyProjects". Here is the text: \n\n${rawText}`;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
            
            const data = await response.json();
            let jsonString = data.candidates[0].content.parts[0].text;
            jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
            
            parsedData = JSON.parse(jsonString);
            renderPreview(parsedData, currentSection);

        } catch (error) {
            console.error('Error parsing resume:', error);
            alert('Failed to parse resume. Please check the console for details.');
        }
    }

    function renderPreview(data, section = 'full') {
        if (!data) return;
        let html = '';
        if (section === 'full') {
            html = fullResumeHTML(data);
        } else if (section === 'summary') {
            html = `<h2>Summary</h2><p>${(data.summary || '').replace(/\n/g, '<br>')}</p>`;
        } else if (section === 'experience') {
            html = `<h2>Work Experience</h2>${(data.experience || []).map(exp => `
                <div><h3>${exp.jobTitle || ''} at ${exp.company || ''}</h3><p><em>${exp.dates || ''}</em></p><p>${(exp.description || '').replace(/\n/g, '<br>')}</p></div>
            `).join('')}`;
        } else if (section === 'education') {
            html = `<h2>Education</h2>${(data.education || []).map(edu => `
                <div><h3>${edu.degree || ''} from ${edu.school || ''}</h3><p><em>${edu.dates || ''}</em></p></div>
            `).join('')}`;
        } else if (section === 'skills') {
            html = '';
            if (data.technicalSkills && data.technicalSkills.length) {
                html += `<h2>Technical Skills</h2><ul>${data.technicalSkills.map(skill => `<li>${skill.trim()}</li>`).join('')}</ul>`;
            }
            if (data.softSkills && data.softSkills.length) {
                html += `<h2>Soft Skills</h2><ul>${data.softSkills.map(skill => `<li>${skill.trim()}</li>`).join('')}</ul>`;
            }
            if (!html) html = '<em>No skills listed.</em>';
        }
        previewContent.innerHTML = html;
    }
    function fullResumeHTML(data) {
        const experiences = (data.experience || []).map(exp => `
            <div>
                <h3>${exp.jobTitle || ''} at ${exp.company || ''}</h3>
                <p><em>${exp.dates || ''}</em></p>
                <p>${(exp.description || '').replace(/\n/g, '<br>')}</p>
            </div>
        `).join('');
        const educations = (data.education || []).map(edu => `
            <div>
                <h3>${edu.degree || ''} from ${edu.school || ''}</h3>
                <p><em>${edu.dates || ''}</em></p>
            </div>
        `).join('');
        let skills = '';
        if (data.technicalSkills && data.technicalSkills.length) {
            skills += `<h2>Technical Skills</h2><ul>${data.technicalSkills.map(skill => `<li>${skill.trim()}</li>`).join('')}</ul>`;
        }
        if (data.softSkills && data.softSkills.length) {
            skills += `<h2>Soft Skills</h2><ul>${data.softSkills.map(skill => `<li>${skill.trim()}</li>`).join('')}</ul>`;
        }
        const achievements = (data.achievements || []).map(a => `<li>${a}</li>`).join('');
        const keyProjects = (data.keyProjects || []).map(p => `<li>${p}</li>`).join('');
        return `
            <h1>${data.name || ''}</h1>
            <p>${data.email || ''} | ${data.phone || ''} | ${data.linkedin || ''} | ${data.github || ''}</p>
            <h2>Summary</h2>
            <p>${(data.summary || '').replace(/\n/g, '<br>')}</p>
            <h2>Work Experience</h2>
            ${experiences}
            <h2>Education</h2>
            ${educations}
            ${skills}
            ${achievements ? `<h2>Achievements</h2><ul>${achievements}</ul>` : ''}
            ${keyProjects ? `<h2>Key Projects</h2><ul>${keyProjects}</ul>` : ''}
        `;
    }

    // --- Legacy loadData for backward compatibility ---
    function loadData() {
        // Load last used resume if any
        const resumes = getAllResumes();
        if (resumes.length > 0) {
            loadResume(resumes[0].id);
        }
    }

    // --- Export Functions (unchanged) ---
    exportPdfBtn.addEventListener('click', () => {
        const element = document.getElementById('preview-content');
        html2pdf().from(element).set({
            margin: 1,
            filename: 'resume.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        }).save();
    });

    exportDocxBtn.addEventListener('click', () => {
        if (!parsedData.name) {
            alert('Please generate the resume first.');
            return;
        }
        const { Document, Packer, Paragraph, TextRun, HeadingLevel } = docx;
        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({ text: parsedData.name || '', heading: HeadingLevel.TITLE, alignment: 'center' }),
                    new Paragraph({ text: `${parsedData.email || ''} | ${parsedData.phone || ''} | ${parsedData.linkedin || ''} | ${parsedData.github || ''}`, alignment: 'center' }),
                    new Paragraph({ text: " " }),
                    new Paragraph({ text: "Summary", heading: HeadingLevel.HEADING_1 }),
                    new Paragraph({ text: parsedData.summary || '' }),
                    new Paragraph({ text: " " }),
                    new Paragraph({ text: "Work Experience", heading: HeadingLevel.HEADING_1 }),
                    ...(parsedData.experience || []).flatMap(exp => [
                        new Paragraph({ children: [new TextRun({ text: `${exp.jobTitle} at ${exp.company}`, bold: true })] }),
                        new Paragraph({ children: [new TextRun({ text: exp.dates, italics: true })] }),
                        new Paragraph({ text: exp.description || '' }),
                        new Paragraph({ text: " " }),
                    ]),
                    new Paragraph({ text: "Education", heading: HeadingLevel.HEADING_1 }),
                    ...(parsedData.education || []).flatMap(edu => [
                        new Paragraph({ children: [new TextRun({ text: `${edu.degree} from ${edu.school}`, bold: true })] }),
                        new Paragraph({ children: [new TextRun({ text: edu.dates, italics: true })] }),
                        new Paragraph({ text: " " }),
                    ]),
                    new Paragraph({ text: "Skills", heading: HeadingLevel.HEADING_1 }),
                    ...(parsedData.skills || []).map(skill => new Paragraph({ text: skill, bullet: { level: 0 } })),
                ],
            }],
        });
        Packer.toBlob(doc).then(blob => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'resume.docx';
            link.click();
        });
    });

    exportHtmlBtn.addEventListener('click', () => {
        const htmlContent = `
            <!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Resume</title>
            <style>
                body { font-family: sans-serif; }
                .template1 h1 { font-size: 2.5em; color: #333; } .template1 h2 { font-size: 1.5em; color: #555; border-bottom: 2px solid #3498db; }
                .template2 { font-family: 'Georgia', serif; } .template2 h1 { font-size: 2.8em; color: #000; text-align: center; } .template2 h2 { font-size: 1.6em; color: #333; border-bottom: 1px solid #000; }
                .template3 { font-family: 'Montserrat', sans-serif; } .template3 h1 { font-size: 2.6em; color: #fff; background-color: #e74c3c; padding: 10px; } .template3 h2 { font-size: 1.4em; color: #e74c3c; border-left: 3px solid #e74c3c; padding-left: 10px; }
            </style></head><body><div class="${previewContent.className}">${previewContent.innerHTML}</div></body></html>`;
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'resume.html';
        link.click();
    });

    // Export All PDF
    document.getElementById('export-all-pdf').onclick = () => {
        const resumes = getAllResumes();
        if (!resumes.length) return alert('No resumes to export!');
        // Use html2pdf to export all resumes, each on a new page
        const wrapper = document.createElement('div');
        resumes.forEach((resume, idx) => {
            const div = document.createElement('div');
            div.innerHTML = fullResumeHTML(resume.parsed || {});
            div.className = previewContent.className;
            wrapper.appendChild(div);
            if (idx < resumes.length - 1) {
                wrapper.appendChild(document.createElement('hr'));
                wrapper.appendChild(document.createElement('div')).style.pageBreakAfter = 'always';
            }
        });
        html2pdf().from(wrapper).set({
            margin: 1,
            filename: 'all_resumes.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        }).save();
    };
    // Export All DOCX
    document.getElementById('export-all-docx').onclick = () => {
        const resumes = getAllResumes();
        if (!resumes.length) return alert('No resumes to export!');
        const { Document, Packer, Paragraph, TextRun, HeadingLevel } = docx;
        const doc = new Document({
            sections: resumes.map(resume => ({
                children: [
                    new Paragraph({ text: resume.name, heading: HeadingLevel.TITLE, alignment: 'center' }),
                    new Paragraph({ text: `${resume.parsed?.email || ''} | ${resume.parsed?.phone || ''} | ${resume.parsed?.linkedin || ''} | ${resume.parsed?.github || ''}`, alignment: 'center' }),
                    new Paragraph({ text: " " }),
                    new Paragraph({ text: "Summary", heading: HeadingLevel.HEADING_1 }),
                    new Paragraph({ text: resume.parsed?.summary || '' }),
                    new Paragraph({ text: " " }),
                    new Paragraph({ text: "Work Experience", heading: HeadingLevel.HEADING_1 }),
                    ...(resume.parsed?.experience || []).flatMap(exp => [
                        new Paragraph({ children: [new TextRun({ text: `${exp.jobTitle} at ${exp.company}`, bold: true })] }),
                        new Paragraph({ children: [new TextRun({ text: exp.dates, italics: true })] }),
                        new Paragraph({ text: exp.description || '' }),
                        new Paragraph({ text: " " }),
                    ]),
                    new Paragraph({ text: "Education", heading: HeadingLevel.HEADING_1 }),
                    ...(resume.parsed?.education || []).flatMap(edu => [
                        new Paragraph({ children: [new TextRun({ text: `${edu.degree} from ${edu.school}`, bold: true })] }),
                        new Paragraph({ children: [new TextRun({ text: edu.dates, italics: true })] }),
                        new Paragraph({ text: " " }),
                    ]),
                    new Paragraph({ text: "Skills", heading: HeadingLevel.HEADING_1 }),
                    ...(resume.parsed?.skills || []).map(skill => new Paragraph({ text: skill, bullet: { level: 0 } })),
                ],
            }))
        });
        Packer.toBlob(doc).then(blob => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'all_resumes.docx';
            link.click();
        });
    };
    // Export All TXT
    document.getElementById('export-all-txt').onclick = () => {
        const resumes = getAllResumes();
        if (!resumes.length) return alert('No resumes to export!');
        const txt = resumes.map(resume => {
            return (
                `Name: ${resume.parsed?.name || ''}\n` +
                `Email: ${resume.parsed?.email || ''}\n` +
                `Phone: ${resume.parsed?.phone || ''}\n` +
                `LinkedIn: ${resume.parsed?.linkedin || ''}\n` +
                `GitHub: ${resume.parsed?.github || ''}\n` +
                `Summary: ${resume.parsed?.summary || ''}\n` +
                `Experience:\n${(resume.parsed?.experience || []).map(exp => `  - ${exp.jobTitle || ''} at ${exp.company || ''} (${exp.dates || ''}): ${exp.description || ''}`).join('\n')}\n` +
                `Education:\n${(resume.parsed?.education || []).map(edu => `  - ${edu.degree || ''} from ${edu.school || ''} (${edu.dates || ''})`).join('\n')}\n` +
                (resume.parsed?.technicalSkills && resume.parsed.technicalSkills.length ? `Technical Skills: ${resume.parsed.technicalSkills.join(', ')}\n` : '') +
                (resume.parsed?.softSkills && resume.parsed.softSkills.length ? `Soft Skills: ${resume.parsed.softSkills.join(', ')}\n` : '') +
                (resume.parsed?.achievements && resume.parsed.achievements.length ? `Achievements:\n${resume.parsed.achievements.map(a => `  - ${a}`).join('\n')}\n` : '') +
                (resume.parsed?.keyProjects && resume.parsed.keyProjects.length ? `Key Projects:\n${resume.parsed.keyProjects.map(p => `  - ${p}`).join('\n')}\n` : '') +
                `---\n`
            );
        }).join('\n');
        const blob = new Blob([txt], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'all_resumes.txt';
        link.click();
    };
    // Import All TXT
    document.getElementById('import-all-txt').onclick = () => {
        document.getElementById('import-file-txt').click();
    };
    document.getElementById('import-file-txt').onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(evt) {
            try {
                const content = evt.target.result;
                // Split resumes by ---
                const blocks = content.split(/\n-{3,}\n/);
                let resumes = getAllResumes();
                blocks.forEach(block => {
                    if (block.trim()) {
                        // Simple parse: extract fields
                        const name = (block.match(/Name: (.*)/) || [])[1] || '';
                        const email = (block.match(/Email: (.*)/) || [])[1] || '';
                        const phone = (block.match(/Phone: (.*)/) || [])[1] || '';
                        const linkedin = (block.match(/LinkedIn: (.*)/) || [])[1] || '';
                        const github = (block.match(/GitHub: (.*)/) || [])[1] || '';
                        const summary = (block.match(/Summary:([\s\S]*?)Experience:/) || [])[1]?.trim() || '';
                        const experienceBlock = (block.match(/Experience:\n([\s\S]*?)Education:/) || [])[1] || '';
                        const educationBlock = (block.match(/Education:\n([\s\S]*?)Skills:/) || [])[1] || '';
                        const skills = ((block.match(/Skills:([\s\S]*)/) || [])[1] || '').split(',').map(s => s.trim()).filter(Boolean);
                        const experience = experienceBlock.split(/\n/).filter(Boolean).map(line => {
                            const m = line.match(/- (.*?) at (.*?) \((.*?)\): (.*)/);
                            return m ? { jobTitle: m[1], company: m[2], dates: m[3], description: m[4] } : null;
                        }).filter(Boolean);
                        const education = educationBlock.split(/\n/).filter(Boolean).map(line => {
                            const m = line.match(/- (.*?) from (.*?) \((.*?)\)/);
                            return m ? { degree: m[1], school: m[2], dates: m[3] } : null;
                        }).filter(Boolean);
                        const parsed = { name, email, phone, linkedin, github, summary, experience, education, skills };
                        const id = Date.now().toString() + Math.random().toString().slice(2, 8);
                        resumes.unshift({ id, name: name || 'Imported Resume', rawText: block, parsed, updated: new Date().toISOString() });
                    }
                });
                localStorage.setItem('resumeHistory', JSON.stringify(resumes));
                renderHistory();
                alert('Import successful!');
            } catch (err) {
                alert('Failed to import: ' + err.message);
            }
        };
        reader.readAsText(file);
    };

    // Smart Content Suggestions
    document.getElementById('get-suggestions').onclick = async () => {
        let jobRole = prompt('Enter your target job role or industry (e.g., Software Engineer, Marketing, Finance):');
        if (!jobRole) return;
        const suggestionBox = document.getElementById('suggestion-box');
        suggestionBox.style.display = 'block';
        suggestionBox.innerHTML = '<em>Loading suggestions...</em>';
        const apiKey = 'AIzaSyBTUgW-mbIOHIPjpW3xomOfZX5SM3-YmVo';
        const promptText = `For the job role or industry: ${jobRole}, suggest:\n- 5-10 relevant technical skills\n- 5-10 relevant soft skills\n- A strong professional summary\n- 5-10 industry keywords\nFormat as:\nTechnical Skills: ...\nSoft Skills: ...\nSummary: ...\nKeywords: ...`;
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: promptText }] }]
                })
            });
            if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
            const data = await response.json();
            let text = data.candidates[0].content.parts[0].text;
            // Basic formatting for display
            text = text.replace(/Technical Skills:/g, '<b>Technical Skills:</b>')
                       .replace(/Soft Skills:/g, '<b>Soft Skills:</b>')
                       .replace(/Summary:/g, '<b>Summary:</b>')
                       .replace(/Keywords:/g, '<b>Keywords:</b>')
                       .replace(/\n/g, '<br>');
            suggestionBox.innerHTML = text + '<br><button id="close-suggestions" style="margin-top:10px;">Close</button>';
            document.getElementById('close-suggestions').onclick = () => {
                suggestionBox.style.display = 'none';
            };
        } catch (error) {
            suggestionBox.innerHTML = '<span style="color:red">Failed to get suggestions. Please try again.</span>';
        }
    };
}); 