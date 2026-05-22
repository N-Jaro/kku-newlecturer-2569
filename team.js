// team.js - Team Member Directory Logic

// Published Google Sheets CSV URL
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRcdBlMGa0AE8BIs4459jd1zvxJyijj5lDxFk7E-EhT7JyLxl6hC0ntGFeQtN13Xsy9xrzURcYxifIZ/pub?output=csv';

// Configuration toggle: set to false to ONLY show live Google Sheets data (hides local mock data)
const USE_STATIC_MOCKS = false;

// Default static members in Thai
const DEFAULT_MEMBERS = [
    {
        id: 'default-1',
        name: 'ผศ.ดร. อนัญญา ศรีสุข',
        rank: 'ผู้ช่วยศาสตราจารย์',
        department: 'ภาควิชาชีววิทยา คณะวิทยาศาสตร์',
        email: 'ananya.s@kku.ac.th',
        phone: '043-202-111',
        interests: ['พันธุศาสตร์พืช', 'ความหลากหลายทางชีวภาพ'],
        image: 'images/ananya.png',
        team: 'ดารา'
    },
    {
        id: 'default-2',
        name: 'ดร. ชัยวัฒน์ มงคล',
        rank: 'อาจารย์',
        department: 'ภาควิชาวิศวกรรมคอมพิวเตอร์ คณะวิศวกรรมศาสตร์',
        email: 'chaiwat.m@kku.ac.th',
        phone: '043-362-222',
        interests: ['ปัญญาประดิษฐ์และหุ่นยนต์', 'เมืองอัจฉริยะ'],
        image: 'images/chaiwat.png',
        team: 'นครา'
    },
    {
        id: 'default-3',
        name: 'ดร. พลอยไพลิน จินดา',
        rank: 'อาจารย์',
        department: 'คณะเภสัชศาสตร์',
        email: 'ploypailin.j@kku.ac.th',
        phone: '043-203-333',
        interests: ['การค้นหายาใหม่', 'พฤกษเคมี'],
        image: 'images/ploypailin.png',
        team: 'พฤกษา'
    },
    {
        id: 'default-4',
        name: 'ดร. ธนพล รักดี',
        rank: 'อาจารย์',
        department: 'คณะมนุษยศาสตร์และสังคมศาสตร์',
        email: 'thanaphon.r@kku.ac.th',
        phone: '043-204-444',
        interests: ['นโยบายสังคม', 'สังคมวิทยาเมือง'],
        image: 'images/thanaphon.png',
        team: 'ดารา'
    },
    {
        id: 'default-5',
        name: 'ดร. ศิริลักษณ์ วงศ์',
        rank: 'อาจารย์',
        department: 'คณะศึกษาศาสตร์',
        email: 'siriluck.w@kku.ac.th',
        phone: '043-205-555',
        interests: ['เทคโนโลยีการศึกษา', 'สะเต็มศึกษา'],
        image: 'images/siriluck.png',
        team: 'นครา'
    }
];

// State variables
let allMembers = [];
let filteredMembers = [];
let selectedAvatar = '';
const contactStore = new Map();

// SVG Icons to avoid external font loading dependencies
const emailIcon = `
    <svg class="contact-icon" viewBox="0 0 24 24">
        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
    </svg>
`;

const phoneIcon = `
    <svg class="contact-icon" viewBox="0 0 24 24">
        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
    </svg>
`;

// Helper to mask emails safely
function maskEmail(email) {
    if (!email) return '';
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const name = parts[0];
    const domain = parts[1];
    
    if (name.length <= 2) {
        return name[0] + '***@' + domain;
    } else if (name.length <= 4) {
        return name.substring(0, 2) + '***@' + domain;
    } else {
        return name.substring(0, 3) + '***' + name.substring(name.length - 1) + '@' + domain;
    }
}

// Helper to mask phone numbers safely
function maskPhone(phone) {
    if (!phone) return '';
    const clean = phone.trim();
    if (clean.length >= 7) {
        return clean.substring(0, 3) + '-***-' + clean.substring(clean.length - 3);
    }
    return '***-***';
}

// Helper to reveal contact info securely on click
function revealContact(element) {
    if (!element.classList.contains('masked')) return;
    const id = element.getAttribute('data-id');
    const type = element.getAttribute('data-type');
    const contact = contactStore.get(id);
    if (!contact) return;
    
    const realValue = type === 'email' ? contact.email : contact.phone;
    if (!realValue) return;
    
    const textSpan = element.querySelector('.contact-text');
    if (textSpan) {
        textSpan.style.opacity = 0;
    }
    
    setTimeout(() => {
        element.classList.remove('masked');
        element.classList.add('revealed');
        
        if (type === 'email') {
            element.innerHTML = `
                ${emailIcon}
                <a href="mailto:${realValue}" onclick="event.stopPropagation();" class="reveal-fade-in">${realValue}</a>
            `;
        } else {
            element.innerHTML = `
                ${phoneIcon}
                <a href="tel:${realValue}" onclick="event.stopPropagation();" class="reveal-fade-in">${realValue}</a>
            `;
        }
    }, 150);
}
window.revealContact = revealContact;

// Helper to convert Google Drive sharing links to direct image links
function getGoogleDriveDirectLink(url) {
    if (!url) return '';
    const match = url.match(/id=([a-zA-Z0-9_-]+)/);
    if (match) {
        return `https://lh3.googleusercontent.com/d/${match[1]}=s600`;
    }
    // If it's a direct drive link format
    const matchDirect = url.match(/file\/d\/([a-zA-Z0-9_-]+)/);
    if (matchDirect) {
        return `https://lh3.googleusercontent.com/d/${matchDirect[1]}=s600`;
    }
    return url;
}

// Convert CSV record to matching member structure
function mapCSVToMember(record, index) {
    const rawImage = record['อัปโหลดรูปถ่ายหน้าตรงเพื่อการทำงาน / รูปโปรไฟล์ '] || 
                     record['อัปโหลดรูปถ่ายหน้าตรงเพื่อการทำงาน / รูปโปรไฟล์'] || '';
    const directImage = getGoogleDriveDirectLink(rawImage);

    // Parse research interests with robust fallback for different column headers
    const interestsStr = record['  ระบุสาขาวิจัยที่สนใจหลัก (เช่น 3 ถึง 5 หัวข้อหลัก โดยคั่นด้วยเครื่องหมายจุลภาค ,)  '] ||
                        record['ระบุสาขาวิจัยที่สนใจหลัก (เช่น 3 ถึง 5 หัวข้อหลัก โดยคั่นด้วยเครื่องหมายจุลภาค)'] || '';
    const interests = interestsStr.split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

    // Combine department and affiliation
    const dept = record['ภาควิชา / คณะ '] || record['ภาควิชา / คณะ'] || '';
    const affil = record['สังกัด / ชื่อสถาบัน'] || record['สังกัด / ชื่อสถาบัน '] || '';
    let department = dept;
    if (affil && affil.trim() !== dept.trim()) {
        department = `${dept.trim()}, ${affil.trim()}`;
    }

    const nickname = record['ชื่อเล่น หรือ ชื่อที่สะดวกให้เรียกอย่างไม่เป็นทางการ '] || 
                    record['ชื่อเล่น หรือ ชื่อที่สะดวกให้เรียกอย่างไม่เป็นทางการ'] || '';
    const rawName = record['ชื่อ-นามสกุลจริง (ตามที่ปรากฏในเอกสารทางราชการ) '] || 
                    record['ชื่อ-นามสกุลจริง (ตามที่ปรากฏในเอกสารทางราชการ)'] || 'อาจารย์ใหม่';
    const displayName = nickname ? `${rawName.trim()} (${nickname.trim()})` : rawName.trim();

    const team = (record['Team'] || record['Team '] || record['team'] || '').trim();

    return {
        id: `csv-${index}`,
        name: displayName,
        rank: record['ตำแหน่งปัจจุบัน / ตำแหน่งทางวิชาการ '] || record['ตำแหน่งปัจจุบัน / ตำแหน่งทางวิชาการ'] || 'อาจารย์',
        department: department || 'หน่วยงานทั่วไป',
        email: record['อีเมลหลักสำหรับติดต่อประสานงาน (หรือ อีเมลทางการ) '] || record['อีเมลหลักสำหรับติดต่อประสานงาน (หรือ อีเมลทางการ)'] || '',
        phone: record['เบอร์โทรศัพท์ที่ทำงาน หรือ เบอร์ติดต่อหลัก '] || record['เบอร์โทรศัพท์ที่ทำงาน หรือ เบอร์ติดต่อหลัก'] || '',
        interests: interests.length > 0 ? interests : ['วิจัย'],
        image: directImage || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop',
        team: team
    };
}


// Helper to get CSS class name for teams
function getTeamClass(teamName) {
    if (!teamName) return '';
    const name = teamName.toLowerCase().trim();
    if (name.includes('ดารา') || name.includes('dara')) return 'team-dara';
    if (name.includes('นครา') || name.includes('nakara')) return 'team-nakara';
    if (name.includes('พฤกษา') || name.includes('phrueksa')) return 'team-phrueksa';
    return '';
}

// Toggle Image Fit (Cover / Contain)
function toggleImageFit(button) {
    const wrapper = button.closest('.card-image-wrapper');
    if (!wrapper) return;
    
    wrapper.classList.toggle('fit-contain');
    
    // Save preference to localStorage
    const card = wrapper.closest('.team-card');
    if (card) {
        const id = card.getAttribute('data-id');
        const isContain = wrapper.classList.contains('fit-contain');
        localStorage.setItem(`image_fit_${id}`, isContain ? 'contain' : 'cover');
    }
}
window.toggleImageFit = toggleImageFit;

// Generate the HTML for a single member card with privacy masking
function createMemberCardHTML(member) {
    const teamClass = getTeamClass(member.team);
    const cardTeamClass = teamClass ? ` card-${teamClass}` : '';

    // Check saved image fit preference
    const savedFit = localStorage.getItem(`image_fit_${member.id}`);
    const fitClass = savedFit === 'contain' ? ' fit-contain' : '';

    // Save actual details in secure mapping (avoids direct web scraper harvest)
    contactStore.set(member.id, { email: member.email, phone: member.phone });

    // Format tags
    const tagsHTML = member.interests.map(interest => `<span class="interest-tag">${interest}</span>`).join('');

    return `
        <div class="team-card${cardTeamClass}" data-id="${member.id}">
            <div class="card-image-wrapper${fitClass}">
                <button class="image-fit-toggle" title="ปรับขนาดรูปภาพ (เต็มจอ / พอดีจอ)" onclick="event.stopPropagation(); toggleImageFit(this);">
                    <svg viewBox="0 0 24 24">
                        <path d="M15 21h6v-6h-2v4h-4v2zM9 21H3v-6h2v4h4v2zM15 3h6v6h-2V5h-4V3zM9 3H3v6h2V5h-4V3z"/>
                    </svg>
                </button>
                <img src="${member.image}" alt="${member.name}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop';">
            </div>
            <div class="card-info">
                <div class="member-name">${member.name}</div>
                <div class="member-meta">
                    <span class="member-rank">${member.rank}</span>
                    ${member.team ? `<span class="team-badge ${teamClass}">กลุ่ม${member.team}</span>` : ''}
                </div>
                <div class="member-dept">${member.department}</div>
                
                <div class="contact-list">
                    ${member.email ? `
                    <div class="contact-item masked" data-type="email" data-id="${member.id}" onclick="revealContact(this)" title="คลิกเพื่อแสดงอีเมล">
                        ${emailIcon}
                        <span class="contact-text">${maskEmail(member.email)} <span class="reveal-hint">(คลิกเพื่อดู)</span></span>
                    </div>` : ''}
                    ${member.phone ? `
                    <div class="contact-item masked" data-type="phone" data-id="${member.id}" onclick="revealContact(this)" title="คลิกเพื่อแสดงเบอร์โทร">
                        ${phoneIcon}
                        <span class="contact-text">${maskPhone(member.phone)} <span class="reveal-hint">(คลิกเพื่อดู)</span></span>
                    </div>` : ''}
                </div>
                
                ${member.interests && member.interests.length > 0 ? `
                <div class="interests-section">
                    <div class="interests-label">สาขาวิจัยที่สนใจ</div>
                    <div class="interests-tags">
                        ${tagsHTML}
                    </div>
                </div>` : ''}
            </div>
        </div>
    `;
}

// Render the grid with filtered members
function renderGrid() {
    const grid = document.getElementById('team-grid');
    if (!grid) return;

    grid.innerHTML = '';

    // Render filtered members
    filteredMembers.forEach(member => {
        grid.innerHTML += createMemberCardHTML(member);
    });

}

// Dynamically populate the Department/Faculty dropdown options
function populateFilterOptions() {
    const deptSelect = document.getElementById('filter-dept');
    if (!deptSelect) return;

    // Get unique departments/faculties
    const depts = new Set();
    allMembers.forEach(m => {
        // Extract faculty name if it contains a comma (like "Dept, Faculty")
        let displayDept = m.department;
        if (displayDept.includes(', ')) {
            displayDept = displayDept.split(', ')[1]; // Get the main Faculty
        }
        depts.add(displayDept);
    });

    // Reset and add default option
    deptSelect.innerHTML = '<option value="">ทุกคณะและหน่วยงาน</option>';

    // Sort and add options
    Array.from(depts).sort().forEach(dept => {
        const opt = document.createElement('option');
        opt.value = dept;
        opt.textContent = dept;
        deptSelect.appendChild(opt);
    });
}

// Perform search and filter
function filterMembers() {
    const searchVal = document.getElementById('search-input').value.toLowerCase().trim();
    const deptVal = document.getElementById('filter-dept').value.toLowerCase();
    const teamSelect = document.getElementById('filter-team');
    const teamVal = teamSelect ? teamSelect.value.trim() : '';

    filteredMembers = allMembers.filter(member => {
        // Match Search Query (matches name, rank, department, interests, or team)
        const nameMatch = member.name.toLowerCase().includes(searchVal);
        const rankMatch = member.rank.toLowerCase().includes(searchVal);
        const deptMatch = member.department.toLowerCase().includes(searchVal);
        const teamMatch = (member.team || '').toLowerCase().includes(searchVal);
        const interestsMatch = member.interests.some(tag => tag.toLowerCase().includes(searchVal));

        const matchesSearch = !searchVal || nameMatch || rankMatch || deptMatch || teamMatch || interestsMatch;

        // Match Department Dropdown
        const matchesDept = !deptVal || member.department.toLowerCase().includes(deptVal);

        // Match Team Dropdown
        const matchesTeam = !teamVal || (member.team || '') === teamVal;

        return matchesSearch && matchesDept && matchesTeam;
    });

    renderGrid();
}

// Toast System
function showToast(message) {
    const toast = document.getElementById('toast');
    const toastText = document.getElementById('toast-text');
    if (!toast || !toastText) return;

    toastText.textContent = message;
    toast.classList.add('active');

    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}

// Share Directory Action
function shareDirectory() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        showToast('คัดลอกลิงก์แชร์ทำเนียบไปยังคลิปบอร์ดแล้ว!');
    }).catch(err => {
        console.error('Failed to copy directory link: ', err);
        showToast('ไม่สามารถคัดลอกลิงก์ได้ กรุณาคัดลอก URL จากเบราว์เซอร์โดยตรง');
    });
}

// Render shimmering skeleton loading cards
function renderSkeletons() {
    const grid = document.getElementById('team-grid');
    if (!grid) return;
    
    let skeletonsHTML = '';
    for (let i = 0; i < 3; i++) {
        skeletonsHTML += `
            <div class="team-card skeleton-card">
                <div class="card-image-wrapper skeleton-shimmer" style="height: 350px;"></div>
                <div class="card-info">
                    <div class="skeleton-shimmer" style="height: 24px; width: 60%; margin-bottom: 12px; border-radius: 4px;"></div>
                    <div class="skeleton-shimmer" style="height: 16px; width: 40%; margin-bottom: 8px; border-radius: 4px;"></div>
                    <div class="skeleton-shimmer" style="height: 16px; width: 80%; margin-bottom: 24px; border-radius: 4px;"></div>
                    <div class="contact-list" style="margin-bottom: 20px;">
                        <div class="skeleton-shimmer" style="height: 14px; width: 60%; margin-bottom: 8px; border-radius: 4px;"></div>
                        <div class="skeleton-shimmer" style="height: 14px; width: 50%; border-radius: 4px;"></div>
                    </div>
                </div>
            </div>
        `;
    }
    grid.innerHTML = skeletonsHTML;
}

// Initialization and fetching data
function init() {
    // 1. Load mock data if enabled
    allMembers = [...(USE_STATIC_MOCKS ? DEFAULT_MEMBERS : [])];
    filteredMembers = [...allMembers];

    // Initial render: show existing members or skeleton loader if empty
    if (allMembers.length > 0) {
        renderGrid();
        populateFilterOptions();
    } else {
        renderSkeletons();
    }

    // 2. Fetch Google Sheets CSV data
    Papa.parse(CSV_URL, {
        download: true,
        header: true,
        complete: function (results) {
            console.log('Raw CSV data fetched from Google Sheets:', results);
            if (results && results.data) {
                // Filter out empty rows and map to member structures
                const csvMembers = results.data
                    .filter(row => row['ชื่อ-นามสกุลจริง (ตามที่ปรากฏในเอกสารทางราชการ) '] && row['ชื่อ-นามสกุลจริง (ตามที่ปรากฏในเอกสารทางราชการ) '].trim() !== '')
                    .map((row, idx) => mapCSVToMember(row, idx));

                // TEMPORARILY DISABLED DEDUPLICATION: Append all CSV entries directly to show all rows
                csvMembers.forEach(csvMem => {
                    allMembers.push(csvMem);
                });

                // Update UI
                populateFilterOptions();
                filterMembers();

                // Update header sync indicator to "Synced" and fade it out
                const indicator = document.getElementById('sync-indicator');
                const syncText = document.getElementById('sync-text');
                if (indicator && syncText) {
                    indicator.className = 'sync-indicator synced';
                    syncText.textContent = 'ซิงค์แล้ว';
                    setTimeout(() => {
                        indicator.classList.add('hidden');
                    }, 2000);
                }
            }
        },
        error: function (err) {
            console.error('Error fetching CSV data: ', err);
            showToast('ไม่สามารถโหลดข้อมูลทำเนียบจาก Google Sheets ได้');

            // Update header sync indicator to offline/error status
            const indicator = document.getElementById('sync-indicator');
            const syncText = document.getElementById('sync-text');
            if (indicator && syncText) {
                indicator.className = 'sync-indicator error';
                syncText.textContent = 'ออฟไลน์';
            }
        }
    });

    // 3. Register Event Listeners
    // Filter Panel Toggle
    const filterBtn = document.getElementById('filter-toggle-btn');
    const filterPanel = document.getElementById('filter-panel');
    if (filterBtn && filterPanel) {
        filterBtn.addEventListener('click', () => {
            filterPanel.classList.toggle('active');
        });
    }

    // Input listeners for filter/search
    document.getElementById('search-input').addEventListener('input', filterMembers);
    document.getElementById('filter-dept').addEventListener('change', filterMembers);
    document.getElementById('filter-team').addEventListener('change', filterMembers);

    // Share Directory Button
    document.getElementById('share-btn').addEventListener('click', shareDirectory);
}

// Start execution when DOM is ready
document.addEventListener('DOMContentLoaded', init);
