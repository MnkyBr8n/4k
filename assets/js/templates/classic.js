// Classic Template JavaScript

function renderClassicTemplate(data) {
    return `
        <div class="classic-card">
            <!-- Photo at Top (Center) -->
            <div class="photo-container">
                <img src="${data.photo || 'assets/placeholder.jpg'}" alt="${data.name}" class="character-photo">
            </div>

            <!-- Content Section -->
            <div class="card-content">
                <!-- Name -->
                <div class="character-name">${data.name}</div>
                
                <!-- Age -->
                <div class="character-age">Age: ${data.age}</div>

                <!-- Bio -->
                <div class="bio-section">
                    <div class="bio-title">
                        <span>✨</span>
                        <span>About</span>
                    </div>
                    <div class="bio-text">
                        ${data.bio || 'No bio provided.'}
                    </div>
                </div>

                <!-- Link Button -->
                <button class="view-button" onclick="window.location.href='${data.link || '#'}'">
                    View Character
                </button>
            </div>
        </div>
    `;
}