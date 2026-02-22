const API_URL = 'http://localhost:8000/api/bookmarks'; // Expected backend local URL
const CATEGORIES_API_URL = 'http://localhost:8000/api/categories';
let allBookmarks = [];
let backendCategories = [];

const container = document.getElementById('bookmarksContainer');
const loading = document.getElementById('loadingIndicator');
const searchInput = document.getElementById('searchInput');
const categoryBar = document.getElementById('categoryBar');

let currentCategory = 'All';

// Date Formatter
const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

// Delete logic
const deleteBookmark = async (id) => {
    if (!confirm('Are you sure you want to delete this save?')) return;
    try {
        const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (res.ok) {
            allBookmarks = allBookmarks.filter(b => b.id !== id);
            renderBookmarks(allBookmarks);
        } else {
            console.error('Failed to delete');
        }
    } catch (e) {
        console.error('Error deleting:', e);
    }
};

// Render Card HTML
const createCardElement = (bookmark) => {
    const card = document.createElement('div');
    card.className = 'bookmark-card';

    const tagsHTML = bookmark.tags.map(tag => `<span class="tag">${tag}</span>`).join('');

    let embedHtml = '';
    let platformIcon = 'fa-instagram';
    let platformColor = '#e1306c'; // Default Instagram color

    try {
        const urlString = bookmark.url;
        let isYouTube = urlString.includes('youtube.com') || urlString.includes('youtu.be');

        if (isYouTube) {
            platformIcon = 'fa-youtube';
            platformColor = '#ff0000';

            let videoId = '';
            const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i;
            const match = urlString.match(ytRegex);
            if (match && match[1]) {
                videoId = match[1];
            }

            if (videoId) {
                embedHtml = `
                    <div style="background: rgba(255, 0, 0, 0.05); border: 1px solid rgba(255, 0, 0, 0.2); border-radius: 12px; padding: 2.5rem 1rem; text-align: center; margin-top: 0.5rem; display: flex; flex-direction: column; align-items: center; justify-content: center; backdrop-filter: blur(5px);">
                        <i class="fa-brands fa-youtube" style="font-size: 2.8rem; color: #ff0000; margin-bottom: 0.8rem; filter: drop-shadow(0 0 8px rgba(255,0,0,0.4));"></i>
                        <h3 style="margin-bottom: 0.4rem; font-size: 1.15rem; color: #ffffff;">YouTube Media</h3>
                        <p style="color: var(--text-secondary); margin-bottom: 1.5rem; font-size: 0.9rem; max-width: 80%;">Embedded playback is restricted by YouTube. Click below to watch the full video.</p>
                        <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" style="background: #ff0000; color: white; text-decoration: none; padding: 0.7rem 1.8rem; border-radius: 50px; font-weight: 600; font-size: 0.95rem; display: inline-flex; align-items: center; transition: all 0.2s ease; box-shadow: 0 4px 15px rgba(255,0,0,0.2);" onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 8px 25px rgba(255,0,0,0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(255,0,0,0.2)';">
                            Watch on YouTube <i class="fa-solid fa-arrow-right" style="margin-left: 0.6rem;"></i>
                        </a>
                    </div>
                `;
            }
        } else {
            // Assume Instagram or fallback
            platformIcon = 'fa-instagram';
            platformColor = '#e1306c';

            const urlObj = new URL(urlString);
            urlObj.search = ''; // Strip search query params for Instagram 
            let cleanUrl = urlObj.toString();
            if (cleanUrl.endsWith('/')) cleanUrl = cleanUrl.slice(0, -1);

            embedHtml = `
                <div class="embed-container" onmouseenter="this.querySelector('iframe').style.pointerEvents='auto'" onmouseleave="this.querySelector('iframe').style.pointerEvents='none'">
                    <iframe src="${cleanUrl}/embed" width="100%" height="450" frameborder="0" scrolling="no" allowtransparency="true" style="border-radius:12px; border:1px solid rgba(255,255,255,0.1); margin-top:0.5rem; pointer-events: none;"></iframe>
                </div>
            `;
        }
    } catch (e) {
        console.error("No valid URL found to embed", e);
    }

    const userNoteHtml = bookmark.user_note ? `
        <div class="user-note">
            <i class="fa-solid fa-comment-dots"></i>
            <span>${bookmark.user_note}</span>
        </div>
    ` : '';

    card.innerHTML = `
        <div class="card-header">
            <div style="display:flex; align-items:center; gap:0.5rem; width:100%; justify-content:space-between">
                <div>
                   <i class="fa-brands ${platformIcon} platform-icon" style="color: ${platformColor} !important;"></i>
                   <span class="date" style="margin-left:0.5rem;">${formatDate(bookmark.timestamp)}</span>
                </div>
                <button onclick="deleteBookmark(${bookmark.id})" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:1.1rem;" title="Delete post">
                   <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
        ${embedHtml}
        <div class="summary" style="margin-top: 0.5rem;">${bookmark.summary}</div>
        <div class="caption-preview">${bookmark.caption}</div>
        ${userNoteHtml}
        <div class="tags-container">
            ${tagsHTML}
        </div>
        <a href="${bookmark.url}" target="_blank" class="url-link">
            Open Original Post <i class="fa-solid fa-arrow-up-right-from-square"></i>
        </a>
    `;

    return card;
};

// Render List of Cards
const renderBookmarks = (bookmarksToRender) => {
    container.innerHTML = ''; // Clear container
    if (bookmarksToRender.length === 0) {
        container.innerHTML = '<p style="text-align:center;width:100%;color:var(--text-secondary);grid-column: 1 / -1;">No bookmarks found.</p>';
        return;
    }
    bookmarksToRender.forEach(b => {
        container.appendChild(createCardElement(b));
    });
};

// Fetch Data from Backend
const fetchBookmarks = async () => {
    try {
        loading.classList.remove('hidden');
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('Failed to fetch data');
        allBookmarks = await res.json();

        // Render dummy data if none exists
        if (allBookmarks.length === 0) {
            allBookmarks = [
                {
                    id: 1,
                    url: "https://instagram.com/p/mock123",
                    caption: "The secret to 10x your coding productivity is consistency. Write code every single day. #coding #productivity #developer",
                    tags: ["Coding", "Productivity"],
                    summary: "Consistency in daily coding significantly boosts productivity.",
                    timestamp: new Date().toISOString()
                },
                {
                    id: 2,
                    url: "https://instagram.com/p/mock456",
                    caption: "Healthy meal prep for the week: Chicken, rice, and broccoli. Simple but effective. #fitness #food #mealprep",
                    tags: ["Fitness", "Food"],
                    summary: "A simple meal prep plan featuring chicken, rice, and broccoli.",
                    timestamp: new Date(Date.now() - 86400000).toISOString()
                }
            ];
        }

        renderBookmarks(allBookmarks);
        renderCategories();
    } catch (err) {
        console.error(err);
        container.innerHTML = '<p style="text-align:center;width:100%;color:#ef4444;">Could not load bookmarks. Ensure the backend is running.</p>';
    } finally {
        loading.classList.add('hidden');
    }
};

// Fetch Categories
const fetchCategories = async () => {
    try {
        const res = await fetch(CATEGORIES_API_URL);
        if (res.ok) {
            backendCategories = await res.json();
        } else {
            backendCategories = ['Gaming', 'Music', 'Sports', 'Tech', 'Memes', 'Fitness', 'Nutrition', 'Lifestyle', 'Others'];
        }
    } catch (err) {
        console.error(err);
        backendCategories = ['Gaming', 'Music', 'Sports', 'Tech', 'Memes', 'Fitness', 'Nutrition', 'Lifestyle', 'Others'];
    }
    renderCategories();
};

// Add Category
const addNewCategory = async () => {
    const name = prompt("Enter a name for the new category:");
    if (!name || name.trim() === "") return;

    try {
        const res = await fetch(CATEGORIES_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name.trim() })
        });

        if (res.ok) {
            await fetchCategories(); // Refresh list
        } else {
            alert("Failed to add category");
        }
    } catch (e) {
        console.error(e);
        alert("Error adding category");
    }
};

// Render Categories
const renderCategories = () => {
    if (!categoryBar) return;

    categoryBar.innerHTML = '';

    // Always insert 'All' at the start
    const displayCategories = ['All', ...backendCategories];
    const cleanList = displayCategories.filter(c => c.toLowerCase() !== 'others');
    cleanList.push('Others');

    cleanList.forEach(tag => {
        const btn = document.createElement('button');
        btn.className = `category-btn ${currentCategory === tag ? 'active' : ''}`;
        btn.textContent = tag;
        btn.onclick = () => {
            currentCategory = tag;
            renderCategories(); // Update active class quickly
            filterBookmarks();
        };
        categoryBar.appendChild(btn);
    });

    // Add "+" button
    const addBtn = document.createElement('button');
    addBtn.className = 'category-btn';
    addBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add';
    addBtn.style.border = '1px dashed var(--border-color)';
    addBtn.style.color = 'var(--text-secondary)';
    addBtn.onclick = addNewCategory;
    categoryBar.appendChild(addBtn);
};

// Master Filter Function (Search + Category)
const filterBookmarks = () => {
    const term = searchInput.value.toLowerCase();

    const filtered = allBookmarks.filter(b => {
        // 1. Check Category Match
        const predefined = backendCategories.map(c => c.toLowerCase());
        const isOthers = b.tags && b.tags.length > 0 && !predefined.includes(b.tags[0].toLowerCase());

        const matchesCategory = currentCategory === 'All' ||
            (b.tags && b.tags.length > 0 && b.tags[0].toLowerCase() === currentCategory.toLowerCase()) ||
            (currentCategory === 'Others' && isOthers);

        // 2. Check Search Match
        const inSummary = (b.summary || "").toLowerCase().includes(term);
        const inCaption = (b.caption || "").toLowerCase().includes(term);
        const inTags = b.tags ? b.tags.some(tag => tag.toLowerCase().includes(term)) : false;
        const matchesSearch = term === '' || inSummary || inCaption || inTags;

        return matchesCategory && matchesSearch;
    });

    renderBookmarks(filtered);
};

// Search Filter Logic
searchInput.addEventListener('input', () => {
    filterBookmarks();
});

// Landing Page Animation Logic
const runLandingAnimation = () => {
    return new Promise(resolve => {
        const overlay = document.getElementById('landingOverlay');
        const welcomeText = document.getElementById('landingWelcome');
        const promptText = document.getElementById('landingPrompt');
        const searchElement = document.querySelector('.search-container');

        // Initial phase: Welcome Text
        setTimeout(() => {
            welcomeText.classList.add('visible');

            setTimeout(() => {
                welcomeText.classList.remove('visible');

                // Second phase: Search Bar Highlight
                setTimeout(() => {
                    overlay.classList.add('highlight-mode');
                    searchElement.classList.add('highlighted');

                    // Position Prompt Text slightly below search bar
                    const searchRect = searchElement.getBoundingClientRect();
                    promptText.style.top = (searchRect.bottom + 40) + 'px';
                    promptText.classList.add('visible');

                    // Final phase: Main site reveal
                    setTimeout(() => {
                        promptText.classList.remove('visible');
                        overlay.classList.add('fade-out');
                        searchElement.classList.remove('highlighted');

                        setTimeout(() => {
                            overlay.style.display = 'none';
                            resolve();
                        }, 1000); // Overlay fade duration

                    }, 3500); // Time to show the prompt

                }, 1000); // Time between welcome text leaving and highlight starting

            }, 2500); // Time welcome text is shown
        }, 300); // Small initial delay
    });
};

// Init
const initApp = async () => {
    // We render bookmarks immediately behind the overlay
    await Promise.all([fetchCategories(), fetchBookmarks()]);
    filterBookmarks();

    // Play animation
    await runLandingAnimation();

    // First-time visit hover tip notification
    if (!localStorage.getItem('sawHoverTip')) {
        const note = document.createElement('div');
        note.innerHTML = `
            <div style="position:fixed; bottom:40px; right:40px; background:var(--accent); color:white; padding:1.2rem 2rem; border-radius:16px; box-shadow:0 15px 35px rgba(0,0,0,0.5); z-index:100; display:flex; gap:1.2rem; align-items:center; animation: float 3s infinite ease-in-out alternate; border: 1px solid rgba(255,255,255,0.2);">
                <i class="fa-solid fa-play" style="font-size:1.8rem; color:#fff;"></i>
                <div>
                   <h3 style="margin-bottom:0.3rem; font-size:1.2rem;">Watch right here!</h3>
                   <p style="font-size:0.95rem; opacity:0.9; margin:0; line-height: 1.4;">Just hover your mouse over any reel to wake up<br/>the player and watch it instantly.</p>
                </div>
                <button onclick="this.parentElement.remove(); localStorage.setItem('sawHoverTip', 'true')" style="background:none; border:none; color:rgba(255,255,255,0.7); cursor:pointer; font-size:1.5rem; margin-left:1rem; transition:color 0.2s;"><i class="fa-solid fa-xmark"></i></button>
            </div>
        `;
        document.body.appendChild(note);
    }
};

initApp();
